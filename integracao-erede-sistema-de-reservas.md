# Integração e.Rede (Rede / Itaú) com um Sistema de Reservas

**Objetivo:** documentar como desenvolver um fluxo em que o cliente paga com cartão via checkout transparente da e.Rede e, somente após a confirmação do pagamento, a reserva é criada no sistema de reservas (que expõe uma API própria de "criar reserva").

---

## 1. Resumo executivo

A e.Rede é o gateway de pagamentos da Rede (grupo Itaú). Para o cenário descrito, dois pontos definem toda a arquitetura:

1. **Checkout transparente:** sim, é suportado nativamente. Você coleta os dados do cartão no seu próprio front-end/back-end e envia para a API. O cliente nunca é redirecionado para uma página da Rede (exceto na etapa de autenticação 3DS, quando aplicável). Em troca, o seu ambiente precisa ser aderente ao **PCI DSS**, porque os dados de cartão passam pelo seu servidor.

2. **Confirmação do pagamento:** a autorização do cartão é **síncrona**. Diferente de gateways como Stripe ou Mercado Pago, a e.Rede **não oferece um webhook genérico e confiável de status de venda**. O resultado da venda volta na própria resposta HTTP (`returnCode = "00"` significa aprovada). As notificações assíncronas (callbacks) existem sobretudo no fluxo de **cancelamento/estorno**. Portanto, o gatilho para criar a reserva deve se basear na **resposta síncrona da autorização** e, como rede de segurança, no **endpoint de consulta** — e não em um webhook.

A recomendação central deste documento é usar **pré-autorização + captura posterior** (em vez de captura automática), de modo que o cartão só seja efetivamente cobrado depois que a reserva for criada com sucesso. Isso elimina o pior cenário possível: cobrar o cliente e não conseguir gerar a reserva.

---

## 2. Conceitos da API e.Rede

### 2.1 Ambientes
- **Sandbox / homologação:** usado para certificação antes de ir para produção. A Rede exige certificar o parceiro em homologação antes de liberar produção.
- **Produção.**

As credenciais são um par **PV (filiação)** e **Token**, obtidos junto à Rede.

### 2.2 Autenticação
- Para as operações transacionais, autenticação **Basic** no header `Authorization`, concatenando `PV:Token` e convertendo para Base64.
- Para serviços de tokenização (Token Requestor / Click to Pay), usa-se **OAuth 2.0**.

### 2.3 Operações principais
A API trabalha de forma REST sobre o recurso de transações (`/v2/transactions`):

| Operação | Método | Descrição |
|---|---|---|
| Autorização | `POST` | Sensibiliza o limite do cartão. Pode capturar automaticamente ou não. |
| Captura | `PUT` | Confirma uma autorização e gera a cobrança na fatura. |
| Autorização com captura automática | `POST` | Autoriza e confirma em uma só chamada. |
| Consulta por TID | `GET` | `/v2/transactions/{tid}` |
| Consulta por referência | `GET` | `/v2/transactions?reference={seu_pedido}` |
| Cancelamento / estorno | `POST` | Cancela uma transação (retorno assíncrono — callback). |
| Consulta de cancelamento | `GET` | Verifica o status do cancelamento. |

Recursos adicionais suportados pelos SDKs oficiais: **3DS2**, **zero dollar** (validação de cartão sem cobrança), **IATA**, **MCC dinâmico** e **parcelamento**.

### 2.4 Captura automática x captura posterior
- **Captura automática:** o valor é confirmado na hora; a cobrança aparece imediatamente na fatura do portador.
- **Captura posterior (pré-autorização):** o valor apenas "reserva" o limite do cartão, sem gerar cobrança, até que você confirme com a captura. Há prazo para capturar (pré-autorizações pendentes podem ser consultadas por até 60 dias). **É o modelo recomendado para reservas.**

