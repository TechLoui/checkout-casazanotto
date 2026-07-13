# Motor de reservas Casa Zanotto — arquitetura e pontos de integração

**De:** Pousada Casa Zanotto (Luiz)
**Para:** Equipe de Engenharia — Asksuite
**Data:** 10 de julho de 2026 (atualizado em 13/07/2026)

A pousada opera hoje um motor de reservas próprio, embutido direto na home do site: busca disponibilidade em tempo real, processa o pagamento (cartão ou PIX) e só então cria a reserva no PMS. Este documento descreve essa arquitetura para apoiar as integrações que vocês pediram — link direto para cotação, consumo da API de disponibilidade, API Key e rastreio de conversão — e fecha com o que ainda falta alinhar entre os times.

## Stack

| Componente | Solução |
|---|---|
| Frontend | Site estático — hospedado na Hostinger, domínio `pousadacasazanotto.com.br` |
| Backend | Node.js / Express (Railway) |
| PMS | ArtaxNet |
| Pagamento · cartão | e.Rede API v2 — pré-autorização + captura |
| Pagamento · PIX | e.Rede ou Itaú (mTLS), configurável |
| E-mail transacional | Resend |

## Arquitetura

```
Frontend (Hostinger — pousadacasazanotto.com.br)
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

- **Frontend**: busca, seleção de quarto, dados do hóspede e pagamento acontecem todos na home (`pousadacasazanotto.com.br`, seção `#reservar`), em etapas — não há uma página de checkout separada.
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

**URL base:** `https://pousadacasazanotto.com.br/`

| Parâmetro | Obrigatório | Formato | Exemplo |
|---|---|---|---|
| `arrival_date` | sim | `AAAA-MM-DD` | `2026-08-10` |
| `departure_date` | sim | `AAAA-MM-DD` | `2026-08-12` |
| `adults` | não (padrão 2) | inteiro 1–9 | `2` |
| `kids` | não (padrão 0) | inteiro 0–6 | `1` |
| `ages[0]`, `ages[1]`, ... | só se `kids` > 0 | inteiro 0–12 | `ages[0]=8` |

Exemplo completo:
```
https://pousadacasazanotto.com.br/?arrival_date=2026-08-10&departure_date=2026-08-12&adults=2&kids=1&ages[0]=8#reservar
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

## 4. Rastreio de conversão — ✅ webhook implementado do nosso lado, falta só a URL de vocês

Optamos por **webhook server-to-server** (em vez de dataLayer/GTM, já que não temos Tag Manager instalado hoje). O backend já está pronto para chamar uma URL de vocês assim que uma reserva é confirmada — tanto no fluxo de cartão quanto no de PIX (cobrindo também os casos em que o hóspede fecha a aba antes de ver a confirmação, já que o PIX é detectado por webhook do provedor ou pela varredura periódica).

**O que falta:** a URL de callback de vocês. Assim que tivermos, só precisamos configurá-la — o envio já está implementado.

**Requisição enviada por nós:**
```
POST <sua URL de callback>
Content-Type: application/json
Authorization: Bearer <segredo compartilhado>   (opcional, se vocês quiserem)
```

**Corpo (JSON):**
```json
{
  "event": "booking.confirmed",
  "booking_id": 1365372,
  "arrival_date": "2026-08-10",
  "departure_date": "2026-08-12",
  "nights": 2,
  "room": { "id": "301", "name": "Suíte Standard" },
  "guests": { "adults": 2, "kids": 0 },
  "guest": {
    "first_name": "Maria",
    "last_name": "Silva",
    "email": "maria@example.com",
    "phone": "62999991234"
  },
  "payment": { "method": "pix", "amount": 600, "currency": "BRL", "tid": "..." },
  "confirmed_at": "2026-08-05T14:32:10.000Z"
}
```

Características: fire-and-forget (não bloqueia a confirmação da reserva pro hóspede), timeout de 5s, sem retry automático em caso de falha (loga o erro do nosso lado). Se vocês quiserem retry/fila do lado de vocês, é só tratar como um evento at-least-once.

**Precisamos de vocês:**
- A URL de callback (`https://...`).
- Se querem um segredo compartilhado para validar a origem (enviamos como `Authorization: Bearer <segredo>` se vocês fornecerem um).

## Perguntas em aberto

| Pergunta | Status |
|---|---|
| Link direto pra cotação | ✅ resolvido — ver seção 1 |
| Formato/campos da cotação | ✅ resolvido — API atual já cobre |
| Só cotação ou também cria reserva pela API | ✅ resolvido — só cotação, com redirecionamento pro motor de reservas |
| Autenticação da API | ✅ resolvido — header `X-Api-Key` |
| Rate limit / SLA esperado | ✅ resolvido — sem mínimo exigido pela Asksuite |
| Rastreio: dataLayer (GTM) ou webhook | ✅ resolvido — webhook, já implementado do nosso lado |
| URL de callback do webhook | 🔶 pendente — aguardando vocês |
| Segredo compartilhado para o webhook (opcional) | 🔶 pendente — aguardando vocês (se quiserem) |

---
*Contato técnico: Luiz — Pousada Casa Zanotto. Documento atualizado em 13/07/2026.*
