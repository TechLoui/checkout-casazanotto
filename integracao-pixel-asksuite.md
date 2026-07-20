# Integração do Pixel da Asksuite

> Documento técnico para orientar a instalação, validação e manutenção do Pixel da Asksuite em um site.
>
> Documentação oficial: https://integrations-docs.asksuite.com/pixel

## 1. Objetivo da integração

O Pixel da Asksuite deve ser instalado no site para permitir que a plataforma identifique interações e conversões relacionadas à jornada de reserva.

A integração deve ser preparada para:

- carregar o script oficial da Asksuite;
- identificar corretamente o empreendimento, hotel ou conta;
- registrar os eventos suportados pela plataforma;
- enviar os dados exigidos em cada evento;
- funcionar em páginas tradicionais e aplicações SPA;
- respeitar o consentimento de cookies e a LGPD;
- evitar eventos duplicados;
- permitir validação em ambiente de homologação e produção.

---

## 2. Informações que devem ser solicitadas à Asksuite

Antes de iniciar a implementação, solicite ou confirme com o responsável pela conta:

1. **Código oficial de instalação do Pixel**
2. **ID da conta, hotel, empreendimento ou propriedade**
3. **Ambiente de homologação**, caso exista
4. **Ambiente de produção**
5. **Lista oficial de eventos aceitos**
6. **Nome exato de cada evento**
7. **Parâmetros obrigatórios e opcionais de cada evento**
8. **Tipos de dados esperados**
9. **Formato de datas**
10. **Formato de valores monetários**
11. **Código da moeda**
12. **Identificador único da reserva**
13. **Regra para reservas canceladas**
14. **Regra para alterações de reserva**
15. **Regra para múltiplos quartos ou hóspedes**
16. **Forma oficial de validação dos eventos**
17. **Contato técnico para homologação**

> Não altere nomes de eventos, parâmetros ou propriedades. Eles devem ser usados exatamente como aparecem na documentação oficial da Asksuite.

---

## 3. Código-base do Pixel

O script deve ser copiado diretamente da documentação oficial ou do painel da Asksuite.

Exemplo estrutural:

```html
<!-- Asksuite Pixel -->
<script>
  // Cole aqui o código oficial fornecido pela Asksuite.
</script>
```

### Local recomendado

Quando a documentação não determinar outro local, scripts de rastreamento normalmente são adicionados:

```html
<head>
  <!-- Asksuite Pixel -->
</head>
```

ou por meio de um gerenciador de tags, como o Google Tag Manager.

### Regras importantes

- Não carregar o mesmo Pixel duas vezes.
- Não instalar simultaneamente no código-fonte e no GTM.
- Não modificar a URL do script.
- Não renomear funções globais criadas pelo Pixel.
- Não chamar eventos antes de o script estar inicializado.
- Não utilizar credenciais ou identificadores de outra propriedade.
- Não enviar dados fictícios em produção.

---

## 4. Identificação da propriedade

A integração pode exigir um identificador específico da conta ou propriedade.

Exemplo estrutural:

```javascript
const asksuiteConfig = {
  propertyId: "ID_FORNECIDO_PELA_ASKSUITE"
};
```

O nome real da propriedade e o formato do identificador devem ser copiados da documentação oficial.

### Validações

- O ID deve pertencer ao hotel correto.
- Homologação e produção podem possuir IDs diferentes.
- O identificador não deve conter espaços extras.
- Não utilizar nome fantasia quando a API exigir um ID interno.
- Em redes hoteleiras, cada propriedade pode precisar de um identificador próprio.

---

## 5. Eventos

Implemente somente eventos oficialmente documentados pela Asksuite.

Para cada evento, registre:

| Campo | Descrição |
|---|---|
| Nome oficial | Nome exato aceito pelo Pixel |
| Momento de disparo | Ação que deve gerar o evento |
| Página ou fluxo | Local em que o evento acontece |
| Parâmetros obrigatórios | Dados exigidos |
| Parâmetros opcionais | Dados complementares |
| Identificador único | Chave para evitar duplicidade |
| Exemplo de payload | Objeto enviado |
| Resultado esperado | Confirmação no painel ou ferramenta de debug |

### Modelo de documentação de evento

```md
### EVENTO_OFICIAL

**Disparo:**  
Quando a ação definida pela Asksuite for concluída.

**Parâmetros:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---:|---:|---|
| parametro_1 | string | Sim | Descrição oficial |
| parametro_2 | number | Não | Descrição oficial |

**Exemplo:**

```javascript
// Utilize a função e o nome de evento definidos oficialmente pela Asksuite.
asksuitePixel("EVENTO_OFICIAL", {
  parametro_1: "valor",
  parametro_2: 100
});
```
```