### 2.5 Códigos de retorno relevantes
- `00` — transação **autorizada** com sucesso.
- `220` — transação requer **autenticação 3DS**; você deve redirecionar o cliente para a URL retornada.
- `359` — transação **cancelada** com sucesso.
- Códigos HTTP: `2xx` sucesso, `4xx` erro na requisição, `5xx` erro no servidor. Em caso de `HTTP 401`, o token OAuth expirou e precisa ser renovado.

### 2.6 Prazos de consulta
- Por **TID**: dados visíveis por até **400 dias**.
- Por **reference**: até **60 dias** (débito/crédito) e **90 dias** (Pix).

### 2.7 SDKs oficiais
Disponíveis no GitHub da Rede (`github.com/DevelopersRede`): PHP, Node.js, Java, C#, Python e Ruby. Eles encapsulam autenticação, montagem das requisições e parsing das respostas. Recomenda-se usar o SDK em vez de montar as chamadas HTTP "na mão".

---

## 3. Arquitetura da integração

Componentes envolvidos:

- **Front-end (checkout)** — formulário de cartão no seu domínio.
- **Back-end (orquestrador)** — recebe os dados, fala com a e.Rede, fala com o sistema de reservas e mantém a máquina de estados do pedido.
- **API e.Rede** — autoriza, captura, cancela, consulta.
- **API do Sistema de Reservas** — cria/consulta/cancela a reserva.
- **Banco de dados do pedido** — armazena o vínculo entre pedido, transação (TID/reference) e reserva.

Fluxo de alto nível (sequência):

```
Cliente        Front-end       Back-end (orquestrador)      e.Rede            Sistema de Reservas
  |  escolhe quarto/datas  |                |                   |                      |
  |----------------------->|                |                   |                      |
  |   preenche cartão      |                |                   |                      |
  |----------------------->|--- dados ----->|                   |                      |
  |                        |                |-- PRE-AUTORIZA -->|                      |
  |                        |                |<--- returnCode ---|                      |
  |                        |                |   (00 aprovado)   |                      |
  |                        |                |------------- CRIA RESERVA -------------->|
  |                        |                |<------------ reserva OK -----------------|
  |                        |                |--- CAPTURA ------>|                      |
  |                        |                |<-- 00 capturada --|                      |
  |<-------- confirmação (reserva + pagamento OK) --------------|                      |
```

Se a criação da reserva falhar após a pré-autorização, o back-end **cancela a pré-autorização** na e.Rede (liberando o limite do cliente) e informa a falha. Esse é o padrão de **compensação (saga)**.

---

## 4. Fluxo recomendado, passo a passo

### Passo 1 — Criar o pedido (estado inicial)
Antes de qualquer chamada à e.Rede, crie um registro de pedido no seu banco com:
- um identificador único de pedido que será usado como `reference` na e.Rede (ex.: `RES-2026-000123`);
- estado `AGUARDANDO_PAGAMENTO`;
- dados da reserva pretendida (quarto, datas, hóspede, valor).

O `reference` é a sua **chave de idempotência**. Sempre o mesmo para o mesmo pedido.

### Passo 2 — Pré-autorizar (sem captura)
Envie a autorização com `capture = false`. Isso reserva o limite, mas ainda não cobra.

- Se `returnCode == "00"` → guarde o **TID** retornado, atualize o estado para `PAGAMENTO_PRE_AUTORIZADO` e siga para o Passo 3.
- Se `returnCode == "220"` → é necessária autenticação 3DS. Vá para a Seção 5.
- Qualquer outro código → estado `PAGAMENTO_RECUSADO`, informe o cliente, **não** crie reserva.

### Passo 3 — Criar a reserva no sistema nativo
Com o pagamento pré-autorizado, chame a API de criar reserva, enviando junto o seu `reference` (para rastreabilidade e idempotência do lado da reserva também).

- Reserva criada com sucesso → guarde o ID da reserva, vá para o Passo 4.
- Falha ao criar reserva (ex.: quarto ficou indisponível por concorrência, ou a API caiu) → vá para o Passo 5 de compensação.

### Passo 4 — Capturar o pagamento
Com a reserva garantida, **capture** a transação (`PUT` informando o TID). Só agora o cliente é efetivamente cobrado.

