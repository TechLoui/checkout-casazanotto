# Site Casa Zanotto

Site da **Pousada Casa Zanotto** (frontend estático) + **backend de reservas**
(checkout transparente Rede/Itaú → cria a reserva na ArtaxNet).

O motor de reservas (busca → quartos → dados do hóspede → pagamento) é
embutido direto na home, na seção `#reservar` — não há mais uma página de
checkout separada.

## Navegação por seções e animações

Os links públicos incluem `#experiencia`, `#estrutura`, `#acomodacoes`,
`#cafe-da-manha`, `#beira-rio`, `#galeria`, `#avaliacoes`, `#reservar`,
`#faq`, `#localizacao` e `#contato`. `#reservar` alinha diretamente o
formulário abaixo do cabeçalho fixo. Links antigos `#conheca`, `#duvidas`
e `#contatos` continuam apontando às seções correspondentes.

`casa-navigation.js` centraliza entrada por URL, cliques, Voltar/Avançar e
seção ativa durante a rolagem. Cliques criam uma entrada de histórico;
rolagem manual atualiza a entrada atual. A navegação altera somente o
fragmento, preservando parâmetros de datas, cupom e origem da visita.
Trocar de seção não reinicia nem preenche novamente a reserva.

`casa-motion.js` e `casa-motion.css` animam os blocos editoriais e as fotos
novas da galeria uma vez ao entrar na tela. A preferência por movimento
reduzido é respeitada e os campos do formulário permanecem visíveis.
`CasaMotion.revealSection(element)` torna o destino de um link visível
sem esperar uma animação.

## 📁 Estrutura do projeto

```
.
├── index.html            # site (home) — inclui o motor de reservas embutido
├── styles.css            # estilos do site
├── script.js             # JS do site + motor de reservas (#reservar)
├── casa-design.css       # composição visual e identidade da Casa
├── casa-gallery.js       # mosaico, filtros e ampliação das fotos
├── casa-motion.js/css    # entradas animadas ao rolar, com movimento reduzido
├── casa-navigation.js    # links de seção, histórico e menu ativo
├── assets/               # imagens (logo, galeria, quartos, café, hidro, vídeos)
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
| `MAX_INSTALLMENTS` | `4` |
| `REDE_WEBHOOK_TOKEN` | *(token forte; o webhook PIX da Rede envia como `Bearer`)* |
| **Outros** | |
| `ALLOWED_ORIGINS` | `https://pousadacasazanotto.com,https://www.pousadacasazanotto.com` |
| `ARTAX_WEBHOOK_TOKEN` | *(opcional — só se for usar webhooks do Artax)* |
| `PAYMENT_SIMULATE` | *(só teste local: `true` simula pagamento aprovado sem chamar a Rede)* |

> As chaves do Artax/Rede ficam **somente** aqui (no Railway). Elas nunca vão
> para o frontend nem para o Git (o `.env` está no `.gitignore`).

Depois do deploy, o Railway te dá uma URL pública, ex.:
`https://sitecasazanotto-production.up.railway.app`

## 🌐 Deploy do FRONTEND na Hostinger
- Site estático hospedado na Hostinger, no domínio **pousadacasazanotto.com**
  (upload dos arquivos da raiz — `index.html`, `styles.css`, `script.js`,
  `hero.js`, `assets/`, `politica-de-privacidade.html` e `.htaccess` — via o
  painel/gerenciador de arquivos da Hostinger).
- O `.htaccess` redireciona o `www` e o antigo `.com.br` para
  `https://pousadacasazanotto.com`, preservando o caminho e os parâmetros.
  Se o `public_html` de um desses domínios já tiver um `.htaccess`, acrescente
  esse bloco antes dos redirecionamentos existentes.
- `script.js` já aponta por padrão para a URL de produção do backend no
  Railway (`HOME_API_BASE`). Só precisa sobrescrever definindo
  `window.CZ_CHECKOUT_API` antes de carregar o `script.js` se a URL do
  Railway mudar.
- Garanta que `https://pousadacasazanotto.com` (e a variante `www`, se
  usada) esteja em `ALLOWED_ORIGINS` no Railway (CORS) — senão o site fica
  no ar, mas a busca de disponibilidade e o pagamento param de funcionar.

## Medição de reservas do ChatGPT Ads

1. Publique a página [Política de Privacidade](https://pousadacasazanotto.com/politica-de-privacidade)
   e a atualização da página inicial na Hostinger. Confira o link no rodapé e
   o aviso na etapa de dados do hóspede.
2. Após conferir a publicação, cadastre a chave de Conversões no serviço da
   Casa no Railway como `OPENAI_CONVERSIONS_API_KEY` e habilite
   `OPENAI_CONVERSIONS_ENABLED=true`. O backend verifica se a política e o
   aviso estão acessíveis antes de enviar qualquer evento.
3. Confira no Fluxo de eventos do Ads Manager se uma reserva confirmada
   aparece como `order_created` via servidor. O ID é o número da reserva e o
   valor é o total confirmado em centavos (BRL).

Quando um hóspede pedir que o contato deixe de ser usado na medição do
ChatGPT Ads, acrescente o hash SHA-256 normalizado do e-mail ou do telefone à
variável `OPENAI_CONVERSIONS_SUPPRESSED_HASHES` (separe os hashes por vírgula).
Use e-mail em minúsculas e sem espaços nas pontas ou telefone apenas com
dígitos, incluindo o código do país. Se um hash corresponder, o evento não é
enviado. Na opção do checkout que exclui contato e identificador de clique,
o evento de reserva segue sem esses campos.

## 💻 Rodar localmente
```bash
# backend
cd server && npm install && cp .env.example .env   # preencha o .env
npm start                                           # http://localhost:8080

# frontend (em outra aba) — sirva a raiz em http://localhost:5500
```
Em `localhost`, o motor de reservas já chama `http://localhost:8080/api` automaticamente.

Detalhes do backend (endpoints, cartões de teste, segurança/PCI): ver `server/README.md`.
