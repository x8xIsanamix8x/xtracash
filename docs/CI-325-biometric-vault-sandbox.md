# CI-325: prototipo de acceso con credenciales cifradas

## Alcance y decisión

Este cambio implementa la alternativa de almacenamiento cifrado aprobada para
pruebas. **No es la integración WebAuthn de Keycloak ni un login passwordless de
Core.** El dispositivo desbloquea una copia cifrada del identificador y contraseña;
el servicio existente `POST /api/auth/login` debe aceptarlos para crear la sesión
HttpOnly habitual. No se simula una respuesta exitosa.

No hay endpoints nuevos, librerías nuevas ni cambios en los contratos de Core,
login, refresh, logout o cookies. Se retiraron el inicio/callback OIDC, el contrato
BFF provisional, sus pruebas y diagnóstico de tokens, y las variables Keycloak y
APP_BASE_URL que pertenecían a aquella alternativa. Se conserva la configuración
de Core y AUTH_SESSION_SECRET. El Service Worker sigue sin cachear autenticación.

## Habilitación

- No requiere una variable pública de habilitación. Está limitado al origen sandbox
  permitido y a Core sandbox para que la experiencia sea comprobable sin una
  configuración de build adicional.
- El servidor exige Core sandbox (`https://core-api.sandbox.impulsa.vc`) y un host
  permitido: localhost en desarrollo o `https://impulsamovil.onrender.com`.
- El navegador vuelve a comprobar el flag, el origen y el contexto seguro.
- No se admite una IP HTTP de la red local ni otro host. Un build de producción
  no habilita localhost. Las variables NEXT_PUBLIC se fijan durante el build;
  cambiar el flag desplegado requiere reconstruir. No se ha desplegado este cambio.
- Tener WebAuthn y un autenticador local no garantiza PRF. La activación comprueba
  el resultado real de la extensión; si no existe, falla sin cifrado alternativo.

## Flujo para probar manualmente

Usar una cuenta de sandbox y un dispositivo personal. No usar credenciales de
producción. No hay una garantía de compatibilidad para todos los modelos o
administradores de passkeys de Android/iOS.

1. Abre la aplicación actualizada e ingresa con contraseña como siempre.
2. Ve a **Perfil → Seguridad → Configurar acceso biométrico**.
3. Lee y acepta el consentimiento explícito. Introduce la contraseña actual.
4. Pulsa **Verificar contraseña**. Se obtiene el correo de Perfil (no editable),
   se verifica con el login existente y se vuelve a comprobar la cuenta.
5. Pulsa **Guardar con seguridad del dispositivo** antes de dos minutos. Este
   segundo clic inicia la creación de una passkey y una comprobación PRF. Puede
   haber dos diálogos del dispositivo. Solo tras cifrar y guardar se muestra éxito.
6. Cierra sesión con la acción normal de la aplicación. La sesión termina; la copia
   cifrada permanece por el consentimiento otorgado.
7. Abre el login en el mismo origen y almacenamiento del navegador. Bajo Contraseña
   aparece **Identificación biométrica**. Usa la cuenta guardada, no un correo
   distinto escrito en el formulario. El CTA tradicional sigue siendo **Ingresar**.
8. Verifica con el dispositivo. Solo si Core acepta el login se entra a la app.
9. En Perfil, **Quitar de este navegador** elimina el registro cifrado, no la sesión
   ni la passkey del administrador del dispositivo. Esta última se borra por separado.

Para un teléfono real se necesita el cambio desplegado en el origen HTTPS de
sandbox autorizado; localhost en el Mac no es localhost en el teléfono. Repite
el flujo también desde la PWA instalada: no supongas que comparte el registro del
navegador. Si allí no aparece el acceso, inicia sesión y configúralo desde la PWA.
Cambiar de dominio, navegador, perfil o borrar los datos del sitio puede requerir
configurarlo de nuevo. Cambiar la contraseña exige actualizar la copia guardada.

## Qué se guarda y límites de seguridad

- IndexedDB: base `impulsate-biometric-vault-sandbox-v1`, store `vault`, clave
  `current`. Un único registro por almacenamiento/origen, no una lista de cuentas.
- Campos: `version`, `origin`, `rpId`, `credentialId`, `prfSalt`, `kdfSalt`, `iv`,
  `ciphertext`. No se guardan identificador/contraseña sin cifrar, PRF, claves de
  cifrado, tokens ni datos biométricos.
- PRF → HKDF-SHA256 con separación de contexto → AES-256-GCM. Se comprueban desafío,
  origen, RP, credencial, presencia y verificación del usuario. Los metadatos quedan
  vinculados criptográficamente al cifrado. La escritura es atómica; un intento
  fallido de actualización conserva el registro anterior.
- `userVerification: required` puede implicar huella, rostro **o PIN**. No permite
  prometer exclusivamente biometría. Las passkeys pueden sincronizarse según el
  proveedor; no se presentan como credenciales necesariamente ligadas a un equipo.
- La contraseña existe transitoriamente en memoria JavaScript al verificar y usar
  el registro. Limpiar referencias/buffers es un esfuerzo de reducción de exposición,
  no una garantía de borrado físico inmediato. XSS o código del mismo origen
  comprometido pueden capturarla durante ese uso.
- No se verifica una firma WebAuthn en Core: PRF sirve para descifrar, no para
  afirmar por sí solo que una sesión es válida. La autenticación sigue siendo el
  login real. Este prototipo necesita revisión de seguridad antes de producción.
- Cancelar o agotar el diálogo no se presenta como error técnico ni crea sesión.
  Un fallo de red no borra el registro ni se interpreta como contraseña cambiada.

## Verificación y pendientes

Las pruebas automatizadas usan WebCrypto real y dobles de navegador, almacenamiento
y red; no crean credenciales físicas ni ejecutan autenticaciones reales.

- Detección compatible, sin WebAuthn, sin autenticador, error y cancelación.
- Flag desactivado y rechazo de otros hosts/Core.
- PRF ausente, UV ausente, origen/RP/desafío incorrectos y registro manipulado.
- Cifrado/descifrado, almacenamiento exclusivamente cifrado y actualización atómica.
- Verificación de contraseña/cuenta, consentimiento en UI y prueba de verificación
  con caducidad, no transferible y consumida una sola vez.
- Login existente: contrato, same-origin/no-store, no éxito en rechazo o fallo de
  red, cancelación sin login, limpieza de credenciales y bloqueo de doble acción.
- Eliminación del registro independiente de logout y exclusión de caché.
- Comprobaciones estáticas de integración, orden de controles y atributos accesibles.

Comandos: `npm run test:auth`, `npm run test:profile`, `npm run test:pwa`,
`npm run lint`, `npm run build`, `git diff --check`.

**Pendiente de validación manual:** compatibilidad PRF y gesto de usuario con
dispositivos reales, Chrome Android/Safari iOS según proveedor, PWA instalada,
cancelación, cambio de contraseña, recuperación tras fallo de red, cierre de la
vista, Tab/Escape/restauración de foco, zoom y anchos 320/375/390/430 px. No hubo
navegador conectado para verificar visualmente esta ejecución. No se realizó
commit, push ni despliegue.