- Captura `00` → estado `CONFIRMADO`. Envie a confirmação ao cliente (reserva + pagamento).
- Falha na captura → tente novamente (retry com backoff). Se persistir, acione alerta operacional: você tem uma reserva criada e um pagamento ainda não capturado (situação recuperável dentro do prazo de captura).

### Passo 5 — Compensação (rollback)
Se a reserva **não** pôde ser criada após a pré-autorização:
- **Cancele a pré-autorização** na e.Rede para liberar o limite do cliente.
- Atualize o estado para `FALHA_RESERVA` e informe o cliente que o pagamento não foi efetivado.

Como você usou **pré-autorização (sem captura)**, na maioria dos casos o cliente sequer chega a ser cobrado — apenas tem o limite liberado. É por isso que esse modelo é preferível à captura automática.

> **Alternativa com captura automática:** se por restrição de negócio você precisar capturar de imediato, o fluxo inverte o risco — em caso de falha na reserva, será preciso **estornar** (cancelar) a transação já capturada, e o cliente verá a cobrança e o estorno na fatura. Funciona, mas gera mais atrito e exige tratamento de estorno robusto.

---

## 5. Tratamento da autenticação 3DS

3DS (3-D Secure) é a autenticação do portador junto ao emissor. É **obrigatória para débito** e **opcional (porém recomendada) para crédito**, pois ajuda na conversão e na proteção contra fraude/chargeback.

Quando a autorização retorna `returnCode == "220"`:
1. A resposta traz uma **URL de autenticação**. Redirecione o cliente para ela.
2. Você precisa ter informado previamente, na requisição, as **URLs de retorno** de sucesso e de falha (ex.: `.../3ds/success` e `.../3ds/failure`).
3. Após autenticar, o cliente volta para a sua URL de retorno e você **finaliza/consulta** a transação para saber o resultado real.
4. A partir daí, o fluxo segue igual: aprovado → cria reserva → captura.

Esse é o único momento em que o cliente "sai" do seu ambiente, ainda assim de forma controlada e padronizada pela bandeira.

---

## 6. Idempotência e reconciliação (essencial)

Como a confirmação não vem por webhook confiável, e como falhas de rede acontecem (você pode não receber a resposta de uma autorização que, no entanto, foi aprovada do lado da Rede), trate dois mecanismos:

### 6.1 Idempotência
- Use sempre o mesmo `reference` por pedido.
- Antes de autorizar uma retentativa, **consulte por reference** (`GET /v2/transactions?reference=...`). Se já existir transação aprovada, **não** autorize de novo — apenas prossiga a partir do estado correto. Isso evita cobrança e reserva duplicadas.
- Do lado do sistema de reservas, idealmente a API de criar reserva também deve aceitar uma chave de idempotência (o seu `reference`), para não criar duas reservas iguais.

### 6.2 Job de reconciliação
Crie uma rotina periódica (ex.: a cada poucos minutos) que:
- busca pedidos "presos" em estados intermediários (`PAGAMENTO_PRE_AUTORIZADO` sem reserva, ou `RESERVA_CRIADA` sem captura, há mais de X minutos);
- consulta a e.Rede por `reference`/TID para descobrir o estado real;
- conclui o fluxo (captura, criação da reserva, cancelamento ou alerta).

Esse job é a sua verdadeira garantia de consistência — ele substitui o papel que um webhook teria em outros gateways.

---

## 7. Webhook / notificações na e.Rede — o que realmente existe

Para alinhar expectativas:

- **Venda no cartão (crédito/débito):** o retorno é **síncrono** (postback). Você não depende de notificação assíncrona para saber se aprovou — o `returnCode` já vem na resposta.
- **Cancelamento/estorno:** é **assíncrono** (callback). Aqui há um conceito de notificação: você informa uma URL que receberá o retorno com o status do cancelamento (ex.: `Processing`, `Denied`) e um `refundId`. Útil para acompanhar estornos sem ficar consultando.
- **Não há** um webhook genérico que avise "venda X mudou para aprovada/recusada" como em outros gateways. Portanto, **não projete a criação da reserva para depender de um webhook de venda** — projete em cima da resposta síncrona + consulta + reconciliação.

