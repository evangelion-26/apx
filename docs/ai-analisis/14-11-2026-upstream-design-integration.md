# Integración del diseño upstream v2.14.3

## Estado

La integración es viable sobre una rama aislada, usando `v2.14.3` como base funcional y visual y reimplantando
`service_mode` sobre sus contratos actuales. No debe activarse ni mezclarse todavía en `main`: falta completar la
verificación integral, visual y de runtime.

## Comportamiento actual y evidencia

- El fork parte de `28ba119cb`; la etiqueta local `v2.14.3` resuelve a `ecc5c8080b7d82ff91fec7906c297cb63e4cc9f5`.
- La comparación tiene 14 commits exclusivos del fork y 484 commits exclusivos de la etiqueta.
- El merge real produjo conflictos en canales, contexto, executor, protocolo, UI, traducciones, documentación y E2E.
- Upstream ya contiene la arquitectura multicuenta, agentes distintos para dueño/contactos y la pantalla nueva de
  cuentas. Mantener las pantallas antiguas del fork duplicaría comportamiento y navegación.
- La diferencia funcional que debe conservarse es `service_mode`: `base`, `review` y `full`.
- La restricción del fork se mantiene: los mensajes del dueño usan el chat propio de la cuenta; `channels.set` no
  acepta silenciosamente Home como destino efectivo.

El remoto upstream está configurado por SSH, pero el entorno de esta integración no dispone del ejecutable `ssh`.
Por ello se usa la etiqueta local inmutable y no se afirma que se haya refrescado desde red durante esta sesión.

## Restricciones

- El rediseño depende de cambios de protocolo, core y navegación; no es una copia segura de CSS aislado.
- `review` debe autorizar una operación exacta, no conceder acceso persistente a una conversación.
- Cualquier cambio de cuenta, persona, agente, proyecto o permisos mientras una operación espera debe invalidarla.
- Los contactos continúan siendo contenido no confiable y no adquieren identidad de dueño.
- La instancia real y `~/.apx/v2` quedan fuera de las pruebas; runtime se verifica con un home temporal.

## Diseño recomendado y aplicado en la rama

1. Resolver la estructura del merge a favor de `v2.14.3`.
2. Conservar el contrato opcional `service_mode` en protocolo y persistencia.
3. Reimplantar los controles en el executor y el contexto nuevos.
4. Mover el selector desde los componentes eliminados a `channels/account/AnswerPane.tsx`.
5. Conservar el enrutamiento multicuenta del fork (`threads.byChannel`) y el destino `owner_thread: own`.
6. Mantener noticias, documentación y traducciones en inglés y español.

## Riesgos

- **Alto — autorización:** una omisión puede exponer herramientas o datos a un contacto.
- **Medio — enrutamiento:** Home y el chat propio tienen semánticas diferentes en upstream.
- **Medio — migración:** cuentas existentes sin campo deben continuar en `base`.
- **Medio — UI:** el selector debe verse y guardar correctamente en anchos de escritorio y teléfono.
- **Bajo — procedencia:** la etiqueta local no pudo contrastarse por SSH en este entorno.

## Áreas afectadas

- `packages/protocol`: esquema de canal y `channels.set`.
- `apps/core/src/channels`, `domain`, `engine`, `rpc` y `tools`.
- `apps/web/src/channels/account`, datos e i18n.
- pruebas unitarias de canales y E2E de cuentas/contactos.
- documentación de canales, modelo humano, decisiones y noticia de producto.

## Verificación

- Typecheck separado de protocolo, web y core.
- Pruebas de los tres modos, MCP, revisión, revocación y aislamiento multicuenta.
- Pruebas de enrutamiento del dueño y contactos.
- `check:private`, esquema, lint, UI, dead code y pruebas unitarias.
- Build y screenshots reales de escritorio y teléfono contra la pantalla upstream.
- Core temporal: comprobar `code_sha`, guardar cada modo y ejercer una solicitud real emulada.
- `pnpm verify` antes de autorizar el merge final.

## Resultados parciales

- Protocolo, web y core compilan por separado.
- Pasan las pruebas de `base`, `review`, `full`, MCP permitido, revisión aprobada/rechazada, salida malformada,
  revocación durante espera, persistencia del modo y separación entre cuentas.
- Una prueba upstream de Telegram que espera una operación de ajustes desde el chat propio sigue fallando y debe
  resolverse antes del GO final; no se ha debilitado ni omitido.

## Decisiones pendientes del dueño

Ninguna para continuar la rama aislada. El merge final a `main` requiere evidencia verde y revisión visual. Si se
quisiera permitir Home en el futuro, sería un cambio funcional separado y explícito.
