# Dúvida para o Itaú — migração de certificados/endpoints (PIX Recebimentos)

**Contexto:** usamos a API PIX Recebimentos do Itaú (`pix_recebimentos/v2`), com mTLS, hoje apontando para `secure.api.itau`. Já baixamos e instalamos a nova cadeia de certificados (GlobalSign Root R46 + intermediários GCC R46 OV/EV TLS CA 2025) via o portal — resolve a maior parte da adequação.

## O que ainda falta confirmar

1. **O certificado mTLS dinâmico do cliente que já temos emitido (válido até 30/06/2027) precisa ser reemitido** por causa dessa migração, ou só a cadeia usada para validar o certificado do lado do Itaú (já resolvida) importa?

2. Nosso `ITAU_BASE_URL` ainda aponta para `secure.api.itau` (não migramos para `secure.gateway.api.itau`). Como os certificados-folha que baixamos já têm emissão de 29-30/07/2026, entendemos que o endereço atual já está servindo a cadeia nova em paralelo — **podemos continuar em `secure.api.itau` até o prazo (15/09/2026) sem risco de interrupção**, ou existe algum motivo para migrar antes?

Qualquer confirmação por escrito já resolve.

Obrigado desde já!

*Contato técnico: Luiz — Pousada Casa Zanotto.*
