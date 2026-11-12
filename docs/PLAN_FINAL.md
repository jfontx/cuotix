# Cuotix: Plan Final

> Documento consolidado para la entrega final.
> Equipo: David Alejandro Castiblanco, Jorge Montalvo, Jacobo Acosta.

---

## 1. Visión y Alcance

### 1.1 Problema

Compartir suscripciones digitales (streaming, música, software) ocurre hoy de forma informal a través de grupos de WhatsApp o Facebook. Esta práctica presenta problemas:

- **Sin control de cupos:** No hay forma sistemática de saber cuántos lugares quedan disponibles.
- **Sin seguimiento de pagos:** El administrador debe perseguir manualmente a los morosos por chat.
- **Sin reputación:** No hay forma de saber si un administrador es confiable antes de unirse, ni si un miembro paga a tiempo.
- **Fragmentación:** Los usuarios deben buscar en múltiples plataformas y redes sociales para encontrar grupos.

**Nota:** La existencia de este problema se validó mediante investigación informal en internet. No se cuenta con datos cuantitativos propios (encuestas, métricas de grupos existentes).

### 1.2 Solución

**Cuotix** es una app móvil que centraliza la gestión de grupos para compartir suscripciones:

- **Tagline:** Comparte tus suscripciones, paga solo tu cuota.
- Gestión automática de cupos por grupo.
- Seguimiento de cuotas con estados claros y recordatorios.
- Sistema de reputación bidireccional.
- Guía de compatibilidad por servicio.

### 1.3 Roles de usuario

| Rol | Descripción |
|-----|-------------|
| Administrador | Paga la suscripción completa y comparte cupos para recuperar parte del costo |
| Miembro | Accede a un servicio pagando solo una fracción del costo mensual |
| Admin interno | Modera reportes (alcance mínimo en el MVP) |

### 1.4 Restricción de cumplimiento

Cuotix opera exclusivamente dentro de los planes multiusuario que cada servicio permite oficialmente (planes familiares, miembros extra, etc.). No facilita el uso compartido no autorizado.

### 1.5 Diferenciadores

1. **Conveniencia centralizada:** Una sola plataforma para buscar grupos, solicitar acceso, gestionar pagos y calificar usuarios — en lugar de fragmentarse entre redes sociales, chats y hojas de cálculo.
2. **Gestión automática de cupos:** El sistema controla la capacidad máxima según el tipo de plan.
3. **Seguimiento de cuotas con recordatorios:** Notificaciones automáticas antes del vencimiento y al caer en mora.
4. **Protección al miembro:** La primera cuota solo se genera cuando el miembro confirma que tiene acceso al servicio.
5. **Guía de compatibilidad:** Información curada sobre qué permite cada servicio (miembros, ubicación, restricciones).
6. **Reputación bidireccional:** Historial de pagos a tiempo y calificaciones mutuas.
7. **Accesibilidad móvil:** Diseñada desde el inicio para usuarios con discapacidades.

### 1.6 Competencia

| Alternativa | Descripción | Limitaciones |
|-------------|-------------|--------------|
| Grupos informales (WhatsApp/Facebook) | Coordinación manual por chat | Sin control de cupos, sin seguimiento de pagos, sin reputación, dependencia de un solo administrador |

**Nota:** No se realizó análisis detallado de competidores formales (Together Price, ShareSub, Spliiit). Se desconoce su disponibilidad y funcionamiento en Colombia.

---

## 2. Alcance del MVP

### 2.1 Debe tener (Must)

- Registro e inicio de sesión (correo y contraseña)
- Perfil de usuario básico
- Catálogo de servicios con guía de compatibilidad (2-3 servicios curados)
- Crear, buscar y ver grupos
- Solicitar unirse a un grupo; aprobar o rechazar solicitudes
- Control de cupos
- Confirmación de acceso por parte del miembro
- Cuotas mensuales con ciclo de pago manual
- Datos de cobro del administrador (visibles solo para miembros aprobados)
- Recordatorios de pago por notificación push
- Calificaciones entre usuarios
- Reportes de usuarios
- Accesibilidad implementada en todas las pantallas

### 2.2 Debería tener (Should)

- Referencia de pago en texto
- Historial de pagos por usuario
- Moderación básica de reportes
- Actualizaciones de estado de pago (consulta periódica o push)

### 2.3 Fuera del MVP

- Pasarela de pagos, pago retenido y reembolsos automáticos
- Chat interno
- Verificación de identidad con documentos
- Subida de comprobantes como imagen
- Panel analítico
- Soporte multidivisa
- Integraciones con APIs de plataformas

---

## 3. Decisiones de Arquitectura

Ver documento separado: `docs/DECISIONS.md`

---

## 4. Siguientes secciones (por completar)

- Arquitectura e implementación
- Accesibilidad (matriz trazable)
- Pruebas y validación
- Conclusiones y trabajo futuro
