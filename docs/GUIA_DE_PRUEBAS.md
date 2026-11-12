# Guía de pruebas manuales por funcionalidad

Complementa `docs/E2E_TESTS.md` (flujos E2E-1 a E2E-5). Aquí se recorre **cada funcionalidad**.
Marca cada casilla solo si lo viste funcionar. Si algo falla, anota pantalla, pasos y mensaje.

## 0. Preparación

```bash
cd backend && npm run db:reset-demo && npm run dev      # terminal 1
EXPO_PUBLIC_API_URL=http://<IP-de-tu-Mac>:3000 npx expo start   # terminal 2 (raíz)
```

Contraseña de todos: `Test1234!`. Reinicia con `db:reset-demo` (y recarga la app) cuando una sección lo pida.

| Usuario | Papel en la demo |
|---|---|
| `owner@example.com` | Administra "Spotify familiar - Chapinero" (4 cupos) y "YouTube Premium familiar" (2 cupos, vacío); miembro del Netflix de `member` |
| `member@example.com` | Miembro activo de Spotify (cuota del mes ya marcada como pagada); administra "Netflix miembro extra" (lleno) |
| `member2@example.com` | Miembro activo de Spotify; cuota del mes pasado atrasada + cuota vigente pendiente |
| `solicitante@example.com` | Solicitud `PENDING` en Spotify |
| `aprobado@example.com` | Membresía `APPROVED` en Spotify, primer monto $5.000 |
| `moderator@example.com` | Rol ADMIN (solo API) |

## 1. Autenticación

- [ ] Login correcto con `owner@example.com` → entra a Inicio.
- [ ] Login con contraseña incorrecta → mensaje de error claro, sigue en login.
- [ ] Login con correo inexistente → mismo tipo de mensaje (no revela si el correo existe).
- [ ] Campos vacíos / correo mal formado → error de validación junto al campo.
- [ ] Registro con datos válidos → entra a Inicio con la cuenta nueva (sin grupos).
- [ ] Registro con correo ya usado (`owner@example.com`) → mensaje de correo duplicado.
- [ ] Registro con contraseña débil/corta → error de validación.
- [ ] Cerrar sesión (Perfil) → vuelve a login; no se puede volver atrás a pantallas internas.
- [ ] Cerrar la app por completo (deslizar en el selector) y reabrir **con sesión** → sigue dentro (sesión restaurada).
- [ ] Cerrar sesión, cerrar la app y reabrir → muestra login.
- [ ] Abrir la app sin sesión → login (no la pantalla "no existe").

## 2. Inicio (Mis grupos)

Con `owner`:
- [ ] Aparecen "Spotify familiar - Chapinero" y "YouTube Premium familiar" (y el Netflix como miembro).
- [ ] Cada tarjeta muestra servicio, precio, cupos y estado.
- [ ] Tirar hacia abajo (pull to refresh) recarga.
- [ ] Con la cuenta nueva del registro: estado vacío con mensaje y acción para crear/explorar.
- [ ] Botones "Crear grupo" y "Mis cuotas" funcionan.

## 3. Explorar

- [ ] Lista grupos abiertos (Spotify y YouTube; el Netflix lleno no debe aparecer como abierto).
- [ ] Buscar por nombre o descripción (campo de búsqueda) y filtrar por servicio (chips; "Todos" restaura) funcionan.
- [ ] Paginación/scroll no duplica ni pierde elementos.
- [ ] Abrir un grupo ajeno muestra detalle **sin** datos de pago (`payoutDetail` oculto).

## 4. Grupos

- [ ] Crear grupo: formulario con servicio, título, precio, día de pago (1–28), cupos, medio y dato de cobro.
- [ ] Validaciones: día de pago 0 o 29, cupos mayores al máximo del servicio, precio vacío/negativo → error.
- [ ] El grupo creado aparece en Inicio y en Explorar (otro usuario).
- [ ] Detalle como administrador: ve datos de pago y botones de gestión (miembros y solicitudes, cuotas del grupo, pausar, cerrar).
- [ ] Pausar el grupo (botón del administrador) → estado "pausado", deja de aparecer abierto en Explorar; reanudar lo reabre.
- [ ] (Conocido) La app no tiene pantalla para editar título/precio de un grupo: el backend lo soporta (`PATCH /groups/:id`), pero solo se expone pausar/reanudar.
- [ ] Un no administrador no ve opciones de gestión.
- [ ] Cerrar grupo con cuotas pendientes (Spotify del seed) → rechazado con mensaje.
- [ ] Cerrar grupo sin cuotas pendientes (uno recién creado, sin miembros) → queda cerrado y deja de aparecer abierto en Explorar.

## 5. Membresías

(`db:reset-demo` antes.)
- [ ] `solicitante` entra a Explorar → YouTube → "Solicitar unirme" → queda pendiente.
- [ ] Solicitar de nuevo el mismo grupo → mensaje "ya eres miembro/solicitud".
- [ ] El administrador (`owner`) recibe notificación de la solicitud.
- [ ] `owner` abre Miembros del grupo: ve pendientes, aprobados y activos; aprueba una solicitud (con primer monto opcional).
- [ ] `owner` rechaza otra solicitud → el solicitante recibe notificación de rechazo.
- [ ] `aprobado` ve su aprobación y pulsa "Confirmar acceso" → pasa a activo y se genera su primera cuota.
- [ ] El administrador recibe notificación de acceso confirmado.
- [ ] Cupos: aprobar hasta llenar el grupo → pasa a "lleno" y deja de aceptar solicitudes (mensaje de grupo lleno).
- [ ] Un miembro activo puede "Salir del grupo" (con confirmación) → deja de ser miembro, se libera el cupo.
- [ ] Un miembro activo ve la lista de miembros activos, sin datos privados del administrador (primer monto).
- [ ] Expulsar sin dos cuotas vencidas seguidas (`member` en Spotify) → rechazado con mensaje.
- [ ] Expulsar con dos vencidas: ejecuta en `backend` `npm run jobs:run -- --date=2026-11-20` (ajusta a un día posterior al día de pago + 3), recarga y expulsa a `member2` → pasa a removido y recibe notificación.

