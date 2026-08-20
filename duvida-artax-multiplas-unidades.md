# Dúvida para o Artax — múltiplas unidades do mesmo tipo de quarto

## 🔴 URGENTE (adicionado 20/08/2026): erro 500 com dois tipos de quarto diferentes

Ao testar `room_units` com **dois `room_id` diferentes** na mesma reserva (ex.: `room_units[4700][...]` + `room_units[4702][...]`, cada um com 1 unidade, mesmíssima estrutura que já usamos em produção pra reservas com mais de um tipo de acomodação), a API retornou:

```
HTTP 500
{"error":"Undefined array key \"detached_rooms\""}
```

Isso parece um bug do lado de vocês (chave de array não definida), não erro de validação nosso. **Isso pode estar afetando hóspedes reais agora** — nosso site já permite selecionar mais de um tipo de quarto numa reserva, e se isso realmente quebra em produção, um pagamento PIX já recebido ficaria sem reserva criada (exigindo estorno manual). Pedimos prioridade nessa parte específica.

Confirmamos que essa tentativa **não** consumiu unidades de disponibilidade (allots ficaram iguais antes/depois), então não criou reserva "fantasma" — mas o fluxo de checkout real provavelmente está quebrado para esse caso.

---

**Contexto:** integramos `GET /rooms/availability` e `POST /booking/create` (`pms-api/v1`) no site da Pousada Casa Zanotto (`pousadacasazanotto.com`). Hoje conseguimos reservar tipos de quarto diferentes numa mesma reserva (ex.: 1 Suíte Standard Casal + 1 Suíte Gold), mas não sabemos como reservar **mais de uma unidade do mesmo tipo de quarto** numa única reserva (ex.: 3x Suíte Standard Casal).

## O que já sabemos

- No `booking/create`, o payload usa `room_units` com notação de array estilo PHP, uma chave por quarto selecionado:
  ```
  room_units[301][price]=600
  room_units[301][guests][0][first_name]=Maria
  ```
  Aqui, `301` parece ser o mesmo `room_id` retornado pelo `GET /rooms/availability`.

- Como é um objeto/dicionário indexado por `room_id`, hoje só conseguimos enviar **uma entrada por `room_id`** — se tentarmos repetir o mesmo `room_id` duas vezes, a segunda sobrescreveria a primeira.

- O `GET /rooms/availability` retorna, para cada `room_id` + `rateplan_id`, um campo `allots`. Presumimos que esse número seja a quantidade de unidades físicas daquele tipo de quarto disponíveis para o período consultado — mas não confirmamos isso oficialmente.

## O que precisamos confirmar

1. **Como reservar N unidades do mesmo `room_id` numa única chamada a `POST /booking/create`?**
   Por exemplo: um hóspede quer reservar 3 Suítes Standard Casal (mesmo `room_id`, mesmo `rateplan_id`) na mesma reserva. O `room_units` deveria:
   - Usar índices adicionais por unidade (ex.: `room_units[301][0][...]`, `room_units[301][1][...]`, `room_units[301][2][...]`)?
   - Ter um campo `quantity`/`units` dentro da própria entrada (ex.: `room_units[301][quantity]=3`)?
   - Repetir chamadas separadas a `booking/create` (uma por unidade)? Se sim, como associá-las como uma única reserva/grupo?
   - Alguma outra estrutura?

2. **Podem confirmar um payload de exemplo** de uma reserva com 3 unidades do mesmo tipo de quarto (mesmo `room_id`) numa única reserva?

3. **O campo `allots` retornado em `GET /rooms/availability`** representa a quantidade de unidades físicas disponíveis daquele `room_id` + `rateplan_id` para as datas consultadas? É esse o número que devemos usar como limite máximo de seleção no nosso site?

4. Existe algum ambiente de **sandbox/homologação** para testarmos esse fluxo de múltiplas unidades antes de validar em produção? (Hoje testamos apenas com reservas reais.)

Qualquer exemplo de payload (curl ou JSON equivalente) que vocês puderem mandar já resolve.

## O que já testamos (20/08/2026)

Testamos diretamente em produção (reserva de teste, status 1 - Pré-reserva, comentário avisando "CANCELAR"):

- `room_units[4700][quantity]=2` (junto com `adults`/`kids`/`price`/`guests` normais nesse mesmo nível) **retornou 200 e criou a reserva (`booking_id: 3013715`), mas reservou só 1 unidade** — o `allots` caiu de 8 para 7, não para 6, e o `GET /booking/3013715` confirma só um `unit_id` (`25142`) na reserva. Ou seja, **`quantity` é ignorado silenciosamente** — isso é perigoso: o campo não dá erro, só não funciona.
- `room_units[4700][0][...]` / `room_units[4700][1][...]` (array de unidades) **não é reconhecido** — a validação retornou erro pedindo `room_units.4700.adults` (sem índice), confirmando que `room_units[room_id]` precisa ser um objeto único, não uma lista.
- Descobrimos que cada unidade física tem um `unit_id` próprio (ex.: `"unit_id":"25142"`), separado do `room_type_id` (`4700`) — não sabemos se dá pra especificar `unit_id`s manualmente na criação para pedir unidades específicas.
- **Não achamos um endpoint de cancelamento** (`PUT`/`DELETE`/`POST .../cancel` no `booking/{id}` devolvem 405 com mensagens inconsistentes). Se vocês puderem confirmar o endpoint de cancelamento também, ajuda bastante — inclusive pra cancelar a reserva de teste acima (`booking_id 3013715`, 17/01/2027, Suíte Standard Casal).

Obrigado desde já!

*Contato técnico: Luiz — Pousada Casa Zanotto.*
