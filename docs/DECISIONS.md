# Cuotix: Registro de Decisiones

> Decisiones de diseño y arquitectura tomadas durante el proyecto.

---

## DEC-001: Pagos manuales (sin pasarela)

**Fecha:** 2024-11
**Estado:** Aprobada

### Contexto

La propuesta original contemplaba integrar una pasarela de pagos con pago retenido (escrow) para proteger a los miembros.

### Decisión

Cuotix **no procesa ni custodia dinero**. El miembro paga directamente al administrador (transferencia, Nequi, Daviplata, Bre-B). Cuotix registra, recuerda y confirma.

### Razones

1. **Comisiones altas para cuotas pequeñas:** Las pasarelas colombianas (Wompi, PayU) cobran comisiones fijas + porcentaje + IVA que en cuotas de ~$10.000 COP representan un porcentaje significativo. *(Nota: Las cifras exactas deben verificarse con cotización oficial de cada pasarela.)*

2. **Riesgo regulatorio:** Retener dinero de terceros y liberarlo después puede constituir una actividad regulada por la Superintendencia Financiera de Colombia. *(Nota: Supuesto razonable; no se consultó asesoría legal.)*

3. **Alcance del proyecto:** Implementar pagos recurrentes, webhooks, idempotencia, ledger, conciliación y desembolsos con calidad no cabe en un semestre con tres personas, junto con los requisitos de accesibilidad.

### Consecuencias

- Se pierde el cobro automático y el pago retenido.
- Se compensa con:
  - Sistema de reputación basado en historial de pagos a tiempo
  - Confirmación doble (miembro marca "pagué", administrador confirma)
  - Regla de protección: la primera cuota solo se genera tras confirmar acceso
- **Trabajo futuro:** Integrar pasarela con cobros recurrentes tokenizados.

### Cómo presentarlo

En el documento final, esto se presenta como **decisión de ingeniería documentada** (evolución del producto basada en restricciones reales), no como incumplimiento de la propuesta original.

---

## DEC-002: Propuesta de valor vs. alternativas informales

**Fecha:** 2024-11
**Estado:** Aprobada

### Contexto

Sin pagos integrados, surge la pregunta: ¿por qué usar Cuotix en lugar de coordinar por WhatsApp + hoja de cálculo + recordatorios de calendario?

### Decisión

El diferenciador principal es la **conveniencia centralizada**:

- Una sola plataforma para buscar grupos disponibles
- Solicitar acceso sin depender de conocer al administrador
- Gestión automática de cupos (el sistema sabe cuántos lugares hay)
- Recordatorios automáticos sin configuración manual
- Historial de reputación visible antes de unirse
- No fragmentarse entre múltiples apps y redes sociales

### Consecuencias

- Este diferenciador debe comunicarse claramente en la documentación y la demo.
- La propuesta de valor es más débil que con pagos integrados, pero sigue siendo válida.

---

## DEC-003: Evidencia del problema

**Fecha:** 2024-11
**Estado:** Documentada con limitaciones

### Contexto

La sección de visión requiere justificar que el problema existe.

### Decisión

Se validó informalmente mediante investigación en internet. No se cuenta con:
- Encuestas propias a usuarios potenciales
- Datos cuantitativos de grupos existentes
- Análisis detallado de competidores formales

### Consecuencias

- La sección de "problema y estado del arte" en el documento final tendrá menor profundidad.
- Si un evaluador pregunta por datos específicos, la respuesta honesta es que se basó en observación informal.

---

## DEC-004: Personas de usuario

**Fecha:** 2024-11
**Estado:** No definidas

### Contexto

Las personas (user personas) ayudan a guiar decisiones de diseño y justificar características de accesibilidad.

### Decisión

No se definieron personas formales para el MVP.

### Consecuencias

- Las decisiones de diseño se justifican por sentido común y requisitos del enunciado, no por personas específicas.
- La justificación de accesibilidad se basa en cumplir los criterios técnicos evaluados, no en una persona con discapacidad definida.

---

## DEC-005: Análisis de competidores

**Fecha:** 2024-11
**Estado:** Alcance mínimo

### Contexto

El estado del arte típicamente incluye análisis de competidores.

### Decisión

Solo se menciona la alternativa informal (grupos de WhatsApp/Facebook). No se analizaron plataformas formales como Together Price, ShareSub o Spliiit.

### Consecuencias

- La matriz competitiva en el documento final será limitada.
- Se desconoce si estas plataformas operan en Colombia o cómo se comparan.

---

## Decisiones pendientes

- [ ] Confirmar con el profesor si basta ejecutar en local
- [ ] Ratificar reglas de negocio (días de gracia, mora, ingreso a mitad de mes)
- [ ] Elegir servicios del catálogo inicial y verificar condiciones oficiales
- [ ] Decidir si Google Sign-In entra o queda como futuro
- [ ] Decidir si el comprobante será solo texto o imagen
- [ ] Repartir módulos verticales entre integrantes
