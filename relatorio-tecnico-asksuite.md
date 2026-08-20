# Motor de reservas Casa Zanotto — arquitetura e pontos de integração

**De:** Pousada Casa Zanotto (Luiz)
**Para:** Equipe de Engenharia — Asksuite
**Data:** 10 de julho de 2026 (atualizado em 13/07/2026)

A pousada opera hoje um motor de reservas próprio, embutido direto na home do site: busca disponibilidade em tempo real, processa o pagamento (cartão ou PIX) e só então cria a reserva no PMS. Este documento descreve essa arquitetura para apoiar as integrações que vocês pediram — link direto para cotação, consumo da API de disponibilidade, API Key e rastreio de conversão — e fecha com o que ainda falta alinhar entre os times.

## Stack

| Componente | Solução |
|---|---|
| Frontend | Site estático — hospedado na Hostinger, domínio `pousadacasazanotto.com` |
 cn| Backend | Node.js / Express (Railway) |
| PMS | ArtaxNet |
| Pagamento · cartão | e.Rede API v2 — pré-autorização + captura |
| Pagamento · PIX | e.Rede ou Itaú (mTLS), configurável |
| E-mail transacional | Resend |

## Arquitetura

```
Frontend (Hostinger — pousadacasazanotto.com)
  │  motor de reservas embutido na home, seção #reservar
  │  HTTPS / JSON — disponibilidade · checkout · PIX
  ▼
Backend (Node/Express · Railway)
  │  reconfere preço no PMS no momento da compra
  │  processa pagamento e só cria a reserva se aprovado
  ▼
  ├── ArtaxNet (PMS)     — disponibilidade, criação/gestão da reserva, financeiro
  ├── e.Rede / Itaú      — cartão (pré-auth + captura) e PIX (cobrança + confirmação)
  └── Resend             — e-mail de confirmação (só após pagamento aprovado)
```

- **Frontend**: busca, seleção de acomodação(ões), dados do hóspede e pagamento acontecem todos na home (`pousadacasazanotto.com`, seção `#reservar`), em etapas — não há uma página de checkout separada. O hóspede pode selecionar mais de uma acomodação (tipos diferentes) na mesma reserva; o pagamento é único, pelo total combinado.
- **Backend**: nunca confia no preço vindo do navegador; reconfere no PMS no momento da compra.

## Como uma reserva acontece

### Cartão
1. **Disponibilidade** — hóspede busca datas e nº de hóspedes; o motor devolve quartos com preço total.
2. **Pré-autorização** — o limite do cartão é reservado; ainda não há cobrança.
3. **Reserva criada no PMS** — só acontece depois da pré-autorização aprovada.
4. **Captura** — cobrança efetiva, agora que a reserva já existe.
5. **Confirmação** — e-mail disparado. Se a reserva falhar após a pré-autorização, ela é cancelada automaticamente e o hóspede não é cobrado.

### PIX
1. **Disponibilidade** — igual ao fluxo de cartão.
2. **Cobrança gerada** — QR Code / copia-e-cola. A reserva ainda não existe.
3. **Confirmação do pagamento** — por três vias redundantes: consulta do navegador (polling), webhook do provedor e uma varredura periódica no servidor — cobre o hóspede que fecha a aba antes de confirmar.
4. **Reserva criada no PMS** — assim que o pagamento é confirmado, de forma idempotente (não duplica mesmo se as três vias chegarem juntas).
5. **Confirmação** — e-mail disparado.

## API disponível hoje

| Rota | Método | Função | Acesso hoje |
|---|---|---|---|
| `/api/health` | GET | Verificação de saúde | Público |
| `/api/availability` | GET | Disponibilidade + preço total, por datas e nº de hóspedes | CORS ou `X-Api-Key` (ver abaixo) |
| `/api/checkout` | POST | Cobra no cartão e cria a reserva | Uso interno (só o site) |
| `/api/pix/create` | POST | Gera a cobrança PIX | Uso interno (só o site) |
| `/api/pix/status` | POST | Consulta o status de uma cobrança PIX | Uso interno (só o site) |
| `/api/cost-centers` | GET | Lista centros de custo do PMS | Uso interno (só o site) |
| `/api/webhooks/*` | POST | Recebe eventos dos provedores de pagamento/PMS | assinatura própria de cada provedor |

Criação/confirmação de reserva e pagamento continuam exclusivas do nosso motor de reservas — toda reserva no PMS só é criada depois do pagamento aprovado, então isso não é exposto por API.

## 1. Link direto para cotação (deep link) — ✅ pronto

O motor de reservas na home já aceita parâmetros de busca na URL. Quando o link já traz check-in e check-out, ele pula direto pra etapa de disponibilidade — sem exigir nenhum clique do viajante.

**URL base:** `https://pousadacasazanotto.com/`

| Parâmetro | Obrigatório | Formato | Exemplo |
|---|---|---|---|
| `arrival_date` | sim | `AAAA-MM-DD` | `2026-08-10` |
| `departure_date` | sim | `AAAA-MM-DD` | `2026-08-12` |
| `adults` | não (padrão 2) | inteiro 1–9 | `2` |
| `kids` | não (padrão 0) | inteiro 0–6 | `1` |
| `ages[0]`, `ages[1]`, ... | só se `kids` > 0 | inteiro 0–12 | `ages[0]=8` |

Exemplo completo:
```
https://pousadacasazanotto.com/?arrival_date=2026-08-10&departure_date=2026-08-12&adults=2&kids=1&ages[0]=8#reservar
```

