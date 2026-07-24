# Plan de implementación

## Fase 1 — Fundaciones

- Sistema visual responsive, claro/oscuro y navegación adaptativa.
- Registro, inicio/cierre de sesión y recuperación de contraseña.
- Sesiones persistentes, protección optimista en Proxy y autorización en DAL.
- Esquema inicial, migración, categorías predeterminadas y datos demo opcionales.
- Dashboard real con balance, indicadores, gráficos, actividad y estados vacíos.
- Loading UI, límites de error, accesibilidad base y pruebas del núcleo.

## Fase 2 — Libro financiero

- CRUD de cuentas, categorías y transacciones.
- Transferencias atómicas entre cuentas.
- CRC/USD, tipos de cambio manuales y balance consolidado.
- Búsqueda, filtros, paginación, adjuntos y exportación del libro.

## Fase 3 — Fuentes de ingreso

- Tours, gastos asociados, estados, clientes y métricas.
- Proyectos web, hitos, pagos parciales, gastos, horas y rentabilidad.
- Integración contable: registrar pagos crea transacciones en el mismo commit.

## Fase 4 — Planificación

- Presupuestos y umbrales.
- Metas y aportes.
- Deudas, cuentas por cobrar y cuotas.
- Recurrentes con confirmación antes de registrar.

## Fase 5 — Análisis

- Calendario financiero unificado.
- Reportes filtrables y exportación CSV, XLSX y PDF.
- Alertas deterministas basadas únicamente en datos almacenados.
- Cierres mensuales y evolución del patrimonio.

## Fase 6 — Producción

- Pruebas unitarias, integración y E2E de flujos críticos.
- Revisión RLS, permisos, rate limiting y registros de auditoría.
- Accesibilidad WCAG, responsive, rendimiento y observabilidad.
- Backups, runbook, variables de Vercel y despliegue.

## Criterio de avance

Cada fase termina con migración reproducible, datos de prueba aislados, lint,
TypeScript, pruebas y build exitosos. Ningún total financiero se acepta si solo se
calcula en el navegador.