> O exemplo acima é apenas estrutural. A função, o nome do evento e os parâmetros reais devem ser copiados literalmente da documentação oficial.

---

## 6. Dados normalmente envolvidos em uma jornada de reserva

Dependendo dos eventos suportados, pode ser necessário disponibilizar alguns dos dados abaixo:

### Dados da busca

- data de check-in;
- data de check-out;
- quantidade de noites;
- quantidade de adultos;
- quantidade de crianças;
- idade das crianças;
- código da propriedade;
- código promocional;
- origem da busca.

### Dados da acomodação

- código do quarto;
- nome do quarto;
- código da tarifa;
- nome da tarifa;
- quantidade de quartos;
- quantidade de hóspedes.

### Dados financeiros

- valor total;
- valor de impostos;
- valor de taxas;
- valor de desconto;
- moeda;
- forma de pagamento.

### Dados da reserva

- identificador da reserva;
- status;
- data e hora da criação;
- canal de origem;
- URL de confirmação;
- identificador da transação.

### Dados pessoais

Evite enviar dados pessoais que não sejam expressamente exigidos.

Não envie sem necessidade:

- senha;
- token de autenticação;
- número completo de cartão;
- código de segurança do cartão;
- documento pessoal;
- dados de saúde;
- observações privadas;
- informações sensíveis.

---

## 7. Formatação dos dados

### Datas

Utilize o formato exigido pela Asksuite.

Quando não houver indicação diferente, o padrão técnico recomendado é:

```text
YYYY-MM-DD
```

Exemplo:

```text
2026-07-14
```

Para data e hora:

```text
YYYY-MM-DDTHH:mm:ssZ
```

Exemplo:

```text
2026-07-14T18:30:00-03:00
```

### Valores monetários

Confirme se o Pixel espera:

- valor decimal, como `1250.90`;
- valor em centavos, como `125090`;
- string formatada;
- número sem separador de milhar.

Nunca envie:

```text
R$ 1.250,90
```

quando o campo exigir um número.

### Moeda

Utilize o código ISO 4217, quando exigido:

```text
BRL
USD
EUR
```

### Booleanos

Envie booleanos reais quando o tipo esperado for boolean:

```javascript
true
false
```

Evite:

```javascript
"true"
"false"
```

### Campos vazios

Não envie propriedades com valores inválidos:

```javascript
{
  reservationId: undefined,
  total: NaN,
  currency: ""
}
```

Prefira remover campos opcionais sem valor.

---

## 8. Exemplo de montagem segura de payload

```javascript
function removeEmptyValues(data) {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => {
      return value !== undefined &&
        value !== null &&
        value !== "" &&
        !(typeof value === "number" && Number.isNaN(value));
    })
  );
}

const payload = removeEmptyValues({
  reservationId: reservation.id,
  checkIn: reservation.checkIn,
  checkOut: reservation.checkOut,
  total: Number(reservation.total),
  currency: reservation.currency || "BRL"
});
```

> Substitua os nomes dos campos pelos parâmetros oficiais do Pixel.

---

## 9. Controle de duplicidade

Eventos de conversão não devem ser enviados mais de uma vez para a mesma ação.

Situações comuns de duplicidade:

- recarregamento da página de confirmação;
- uso do botão voltar;
- reexecução de componentes React/Vue;
- múltiplos listeners registrados;
- instalação simultânea pelo site e pelo GTM;
- execução no carregamento e também no retorno da API;
- reprocessamento de webhooks;
- redirecionamentos entre domínio e subdomínio.

### Exemplo com `sessionStorage`

```javascript
function sendOnce(key, callback) {
  if (sessionStorage.getItem(key)) return;

  callback();
  sessionStorage.setItem(key, "1");
}

sendOnce(`asksuite-event-${reservation.id}`, () => {
  // Disparar aqui o evento oficial da Asksuite.
});
```

### Recomendação

Use como chave um identificador estável, por exemplo:

```text
nome-do-evento + reservationId
```

Não utilize somente a URL como identificador.

---

## 10. Aplicações SPA

Em React, Vue, Angular, Next.js ou outras aplicações SPA, a troca de rota pode não recarregar a página.

A integração deve observar:

- mudança de rota;
- carregamento assíncrono;
- renderização no cliente;
- renderização no servidor;
- disponibilidade do objeto global do Pixel;
- execução única por conversão.

### Exemplo estrutural em JavaScript

