# Fix del Home: cuotas pendientes y vencidas

Fecha: 27 de octubre de 2026.
Rama: `fix/home-pending-overdue-mapping`.
Base: `company/develop`, commit `32a7398`, consultada con fetch antes de crear la rama.

## Objetivo

Recuperar la información del Home para clientes con cuotas pendientes, vencidas o en mora, conservando las tarjetas, navegación y estilos actuales. Corregir el contrato y el manejo de errores sin recalcular reglas financieras en el cliente.

## Diagnóstico comprobado

- Fuente vigente: `GET /api/impulsate-movil/resumen`, a través de `/api/home/summary`.
- `Balance.status` documenta `AL_DIA`, `BLOQUEADO` y `SUSPENDIDO`. El normalizador actual acepta `AL_DIA/ACTIVE`, `RETRASO/PAYMENT_DUE` y `MORA/SUSPENDED`.
- `Consumption.status` documenta `AL_DIA`, `VENCIDO_SIN_MORA`, `VENCIDO_CON_MORA` y `PAGADO`. Los tres últimos no son aceptados actualmente.
- Reproducción local con fixtures y estados del contrato: `AL_DIA/AL_DIA` es aceptado; `BLOQUEADO/VENCIDO_SIN_MORA`, `BLOQUEADO/VENCIDO_CON_MORA`, `SUSPENDIDO/AL_DIA` y `AL_DIA/PAGADO` devuelven `null`.
- El adaptador del servidor convierte ese `null` en error de protocolo y la ruta devuelve 502. `HomeView` descarta el error; como `homeViewModel` permanece nulo, no renderiza el dashboard ni un estado recuperable.
- Un solo consumo inválido invalida el resumen completo. Una fecha no validada también puede fallar al formatearla.
- El Home solicita dos veces `/api/home/summary`, para el dashboard y para el onboarding, usando dos adaptaciones distintas.
- El estado de deuda cero se deduce de `consumptions.length === 0`, aunque existe `debt.total` como fuente explícita.

Esta evidencia confirma una incompatibilidad reproducible con el contrato. Aún no se ha capturado la respuesta autenticada de la cuenta afectada.

## Contrato y presentación

| Campo/estado de Core | Presentación y acción |
| --- | --- |
| `balance.status = AL_DIA` | Disponible habilitado y CTA actual. Tener cuotas futuras no significa atraso. |
| `balance.status = BLOQUEADO` | Disponible bloqueado por cuotas vencidas; mantener el acceso a Cuotas para regularizar. |
| `balance.status = SUSPENDIDO` | Disponible suspendido por la empresa. Mantener acceso a Cuotas, sin prometer que pagar lo reactivará automáticamente. |
| `consumption.status = AL_DIA` | Tarjeta «Al día», progreso y próxima fecha/importe cuando existan. |
| `VENCIDO_SIN_MORA` | Tarjeta «Cuota vencida», énfasis ámbar y acceso al detalle del consumo. |
| `VENCIDO_CON_MORA` | Tarjeta «En mora», énfasis de peligro existente y acceso al detalle. |
| `PAGADO` | Aceptar el contrato; no mostrar una obligación ni una acción de pago para ese consumo. Core indica que normalmente lo excluye del Home. |
| `debt.total.bs` | Fuente de la deuda acumulada; no inferirla del número de tarjetas ni del estado de la línea. |
| `nextPaymentDate/nextPaymentAmount` | Datos de ese consumo. Nulos ocultan únicamente esos datos. No sumar las tarjetas como si fueran todo el universo de cuotas. |

Swagger tiene inconsistencias: la descripción general menciona `ABIERTA/BLOQUEADA/SUSPENDIDA` y tres consumos recientes; los modelos declaran `AL_DIA/BLOQUEADO/SUSPENDIDO` y hasta cinco consumos del más antiguo al más nuevo. Implementar los modelos publicados y contrastarlos con una respuesta real. No inventar aliases ni reordenar/cortar la lista desde el frontend.

## Plan de ejecución

1. **Corregir modelos y normalización.**
   - Actualizar `newBusinessTypes.ts` y `newBusinessValidation.ts` con los estados vigentes, diferenciando bloqueo por deuda y suspensión administrativa.
   - Separar la validación del DTO Core de su presentación. Mantener compatibilidad con los valores internos que se usen realmente, sin asociar mora automáticamente a suspensión.
   - Validar fechas de calendario, contadores e importes decimales; conservar montos del backend y no recalcular tasas, cargos ni deuda.
   - Tratar estados desconocidos o datos obligatorios inválidos como información no disponible, con recuperación visible. No reemplazarlos por cero ni por «Al día».