Ao abrir esse link, a página já rola até a seção de reservas e mostra a lista de quartos disponíveis para essas datas.

## 2. API de cotação / disponibilidade — ✅ fechado

`GET /api/availability` já cobre o que a Asksuite precisa: dado um período e nº de hóspedes, devolve os quartos e tarifas disponíveis com o preço total já calculado. Uso combinado: **só cotação** — a Asksuite busca a disponibilidade e direciona o viajante pro link acima para concluir a compra no nosso motor de reservas.

Pendente (opcional, não bloqueia): se fizer sentido pro time de vocês, podemos avaliar incluir a descrição textual dos quartos na resposta (hoje ela traz nome, capacidade, preço e fotos, mas não um texto descritivo).

## 3. Autenticação da API — ✅ fechado

Header simples, como vocês preferiram:
```
X-Api-Key: <chave>
```
Vale só para `GET /api/availability`, em chamadas servidor-a-servidor. A chave específica da Asksuite foi enviada por canal separado (não fica neste documento). Sem rate limit dedicado — segue o limite geral do backend (80 req/min por IP), já que vocês sinalizaram não ter um mínimo necessário do lado de vocês.

## 4. Rastreio de conversão — ✅ Pixel instalado + evento de compra disparando

A Asksuite definiu: rastreio via **script do Pixel**, com evento `purchase` disparado sempre que um viajante concluir uma reserva no site (webhook fica como alternativa futura, não é requisito agora).

**Pixel instalado** (snippet da documentação oficial — https://integrations-docs.asksuite.com/pixel):
```html
<!-- Start Asksuite Pixel -->
<script src="https://pixel.asksuite.com/asktag.js"></script>
<!-- End Asksuite Pixel -->
```

**Evento de compra implementado**, no formato Enhanced Ecommerce documentado por vocês (`ecommerce.purchase`, não o formato GA4 mais novo — ajustamos depois de ler a doc oficial). Disparado no momento exato da confirmação da reserva (cartão capturado ou PIX pago):
```javascript
window.dataLayer.push({ ecommerce: null }); // limpa o objeto anterior
window.dataLayer.push({
  event: "purchase",
  ecommerce: {
    currencyCode: "BRL",
    purchase: {
      actionField: { id: "1365372", revenue: "2306.00" },
      products: [
        { id: "4700", name: "Suíte Standard", price: "1062.00", quantity: 1 },
        { id: "4703", name: "Suíte Gold", price: "1244.00", quantity: 1 }
      ]
    }
  }
});
```
Com controle de duplicidade (não dispara de novo em recarregamento/voltar) e sem quebrar a reserva do hóspede se algo falhar. `products[]` já suporta mais de um item — o motor de reservas passou a aceitar mais de uma acomodação na mesma reserva, então uma compra pode gerar 1 ou vários itens.

**O que ainda não está confirmado:** a documentação do Pixel não menciona nenhum ID de propriedade/conta pra identificar a Casa Zanotto — só o script genérico acima. Precisamos que vocês confirmem se a identificação da conta é automática (pelo domínio) ou se falta algum passo de configuração do lado de vocês pra reconhecer os eventos como sendo da nossa propriedade.

**Precisamos de vocês:**
- Confirmar se falta algum ID/config de propriedade pra identificar a Casa Zanotto, ou se é automático pelo domínio.
- Validar que o evento está chegando certo (temos um teste real pra mostrar, se precisar).

## Perguntas em aberto

| Pergunta | Status |
|---|---|
| Link direto pra cotação | ✅ resolvido — ver seção 1 |
| Formato/campos da cotação | ✅ resolvido — API atual já cobre |
| Só cotação ou também cria reserva pela API | ✅ resolvido — só cotação, com redirecionamento pro motor de reservas |
| Autenticação da API | ✅ resolvido — header `X-Api-Key` |
| Rate limit / SLA esperado | ✅ resolvido — sem mínimo exigido pela Asksuite |
| Rastreio: Pixel ou webhook | ✅ resolvido — Pixel com evento `purchase` (Enhanced Ecommerce); webhook fica pra uma integração futura, se fizer sentido |
| Snippet do Pixel | 🔶 código pronto, falta publicar na Hostinger — é o único bloqueio restante |
| ID de propriedade/conta da Casa Zanotto | ✅ resolvido — automático: a Asksuite vincula a reserva à empresa assim que o script estiver no ar |
| Ambiente de homologação separado de produção | ✅ resolvido — não existe; validação é feita com reserva de teste em produção mesmo |
| Validação do evento | ✅ resolvido — via reserva de teste feita pelo próprio Luiz, depois de publicar o script |
| Cancelamento/alteração de reserva (não temos esse fluxo pelo site) | ✅ resolvido — não é bloqueante pra Asksuite |
| Reserva com múltiplas acomodações | ✅ resolvido — o motor agora aceita mais de um tipo de quarto na mesma reserva; `products[]` reflete cada acomodação com seu próprio preço |
| Pixel exige consentimento de cookies (site não tem banner hoje) | 🔶 pendente — ainda não respondido |

*Webhook de reserva confirmada já está implementado no backend (payload documentado numa versão anterior deste doc) e pode ser reaproveitado se, no futuro, fizer mais sentido pra vocês do que o Pixel.*

---
*Contato técnico: Luiz — Pousada Casa Zanotto. Documento atualizado em 21/07/2026.*