```javascript
function waitForAsksuitePixel(callback, attempts = 20) {
  const interval = setInterval(() => {
    const pixelReady = typeof window !== "undefined" &&
      typeof window.NOME_DA_FUNCAO_OFICIAL === "function";

    if (pixelReady) {
      clearInterval(interval);
      callback();
      return;
    }

    attempts -= 1;

    if (attempts <= 0) {
      clearInterval(interval);
      console.error("Pixel da Asksuite não foi carregado.");
    }
  }, 250);
}
```

Substitua `NOME_DA_FUNCAO_OFICIAL` pela função definida na documentação.

---

## 11. Integração via Google Tag Manager

Caso a instalação seja feita pelo GTM:

1. Criar uma tag de **HTML personalizado** para o script-base.
2. Configurar o acionamento conforme orientação oficial.
3. Criar uma tag separada para cada evento.
4. Utilizar variáveis da `dataLayer`.
5. Evitar disparos duplicados.
6. Testar no modo Preview.
7. Publicar somente após homologação.

### Exemplo de `dataLayer`

```javascript
window.dataLayer = window.dataLayer || [];

window.dataLayer.push({
  event: "asksuite_reservation_data",
  reservation: {
    id: "ABC123",
    checkIn: "2026-08-10",
    checkOut: "2026-08-13",
    total: 1500.00,
    currency: "BRL"
  }
});
```

A tag do GTM deve ler os dados e chamar o evento oficial da Asksuite.

> `asksuite_reservation_data` é apenas um nome interno de exemplo para o GTM. Ele não representa necessariamente um evento oficial da Asksuite.

---

## 12. Consentimento, cookies e LGPD

Antes de carregar ou disparar o Pixel, verifique a classificação definida pela empresa:

- estritamente necessário;
- funcional;
- análise;
- marketing.

Se o Pixel não for estritamente necessário, ele deve respeitar o consentimento do usuário.

### Fluxo recomendado

1. O usuário acessa o site.
2. O gerenciador de consentimento verifica as preferências.
3. O Pixel é carregado somente quando permitido.
4. Eventos são disparados apenas após o consentimento aplicável.
5. A política de privacidade informa a finalidade do tratamento.

### Cuidados

- Não armazenar dados além do necessário.
- Não incluir dados sensíveis em URLs.
- Não inserir dados pessoais em logs do navegador.
- Atualizar a política de cookies.
- Registrar a base legal adotada.
- Permitir revogação do consentimento.
- Alinhar a implementação com o encarregado de dados ou jurídico.

---

## 13. Política de Segurança de Conteúdo — CSP

Sites com CSP restritiva podem bloquear o Pixel.

Verifique no console erros semelhantes a:

```text
Refused to load the script because it violates the Content Security Policy.
```

Pode ser necessário liberar os domínios oficiais da Asksuite nas diretivas:

```text
script-src
connect-src
img-src
frame-src
```

Adicione somente os domínios indicados na documentação ou identificados durante a homologação.

Não utilize permissões amplas como:

```text
*
```

---

## 14. Testes obrigatórios

### Carregamento

- O script responde com status HTTP válido.
- Não existem erros no console.
- A função global do Pixel foi criada.
- O Pixel não é carregado duas vezes.
- O ID corresponde ao ambiente correto.

### Eventos

- O evento ocorre no momento correto.
- O nome do evento está exato.
- Todos os campos obrigatórios são enviados.
- Os tipos dos valores estão corretos.
- Datas estão no formato correto.
- Valores monetários estão corretos.
- A moeda está correta.
- O evento não é duplicado.
- O evento funciona em desktop e mobile.
- O evento funciona com bloqueadores desativados.
- O comportamento com bloqueadores ativados é tratado sem quebrar o site.

### Fluxo de reserva

Testar pelo menos:

1. busca sem disponibilidade;
2. busca com disponibilidade;
3. seleção de acomodação;
4. seleção de tarifa;
5. avanço para checkout;
6. reserva aprovada;
7. reserva recusada;
8. pagamento pendente;
9. cancelamento;
10. alteração da reserva;
11. múltiplos quartos;
12. uso de cupom;
13. acesso por subdomínio;
14. recarregamento da confirmação;
15. retorno pelo botão voltar.

---

## 15. Validação no navegador

### Console

```javascript
console.log(window.NOME_DA_FUNCAO_OFICIAL);
```

O resultado esperado é uma função ou objeto, conforme a implementação oficial.

### Network

No DevTools:

1. Abrir **Network**.
2. Filtrar por `asksuite`.
3. Executar a ação.
4. Verificar a requisição.
5. Confirmar status HTTP.
6. Conferir o payload.
7. Conferir a resposta.
8. Verificar se existe mais de uma requisição para o mesmo evento.

### Logs temporários

