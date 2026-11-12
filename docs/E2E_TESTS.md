# Pruebas E2E manuales (Fase 9)

> **Estado global: PENDIENTE DE EJECUCIÓN HUMANA.** Ningún flujo ha sido ejecutado.
> Los campos Fecha, Dispositivo, Tester, Resultado, Evidencia y Estado están en blanco a propósito
> y deben llenarse solo al correr el flujo en un dispositivo o simulador real.

## Preparación

1. Levantar backend: `docker-compose up -d` y `cd backend && npm run db:reset-demo`.
2. Levantar la app: `npx expo start` (dev build o simulador iOS/Android) apuntando a la API.
3. Usuarios del seed (contraseña `Test1234!`): `owner@example.com`, `member@example.com`, `member2@example.com`, `moderator@example.com`.
4. Antes de cada flujo conviene reiniciar el seed para partir de un estado conocido.
5. Guardar capturas como `docs/evidencias/E2E-N/screenshot_NN.png`.

Leyenda de Resultado: ✓ (cumple) / ✗ (falla). Estado: PASS solo si todos los pasos son ✓.

---

## E2E-1: Registro y Login

**Fecha:** ____
**Dispositivo:** ____
**Tester:** ____

**Precondición:** App recién abierta sin sesión; correo nuevo no registrado.

| Paso | Acción | Esperado | Resultado | Evidencia |
|------|--------|----------|-----------|-----------|
| 1 | Abrir app | Pantalla de login |  |  |
| 2 | Tap "Crear cuenta" | Pantalla de registro |  |  |
| 3 | Llenar formulario válido y enviar | Cuenta creada |  |  |
| 4 | Verificar navegación | Se muestra Home |  |  |
| 5 | Cerrar sesión (Perfil) | Vuelve a login |  |  |
| 6 | Login con las credenciales creadas | Acceso aceptado |  |  |
| 7 | Verificar navegación | Se muestra Home |  |  |

**Bugs encontrados:**
- [ ] 

**Estado:** ______ (PASS / FAIL)

---

## E2E-2: Crear grupo y recibir miembro

**Fecha:** ____
**Dispositivo:** ____
**Tester:** ____

**Precondición:** Seed reiniciado; hay un grupo con cupo.

| Paso | Acción | Esperado | Resultado | Evidencia |
|------|--------|----------|-----------|-----------|
| 1 | Login como owner | Home |  |  |
| 2 | Crear grupo de Spotify | Grupo creado |  |  |
| 3 | Verificar Home | El grupo aparece en Home |  |  |
| 4 | Logout | Login |  |  |
| 5 | Login como member | Home |  |  |
| 6 | Buscar el grupo en Explorar | Grupo visible |  |  |
| 7 | Solicitar unirse | Solicitud enviada (pendiente) |  |  |
| 8 | Logout | Login |  |  |
| 9 | Login como owner | Home |  |  |
| 10 | Aprobar la solicitud | Miembro aprobado |  |  |
| 11 | Logout | Login |  |  |
| 12 | Login como member | Home |  |  |
| 13 | Confirmar acceso | Membresía activa |  |  |
| 14 | Verificar cuota generada | Aparece una cuota en Mis cuotas |  |  |

**Bugs encontrados:**
- [ ] 

**Estado:** ______ (PASS / FAIL)

---

## E2E-3: Ciclo de pago completo

**Fecha:** ____
**Dispositivo:** ____
**Tester:** ____

**Precondición:** Seed reiniciado; member tiene una cuota pendiente.

| Paso | Acción | Esperado | Resultado | Evidencia |
|------|--------|----------|-----------|-----------|
| 1 | Login como member | Home |  |  |
| 2 | Abrir la cuota en detalle | Detalle de cuota |  |  |
| 3 | Copiar datos de pago | Datos copiados al portapapeles |  |  |
| 4 | Marcar como pagado con referencia | Se envía |  |  |
| 5 | Verificar estado | "Marcado como pagado" |  |  |
| 6 | Logout | Login |  |  |
| 7 | Login como owner | Home |  |  |
| 8 | Confirmar el pago | Pago confirmado |  |  |
| 9 | Verificar estado | "Confirmado" |  |  |
| 10 | Logout | Login |  |  |
| 11 | Login como member | Home |  |  |
| 12 | Calificar al owner | Calificación enviada |  |  |
| 13 | Verificar calificación | Calificación guardada y visible en el perfil |  |  |

**Bugs encontrados:**
- [ ] 

**Estado:** ______ (PASS / FAIL)

---

## E2E-4: Manejo de errores

**Fecha:** ____
**Dispositivo:** ____
**Tester:** ____

**Precondición:** App con sesión cerrada; un grupo lleno disponible (completar cupo con el seed).

| Paso | Acción | Esperado | Resultado | Evidencia |
|------|--------|----------|-----------|-----------|
| 1 | Login con credenciales inválidas | Intento rechazado |  |  |
| 2 | Verificar mensaje | Mensaje de error claro |  |  |
| 3 | Intentar unirse a un grupo lleno | Solicitud rechazada |  |  |
| 4 | Verificar mensaje | Mensaje de error claro |  |  |
| 5 | Activar modo avión | Sin red |  |  |
| 6 | Intentar una acción (p. ej. refrescar) | Acción falla |  |  |
| 7 | Verificar mensaje | Mensaje de sin conexión |  |  |

**Bugs encontrados:**
- [ ] 

**Estado:** ______ (PASS / FAIL)

---

## E2E-5: Accesibilidad

**Fecha:** ____
**Dispositivo:** ____
**Tester:** ____

**Precondición:** TalkBack (Android) o VoiceOver (iOS) disponible.

| Paso | Acción | Esperado | Resultado | Evidencia |
|------|--------|----------|-----------|-----------|
| 1 | Activar TalkBack/VoiceOver | Lector activo |  |  |
| 2 | Navegar por Login con el lector | Se recorre sin trabas |  |  |
| 3 | Verificar orden de foco | Orden lógico |  |  |
| 4 | Verificar anuncios | Todos los elementos se anuncian |  |  |
| 5 | Navegar por Home | Se recorre Home |  |  |
| 6 | Verificar cards | Cada card se lee completa |  |  |
| 7 | Ejecutar una acción con lector activo | La acción se completa |  |  |

**Bugs encontrados:**
- [ ] 

**Estado:** ______ (PASS / FAIL)

---

## Resumen de ejecución

| Flujo | Fecha | Dispositivo | Tester | Estado |
|-------|-------|-------------|--------|--------|
| E2E-1 |  |  |  | PENDIENTE |
| E2E-2 |  |  |  | PENDIENTE |
| E2E-3 |  |  |  | PENDIENTE |
| E2E-4 |  |  |  | PENDIENTE |
| E2E-5 |  |  |  | PENDIENTE |