> Observação: a Rede também opera o gateway **maxiPago!**, que possui um serviço de notificação (transaction-event) mais completo. Se a sua integração for por esse produto, o webhook de eventos de transação existe. Confirme com a Rede qual produto/contrato você está usando, pois isso muda o que está disponível.

---

## 8. Máquina de estados do pedido

Modele o pedido com estados explícitos para tornar o fluxo auditável e recuperável:

```
AGUARDANDO_PAGAMENTO
      │  (autoriza s/ captura)
      ▼
PAGAMENTO_PRE_AUTORIZADO ──(recusado)──► PAGAMENTO_RECUSADO
      │  (cria reserva)
      ▼
RESERVA_CRIADA ──(falha reserva)──► (cancela pré-auth) ──► FALHA_RESERVA
      │  (captura)
      ▼
CONFIRMADO
```

Estados adicionais úteis: `AGUARDANDO_3DS`, `EM_RECONCILIACAO`, `ESTORNADO`.

Cada transição deve registrar: timestamp, TID, returnCode, payload de retorno (sem dados sensíveis de cartão) e ID da reserva quando houver.

---

## 9. Segurança e conformidade

- **PCI DSS:** como é checkout transparente, os dados de cartão passam pelo seu ambiente. Avalie o escopo de certificação aplicável (SAQ A-EP / SAQ D, conforme a arquitetura). Para reduzir escopo, considere **tokenização** (Token Requestor) para não armazenar PAN.
- **Nunca armazene** número completo do cartão, CVV ou dados sensíveis. Guarde apenas TID, `reference`, bandeira, últimos 4 dígitos e status.
- **HTTPS/TLS** em todas as comunicações; TLS 1.2+ exigido.
- **Segredos** (PV, Token, credenciais OAuth) em cofre de segredos (ex.: variáveis de ambiente seguras, Vault), nunca no código.
- **Logs** sem dados sensíveis; mascarar PAN e CVV.
- **Validação de entrada** e proteção contra reenvio/replay no checkout.

---

## 10. Exemplo de implementação (pseudo + SDK)

Pseudocódigo do orquestrador (linguagem-agnóstico):

```text
funcao processarPagamentoEReserva(pedido):
    # idempotência
    existente = eRede.consultarPorReferencia(pedido.reference)
    se existente.aprovada:
        transacao = existente
    senao:
        transacao = eRede.autorizar(
            valor = pedido.valor,
            referencia = pedido.reference,
            cartao = pedido.cartao,
            capturar = false            # pré-autorização
        )

    se transacao.returnCode == "220":
        pedido.estado = "AGUARDANDO_3DS"
        retornar redirecionar(transacao.urlAutenticacao)

    se transacao.returnCode != "00":
        pedido.estado = "PAGAMENTO_RECUSADO"
        retornar falha("Pagamento não autorizado")

    pedido.tid = transacao.tid
    pedido.estado = "PAGAMENTO_PRE_AUTORIZADO"

    # cria a reserva no sistema nativo (idempotente pelo reference)
    tentar:
        reserva = sistemaReservas.criarReserva(
            quarto = pedido.quarto,
            checkin = pedido.checkin,
            checkout = pedido.checkout,
            hospede = pedido.hospede,
            idExterno = pedido.reference
        )
    capturar erro:
        eRede.cancelar(pedido.tid)          # compensação
        pedido.estado = "FALHA_RESERVA"
        retornar falha("Não foi possível criar a reserva")

    pedido.reservaId = reserva.id
    pedido.estado = "RESERVA_CRIADA"

    # captura (cobra de fato)
    captura = eRede.capturar(pedido.tid)
    se captura.returnCode == "00":
        pedido.estado = "CONFIRMADO"
        retornar sucesso(pedido)
    senao:
        agendarRetentativaCaptura(pedido)   # reconciliação
        retornar pendente(pedido)
```