## 6. Cuotas y pagos

- [ ] "Mis cuotas" (`member2`): ve la atrasada y la vigente con sus estados (icono + texto, no solo color).
- [ ] Detalle de cuota: monto, vencimiento, estado y "Datos de pago" (medio + dato) con texto seleccionable/copiable.
- [ ] Copiar datos de pago funciona.
- [ ] "Ya pagué" → pantalla de referencia (opcional) → envía → estado "Marcado como pagado" y el botón desaparece.
- [ ] El administrador recibe notificación "Pago por confirmar".
- [ ] `owner` abre la cuota marcada (la de `member`) → "Confirmar pago" → estado "Confirmado"; `member` recibe notificación.
- [ ] `owner` rechaza otra cuota marcada → exige motivo (mínimo de caracteres) → vuelve a pendiente y `member2` ve el motivo en el detalle.
- [ ] Un miembro no ve botones de confirmar/rechazar; el administrador no ve "Ya pagué".
- [ ] Cuota atrasada se puede marcar como pagada (pago tardío).
- [ ] Cuotas del grupo (administrador): lista de todas las del grupo con filtros por estado.
- [ ] Un miembro que ya salió: sigue viendo su cuota pero **sin** la sección "Datos de pago".
- [ ] Doble toque rápido en "Ya pagué"/"Confirmar" no genera error ni duplicados.

## 7. Jobs y notificaciones

- [ ] Bandeja: lista ordenada por fecha, no leídas destacadas, contador en la pestaña.
- [ ] Tocar una notificación la marca leída y navega a su destino (grupo/cuota).
- [ ] "Marcar todas como leídas" deja el contador en cero.
- [ ] Estado vacío de la bandeja con mensaje.
- [ ] `npm run jobs:run -- --date=<día de pago de Spotify - 2>`: llegan recordatorios de pago a quien tiene cuota pendiente; ejecutarlo dos veces **no** duplica recordatorios.
- [ ] `npm run jobs:run -- --date=<día de pago + 4>`: cuotas pendientes pasan a atrasadas y se avisa.
- [ ] El job crea la cuota del mes siguiente solo para miembros activos y no la duplica al repetir.
- [ ] (Solo con build de desarrollo) Push real en segundo plano y en primer plano.

## 8. Calificaciones y reportes

- [ ] Perfil de otro usuario (desde Miembros → "Ver perfil" o desde el detalle del grupo): promedio y lista de calificaciones.
- [ ] Calificar (1–5 estrellas, comentario opcional) como miembro al administrador → aparece en su perfil y actualiza el promedio.
- [ ] Intentar calificar sin haber compartido grupo o dos veces → el servidor lo rechaza con un mensaje legible.
- [ ] Sin elegir estrellas no deja enviar.
- [ ] Reportar usuario: motivo (chip) + detalle opcional → confirmación.
- [ ] No se puede reportar a uno mismo.
- [ ] Moderación (API): `curl` con el token de `moderator@example.com` a `GET /reports` lista; con otro usuario devuelve 403.

## 9. Perfil y ajustes

- [ ] Tema Sistema/Claro/Oscuro cambia la app al instante; sobrevive a cerrar y reabrir.
- [ ] Alto contraste cambia colores visiblemente y persiste.
- [ ] Vibración on/off: con on vibra al pulsar botones principales y al terminar acciones; con off, no.
- [ ] Editar nombre/teléfono → se guarda y se ve tras recargar.
- [ ] Datos inválidos (nombre vacío) → error.
- [ ] Acceso a "Mis calificaciones" y "Mis cuotas".

## 10. Errores y bordes

- [ ] Modo avión + cualquier acción/refresh → mensaje de sin conexión y opción de reintentar; al volver la red, funciona.
- [ ] Apagar el backend (Ctrl+C) y abrir una pantalla → error claro, no pantalla en blanco ni cierre.
- [ ] Pantallas de lista: estados de carga, vacío y error se ven en cada una.
- [ ] Rotar/Teclado: los formularios no quedan tapados por el teclado.
- [ ] Textos largos (título de grupo de 80 caracteres) no rompen el diseño.

## 11. Accesibilidad (VoiceOver en iPhone: Ajustes → Accesibilidad)

- [ ] Login: orden de foco lógico; cada campo anuncia su etiqueta y errores.
- [ ] Botones anuncian nombre + "botón" y estado (desactivado/cargando).
- [ ] Tarjetas (grupo, cuota) se leen como un solo elemento con resumen completo.
- [ ] Estrellas: cada una anuncia "N estrellas"; el promedio se lee entero.
- [ ] Estados de cuota se entienden sin ver el color.
- [ ] Texto grande (Ajustes → Pantalla → Tamaño del texto al máximo): nada se corta ni se solapa.
- [ ] Todos los botones se pulsan con facilidad (≥ 48 dp).
- [ ] Una acción completa (marcar como pagado) usando solo VoiceOver.

## 12. Lo que NO se puede verificar en Expo Go

- Notificaciones push reales (requieren build de desarrollo y `projectId` de EAS).
- Enlaces `cuotix://...` (en Expo Go el esquema es `exp://`).
- Comportamiento de producción (build release), Android real.