Durante a homologação:

```javascript
console.info("[Asksuite Pixel] Evento preparado", {
  event: "NOME_OFICIAL",
  payload
});
```

Remova dados pessoais e logs excessivos antes da publicação.

---

## 16. Tratamento de erros

O Pixel não deve impedir o funcionamento da reserva.

```javascript
try {
  // Chamada oficial do Pixel.
} catch (error) {
  console.error("[Asksuite Pixel] Falha ao enviar evento", error);
}
```

### Regras

- Não bloquear o checkout.
- Não exibir erro técnico ao hóspede.
- Não repetir indefinidamente a chamada.
- Não armazenar dados pessoais em logs.
- Registrar falhas de forma controlada.
- Definir timeout quando houver espera pela inicialização.

---

## 17. Ambientes

Utilize variáveis de ambiente:

```env
ASKSUITE_PIXEL_ENABLED=true
ASKSUITE_PIXEL_PROPERTY_ID=identificador
ASKSUITE_PIXEL_ENV=production
```

### Exemplo

```javascript
const asksuiteEnabled =
  process.env.ASKSUITE_PIXEL_ENABLED === "true";

if (asksuiteEnabled) {
  // Inicializar o Pixel.
}
```

Nunca misture:

- ID de homologação em produção;
- eventos de teste em produção;
- reservas reais no ambiente de teste.

---

## 18. Checklist de homologação

- [ ] Código oficial recebido
- [ ] ID da propriedade confirmado
- [ ] Ambiente confirmado
- [ ] Lista de eventos confirmada
- [ ] Parâmetros obrigatórios confirmados
- [ ] Tipos de dados confirmados
- [ ] Script instalado uma única vez
- [ ] Consentimento configurado
- [ ] CSP configurada
- [ ] Eventos implementados
- [ ] Controle de duplicidade implementado
- [ ] SPA tratada, quando aplicável
- [ ] Desktop testado
- [ ] Mobile testado
- [ ] Navegadores principais testados
- [ ] Payloads validados
- [ ] Reservas de teste realizadas
- [ ] Cancelamento testado
- [ ] Alteração testada
- [ ] Asksuite validou a integração
- [ ] Evidências da homologação armazenadas
- [ ] Publicação em produção autorizada

---

## 19. Evidências para enviar à Asksuite

Para cada cenário, envie:

- URL testada;
- data e hora do teste;
- ambiente;
- ID da propriedade;
- nome do evento;
- print do Network;
- payload sem dados sensíveis;
- status da requisição;
- identificador da reserva de teste;
- resultado esperado;
- resultado obtido;
- versão do navegador;
- dispositivo utilizado.

---

## 20. Informações para manutenção

Registre internamente:

| Item | Valor |
|---|---|
| Responsável técnico | |
| Responsável Asksuite | |
| Data da instalação | |
| Data da homologação | |
| ID de homologação | |
| ID de produção | |
| Local do código | |
| Container GTM | |
| Versão da integração | |
| Última validação | |
| Eventos ativos | |
| Observações | |

---

## 21. Critérios de aceite

A integração será considerada concluída quando:

1. o Pixel carregar sem erros;
2. o identificador correto for utilizado;
3. todos os eventos definidos pela Asksuite forem implementados;
4. os parâmetros obrigatórios forem enviados;
5. não houver duplicidade;
6. o consentimento estiver configurado;
7. os testes de reserva forem concluídos;
8. a Asksuite confirmar o recebimento;
9. a implementação estiver documentada;
10. a versão de produção estiver validada.

---

## 22. Pendências que precisam ser preenchidas com a documentação oficial

Como o conteúdo técnico da página oficial é renderizado dinamicamente, os itens abaixo devem ser copiados diretamente da documentação ou enviados pelo suporte da Asksuite:

- [ ] snippet exato de instalação;
- [ ] URL exata do script;
- [ ] nome da função global;
- [ ] ID ou chave exigida;
- [ ] nomes oficiais dos eventos;
- [ ] parâmetros de cada evento;
- [ ] tipos dos parâmetros;
- [ ] campos obrigatórios;
- [ ] exemplos oficiais;
- [ ] domínios usados nas requisições;
- [ ] ferramenta oficial de debug;
- [ ] procedimento de homologação;
- [ ] comportamento esperado para cancelamentos;
- [ ] comportamento esperado para alterações;
- [ ] regras de consentimento indicadas pela Asksuite.

---

## 23. Fonte

- Documentação oficial do Pixel da Asksuite:  
  https://integrations-docs.asksuite.com/pixel

> Recomenda-se validar este documento sempre que a Asksuite atualizar a especificação oficial.