Exemplo real adaptado do SDK PHP da Rede — autorização **sem captura** (pré-autorização):

```php
<?php
use Rede\Store;
use Rede\Environment;
use Rede\Transaction;
use Rede\eRede;

// Ambiente de produção (use Environment::sandbox() em homologação)
$store = new Store('PV', 'TOKEN', Environment::production());

// Pré-autorização: capture(false)
$transaction = (new Transaction(450.00, 'RES-2026-000123'))
    ->creditCard('5448280000000007', '235', '12', '2030', 'MARIA SOUZA')
    ->capture(false);

$transaction = (new eRede($store))->create($transaction);

if ($transaction->getReturnCode() == '00') {
    // guarde o TID e prossiga para criar a reserva
    $tid = $transaction->getTid();
    // ... criarReserva(...) e depois capturar ...
}
```

Captura posterior (após a reserva ser criada):

```php
<?php
$captura = (new eRede($store))->capture(
    (new Transaction(450.00))->setTid($tid)
);

if ($captura->getReturnCode() == '00') {
    // pagamento confirmado
}
```

Cancelamento (compensação, se a reserva falhar):

```php
<?php
$cancel = (new eRede($store))->cancel(
    (new Transaction(450.00))->setTid($tid)
);

if ($cancel->getReturnCode() == '359') {
    // pré-autorização cancelada / limite liberado
}
```

Consulta por referência (idempotência e reconciliação):

```php
<?php
$consulta = (new eRede($store))->getByReference('RES-2026-000123');
$status = $consulta->getAuthorization()->getStatus();
```

---

## 11. Checklist de desenvolvimento e homologação

- [ ] Obter credenciais de **sandbox** (PV/Token) com a Rede.
- [ ] Escolher e instalar o **SDK** oficial da linguagem do projeto.
- [ ] Implementar a **máquina de estados** do pedido no banco.
- [ ] Implementar **pré-autorização → criar reserva → captura** com compensação.
- [ ] Implementar **3DS** (URLs de sucesso/falha e tratamento do `returnCode 220`).
- [ ] Implementar **consulta por reference** (idempotência) e o **job de reconciliação**.
- [ ] Implementar tratamento de **cancelamento/estorno** e (se aplicável) a URL de notificação de cancelamento.
- [ ] Garantir **PCI DSS**, mascaramento de dados e gestão de segredos.
- [ ] Testar todos os cenários no sandbox: aprovado, recusado, 3DS sucesso/falha, falha de reserva, falha de captura, timeout de rede.
- [ ] Passar pela **certificação/homologação** da Rede.
- [ ] Promover credenciais e endpoints para **produção**.

---

## 12. Pontos de atenção e decisões em aberto

1. **Captura automática vs pré-autorização:** este documento recomenda pré-autorização. Confirme se o seu contrato com a Rede e as regras do seu negócio permitem o intervalo necessário entre autorizar e capturar.
2. **Idempotência no sistema de reservas:** verifique se a API de criar reserva aceita uma chave de idempotência. Se não aceitar, será preciso uma estratégia de consulta-antes-de-criar para evitar reservas duplicadas.
3. **Concorrência de inventário:** o quarto pode ser reservado por outro cliente entre o início do checkout e a criação da reserva. Decida se haverá um "hold"/bloqueio temporário do quarto antes da pré-autorização.
4. **Produto Rede correto:** confirme se a integração é via **e.Rede** (síncrono, sem webhook de venda) ou via **maxiPago!** (com webhook de eventos), pois isso muda a estratégia de notificação.
5. **Pix:** se quiser oferecer Pix além de cartão, o fluxo muda (Pix é assíncrono por natureza); aí um mecanismo de notificação/consulta de status passa a ser indispensável.

---

*Documento técnico de referência para integração e.Rede × Sistema de Reservas. Valide os detalhes finais (endpoints exatos, campos obrigatórios, prazos contratuais) na documentação oficial vigente em developer.userede.com.br e com o time de Integrações da Rede, pois versões e regras podem mudar.*
