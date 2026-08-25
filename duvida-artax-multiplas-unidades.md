# Dúvida para o Artax — múltiplas unidades do mesmo tipo de quarto

## ✅ RESPONDIDO pelo Artax (20/08/2026) — múltiplas unidades do MESMO tipo

**Confirmado oficialmente: não é possível hoje, e não há workaround seguro.**

- `room_units` é um objeto indexado por `room_type_id` — cada chave só pode aparecer uma vez, então cada tipo de quarto só pode gerar **no máximo 1 unidade** por reserva.
- `quantity` é ignorado silenciosamente (bug reconhecido por eles — deveriam devolver erro de validação em vez de aceitar e ignorar; vão corrigir isso).
- Não dá pra especificar `unit_id`/`bookeable_unit_id` das UHs físicas — o PMS escolhe automaticamente a primeira UH disponível daquele tipo.
- **Chamadas separadas (uma por unidade) não são uma alternativa segura**: cada uma gera um `booking_id` diferente, não ficam agrupadas numa reserva só, cada uma reconfere disponibilidade de novo, e o conjunto **não é atômico** — pode dar certo em uma chamada e falhar na outra se a disponibilidade mudar no meio do caminho. **Não implementar isso como workaround.**
- Precisa de mudança no contrato da API do lado deles (`quantity` com distribuição de ocupantes, ou `room_units` virar uma lista de objetos repetindo `room_type_id`). Registrado por eles como melhoria necessária, sem prazo.
- A reserva de teste `3013715` já foi cancelada pelo painel deles — nenhuma ação nossa necessária.

**Conclusão prática:** o limite atual do carrinho (não deixar selecionar 2x do mesmo tipo) está correto e deve continuar assim até o Artax lançar uma nova versão do contrato. Não é um bug nosso pra corrigir — é uma limitação real da API deles.

---

## ✉️ Resposta pronta pra enviar (follow-up pro Pedro)

Olá, Pedro. Bom dia!

Obrigado pelo retorno tão detalhado — ficou tudo claro sobre a limitação do `room_units` pra unidades do mesmo tipo, e já ajustamos nosso site pra não oferecer essa opção até vocês lançarem a evolução do contrato.

Duas coisas antes de fechar esse assunto:

**1. Ainda ficou pendente o outro teste que fizemos: erro 500 ao reservar dois tipos de quarto DIFERENTES na mesma chamada.**

Testamos `room_units` com dois `room_type_id` diferentes (`4700` e `4702`), cada um com 1 unidade — a mesma estrutura de payload que vocês confirmaram ser válida na resposta de vocês (o exemplo com `4700` + `4701`). Mas recebemos:

```
HTTP 500
{"error":"Undefined array key \"detached_rooms\""}
```

Isso é o **mesmo formato que nosso backend já usa em produção hoje** sempre que um hóspede reserva mais de um tipo de acomodação numa única compra — recurso que já está liberado no nosso site. Se esse erro está mesmo acontecendo em produção (e não só no nosso teste), qualquer hóspede pagando por 2 tipos diferentes de quarto pode estar sendo cobrado sem a reserva ser criada — no caso do PIX, sem estorno automático. Pedimos prioridade nessa investigação, por afetar reservas reais agora, não só um cenário futuro.

Confirmamos que essa tentativa não chegou a consumir `allots` (ficaram iguais antes e depois), então não sobrou nenhuma reserva "fantasma" — mas o fluxo real de checkout com dois tipos provavelmente está quebrado.

**2. Vocês têm alguma previsão de prazo pra evolução do contrato (`room_units` aceitar múltiplas unidades do mesmo tipo)?**

Esse recurso é essencial pro fluxo da Pousada Casa Zanotto — é comum famílias e grupos maiores quererem reservar mais de uma unidade do mesmo tipo de quarto (ex.: 3x Suíte Standard Casal), e hoje precisamos bloquear essa opção no site por causa dessa limitação. Qualquer estimativa de prazo, mesmo que aproximada, ajuda a gente a planejar quando poder liberar isso pros hóspedes.

Obrigado desde já!

*Contato técnico: Luiz — Pousada Casa Zanotto.*

---

## Histórico completo (contexto, não precisa reenviar)

**Contexto original:** integramos `GET /rooms/availability` e `POST /booking/create` (`pms-api/v1`) no site da Pousada Casa Zanotto (`pousadacasazanotto.com`).

**O que já testamos (20/08/2026):**

- `room_units[4700][quantity]=2` (junto com `adults`/`kids`/`price`/`guests` normais nesse mesmo nível) retornou 200 e criou a reserva (`booking_id: 3013715`), mas reservou só 1 unidade — o `allots` caiu de 8 para 7, não para 6, e o `GET /booking/3013715` confirmou só um `unit_id` (`25142`) na reserva.
- `room_units[4700][0][...]` / `room_units[4700][1][...]` (array de unidades) não foi reconhecido — a validação retornou erro pedindo `room_units.4700.adults` (sem índice).
- `room_units` com dois `room_type_id` diferentes (`4700` + `4702`) retornou `HTTP 500 {"error":"Undefined array key \"detached_rooms\""}` — item ainda sem resposta, ver seção acima.
- Não achamos endpoint de cancelamento (`PUT`/`DELETE`/`POST .../cancel` em `booking/{id}` devolviam 405 com mensagens inconsistentes) — não é mais necessário, o Artax já cancelou a reserva de teste pelo painel deles.
