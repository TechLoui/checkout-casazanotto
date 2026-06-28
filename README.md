# Site Casa Zanotto

Site da **Pousada Casa Zanotto** (frontend estático) + **backend de reservas**
(checkout transparente Rede/Itaú → cria a reserva na ArtaxNet).

## 📁 Estrutura do projeto

```
.
├── index.html            # site (home)
├── checkout.html         # checkout (também embutido na home via iframe)
├── styles.css            # estilos do site
├── checkout.css          # estilos do checkout
├── script.js             # JS do site
├── checkout.js           # JS do checkout
├── hero.js               # animação da seção "A casa em imagens"
├── assets/               # imagens (logo, galeria, quartos, café, hidro, vídeos)
├── netlify.toml          # publica o frontend estático na Netlify
└── server/               # ⬅️ BACKEND (é ISTO que o Railway puxa)
    ├── package.json      # start: node src/server.js
    ├── railway.json      # config de deploy do Railway
    ├── .env.example      # modelo das variáveis (NÃO contém segredos)
    └── src/              # Express: availability, checkout, webhooks
```

## 🚉 Deploy do BACKEND no Railway

O Railway deve servir a **pasta `server/`** (e somente ela).

1. New Project → **Deploy from GitHub repo** → selecione `SiteCasaZanotto`.
2. Em **Settings → Root Directory**, defina: **`server`**.
   (Assim o Railway instala o `server/package.json` e roda `npm start`.)
3. O Railway define a porta automaticamente (`PORT`) — o servidor já usa ela.

### Variáveis de ambiente no Railway (Settings → Variables)
Adicione uma a uma (NÃO precisa de `PORT`, o Railway injeta):

| Variável | Valor |
|---|---|
| `NODE_ENV` | `production` |
| `ARTAX_BASE_URL` | `https://artaxnet.com/pms-api/v1` |
| `ARTAX_CLIENT_ID` | *(sua client id do Artax)* |
| `ARTAX_CLIENT_SECRET` | *(seu client secret do Artax)* |
| `ARTAX_PRICE_MODE` | `total` |
| `ARTAX_PM_PIX` | `5957` *(REDE \| PIX — opcional, já tem default)* |
| `ARTAX_PM_CARD` | `8473` *(REDE \| CARTÃO DE CRÉDITO — opcional)* |
| `ARTAX_COST_CENTER_ID` | *(opcional — centro de custo do lançamento)* |
| **e.Rede (v2 · OAuth 2.0 — cartão + PIX)** | |
| `REDE_CLIENT_ID` | *(client id sandbox; em produção = PV)* |
| `REDE_CLIENT_SECRET` | *(client secret sandbox; em produção = chave de integração)* |
| `REDE_OAUTH_URL` | sandbox `https://rl7-sandbox-api.useredecloud.com.br/oauth2/token` · produção `https://api.userede.com.br/redelabs/oauth2/token` |
| `REDE_TRANSACTIONS_URL` | sandbox `https://sandbox-erede.useredecloud.com.br/v2/transactions` · produção `https://api.userede.com.br/erede/v2/transactions` |
| `REDE_SOFT_DESCRIPTOR` | `CasaZanotto` |
| `MAX_INSTALLMENTS` | `6` |
| `REDE_WEBHOOK_TOKEN` | *(token forte; o webhook PIX da Rede envia como `Bearer`)* |
| **Outros** | |
| `ALLOWED_ORIGINS` | URLs do site (ex.: `https://pousadacasazanotto.com,https://SEU-SITE.netlify.app`) |
| `ARTAX_WEBHOOK_TOKEN` | *(opcional — só se for usar webhooks do Artax)* |
| `PAYMENT_SIMULATE` | *(só teste local: `true` simula pagamento aprovado sem chamar a Rede)* |

> As chaves do Artax/Rede ficam **somente** aqui (no Railway). Elas nunca vão
> para o frontend nem para o Git (o `.env` está no `.gitignore`).

Depois do deploy, o Railway te dá uma URL pública, ex.:
`https://sitecasazanotto-production.up.railway.app`

## 🌐 Deploy do FRONTEND na Netlify
- Conecte o repo na Netlify; ela publica a raiz (`publish = "."`).
- Edite **`checkout.html`** e troque o placeholder pela URL do Railway:
  ```html
  window.CZ_CHECKOUT_API = "https://SUA-URL.up.railway.app/api";
  ```
- Garanta que o domínio do site esteja em `ALLOWED_ORIGINS` no Railway (CORS).

## 💻 Rodar localmente
```bash
# backend
cd server && npm install && cp .env.example .env   # preencha o .env
npm start                                           # http://localhost:8080

# frontend (em outra aba) — sirva a raiz em http://localhost:5500
```
Em `localhost`, o checkout já chama `http://localhost:8080/api` automaticamente.

Detalhes do backend (endpoints, cartões de teste, segurança/PCI): ver `server/README.md`.