2. **Recuperar el renderizado y la carga.**
   - Ajustar `coreAccountSummary.ts`, `services/newBusinessHome.ts` y `HomeView.tsx` para distinguir carga, éxito, error recuperable y sesión expirada.
   - Mostrar skeleton de las tarjetas durante la carga y una tarjeta compacta «No pudimos cargar tu información» con «Reintentar» si falla.
   - Consolidar la consulta del resumen y aprovechar la misma respuesta para el onboarding, conservando su información opcional y su comportamiento actual.
   - Cancelar peticiones obsoletas y evitar resultados de una petición anterior tras reintentar. Un 401 debe conservar la navegación de sesión expirada.

3. **Mapear la información dentro del diseño actual.**
   - Actualizar `newBusinessViewModel.ts`, `NewBusinessHomeDashboard.tsx` y, solo donde haga falta, `ConsumptionCard.tsx`.
   - Conservar disponible, avisos compactos, consumos y deuda en su composición actual.
   - Diferenciar «Cuota vencida» de «En mora». Mostrar fecha e importe del servicio sin inventar el total vencido ni el monto para reactivar.
   - Mostrar el importe de deuda real incluso si la lista de consumos está vacía. La ausencia de tarjetas por sí sola no permite afirmar que el cliente está al día.
   - Mantener la navegación existente `/installments` y `/installments/{consumptionId}`. No modificar los reportes ni los métodos de pago.
   - Mantener los datos secundarios que ya están ocultos para conservar un Home compacto. El resumen parcial de consumos no debe presentarse como calendario global.

4. **Verificar el recorrido y entregar.**
   - Pruebas del parser/adaptador con estados actuales, nulos opcionales, fechas inválidas, estados desconocidos y deuda positiva con lista vacía.
   - Probar Home sin deuda, con cuotas futuras, vencidas sin mora, vencidas con mora, suspensión administrativa y consumos mixtos.
   - Comprobar que el resumen documentado no genera 502 y que una respuesta inválida/red caída muestra error y permite reintentar.
   - Probar visualmente a 360–390 px: tarjetas legibles, acciones accesibles, navegación a Cuotas y recuperación de errores. No declarar validación visual por compilar.
   - Contrastar una cuenta de sandbox con deuda y su detalle de cuotas, usando una sesión habilitada. No efectuar pagos para validar este fix.
   - Ejecutar TypeScript, lint focalizado, tests de Home y las pruebas relevantes del adaptador/servidor; probar regresión del componente compartido con Cuotas si se modifica.

## Línea base de pruebas

`npm run test:home` antes de implementar: 17 pruebas, 13 correctas y 4 fallos.

- `marketplaceCatalog.test.mjs`: espera el texto antiguo «Pago en revisión».
- `newBusinessHome.test.mjs`: espera deuda nula para cliente nuevo, pero el view model genera deuda cero.
- `newBusinessHome.test.mjs`: espera «Reportar cuota», pero actualmente la acción es «Reactivar».
- `newBusinessHome.test.mjs`: compara una paleta anterior con la vigente.

Actualizar las expectativas afectadas por el contrato/diseño conservado. Documentar aparte los fallos ajenos al fix; no modificar colores o pagos para satisfacer pruebas obsoletas.

## Criterios de aceptación

- Una respuesta válida con cuotas vencidas renderiza el Home completo.
- Pendiente, vencida, mora, bloqueo y suspensión no se confunden.
- Se muestran montos, progreso y fechas reales, con acceso al consumo correcto.
- No se muestra una pantalla vacía ni un falso «Al día» cuando falla la carga o hay deuda.
- La suspensión administrativa no promete reactivación automática mediante pago.
- Se preservan diseño, navegación, acceso a marketplace y onboarding.

## Resultado de ejecución

- Se implementó el mapeo de `BLOQUEADO`, `SUSPENDIDO`, `VENCIDO_SIN_MORA`, `VENCIDO_CON_MORA` y `PAGADO`, separando mora de suspensión administrativa.
- Las alertas del Home ahora describen la causa según el contrato y llevan a «Pagar cuotas» o «Ver mis cuotas» sin prometer reactivación automática.
- El Home usa una sola consulta para dashboard y onboarding, conserva la última respuesta ante error de actualización y ofrece recuperación explícita si la carga inicial falla.
- `npm run test:home`: 18/18; `npm run test:installments`: 71/71; `npx playwright test e2e/installments/home.spec.ts`: 5/5.
- `npx eslint src/features/home tests/home e2e/installments/home.spec.ts`, `npx tsc --noEmit` y `npm run build`: correctos.
- No se validó una sesión real de sandbox de la cuenta afectada; la verificación visual/E2E usa respuestas controladas derivadas de fixtures.
