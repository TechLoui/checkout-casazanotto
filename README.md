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
| `REDE_BASE_URL` | sandbox `…/desenvolvedores/v1` · produção `…/erede/v1` |
| `REDE_PV` | *(filiação Rede)* |
| `REDE_TOKEN` | *(token de integração Rede)* |
| `REDE_SOFT_DESCRIPTOR` | `CasaZanotto` |
| `MAX_INSTALLMENTS` | `6` |
| `ALLOWED_ORIGINS` | URLs do site (ex.: `https://pousadacasazanotto.com,https://SEU-SITE.netlify.app`) |
| `ARTAX_WEBHOOK_TOKEN` | *(opcional — só se for usar webhooks)* |

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
