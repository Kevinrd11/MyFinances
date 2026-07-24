# Arquitectura de MyFinances

## Diagnóstico de partida

El repositorio era un `create-next-app` de Next.js 16.2.11 casi intacto. Ya incluía
TypeScript estricto, Tailwind CSS 4, Prisma 6, PostgreSQL, Zod, Recharts y un esquema
financiero amplio. No existían rutas de producto, autenticación, capa de datos,
migraciones, semillas, pruebas ni componentes reutilizables. La carpeta tampoco
contiene metadatos de Git.

El esquema existente es la principal pieza reutilizable. Modela cuentas,
transacciones, tours, proyectos, presupuestos, metas, deudas, recurrencias,
notificaciones, tipos de cambio y auditoría. La implementación se construye sobre
él sin mezclar datos de demostración con datos reales.

## Decisiones estructurales

- Next.js App Router con Server Components por defecto.
- Client Components únicamente para formularios interactivos, navegación móvil,
  tema y gráficos.
- Server Actions para mutaciones progresivas; cada acción vuelve a autenticar,
  validar con Zod y autorizar por `userId`.
- Prisma como adaptador actual de PostgreSQL, encapsulado en una capa DAL
  exclusivamente de servidor. El dominio no depende de componentes React.
- Sesiones opacas persistidas en base de datos. El navegador recibe un token
  aleatorio en una cookie `HttpOnly`, `SameSite=Lax` y `Secure` en producción; la
  base guarda solo su hash SHA-256.
- Contraseñas con bcrypt, recuperación mediante tokens de un solo uso y limitación
  persistente de intentos de autenticación.
- Cálculos monetarios con `Decimal` en persistencia y funciones puras en dominio.
  Nunca se usa coma flotante como fuente de verdad para saldos.
- CRC y USD se conservan en su moneda original. Cada conversión guarda el tipo de
  cambio aplicado; los consolidados usan la moneda principal del usuario.
- Los balances se derivan del balance inicial y del libro de transacciones. Las
  transferencias se representan como dos movimientos unidos por `transferGroupId`
  y no afectan ingresos ni gastos.
- Eliminación lógica en entidades financieras que requieren trazabilidad.
- Auditoría para acciones sensibles y mutaciones relevantes.

## Capas

```text
src/app              rutas, layouts, loading/error UI y Server Actions
src/components       sistema visual y componentes del producto
src/features         módulos por dominio (transacciones, tours, proyectos...)
src/lib/auth          identidad, sesiones, recuperación y rate limiting
src/lib/data          consultas autorizadas y agregados de dashboard
src/lib/finance       cálculos puros de dinero, balances y conversiones
prisma                esquema, migraciones y datos iniciales opcionales
```

## Esquema de datos

`User` es el propietario raíz. Todas las entidades privadas incluyen `userId` e
índices que comienzan por ese campo. Las relaciones principales son:

- `User -> Account -> Transaction`.
- `Transaction -> Category`, etiquetas y adjuntos.
- Una transacción puede respaldar un pago de proyecto, aporte a meta, pago de
  deuda o ingreso de tour.
- `Client -> WebProject -> ProjectPayment / ProjectExpense`.
- `TourType -> Tour`.
- `Category -> Budget`.
- `SavingsGoal -> GoalContribution`.
- `Debt -> DebtPayment`.
- `RecurringTransaction -> Transaction`.
- `ExchangeRate`, `Notification`, `MonthlyClosing`, `AuditLog` y
  `FinancialNote` pertenecen directamente al usuario.

La jerarquía `Category.parentId` permite subcategorías sin duplicar conceptos. Las
sesiones, tokens de recuperación y contadores de rate limiting están separados del
libro financiero.

En producción se aplica defensa en profundidad: filtros obligatorios por `userId`
en la DAL, claves foráneas, restricciones, rol PostgreSQL sin privilegios de
propietario y políticas RLS basadas en el identificador de usuario asignado a la
transacción. Las migraciones de cada módulo incluyen sus políticas junto con las
tablas.

## Rutas

```text
/                         entrada inteligente
/iniciar-sesion           autenticación
/registro                 alta, controlada por ALLOW_REGISTRATION
/recuperar                solicitud de recuperación
/restablecer              cambio de contraseña por token
/inicio                   dashboard
/transacciones            libro diario
/tours                    actividad turística
/proyectos                proyectos web
/cuentas                  cuentas y efectivo
/presupuestos             presupuestos
/metas                    ahorro
/deudas                   deudas y cuentas por cobrar
/calendario               eventos financieros
/reportes                  análisis y exportación
/configuracion             preferencias
```

`src/proxy.ts` realiza solo una comprobación optimista de presencia de cookie.
Cada página privada y cada acción verifican la sesión contra PostgreSQL; Proxy no
es la frontera de autorización.

## Seguridad operativa

- Los secretos permanecen sin prefijo `NEXT_PUBLIC_`.
- Los mensajes de acceso y recuperación no permiten enumerar cuentas.
- Los tokens caducan, se rotan y se almacenan hasheados.
- Los formularios tienen validación equivalente en navegador y servidor.
- Los errores públicos son genéricos; el registro técnico no incluye secretos.
- Producción requiere HTTPS, `AUTH_SECRET` fuerte, usuario PostgreSQL restringido,
  respaldo cifrado y entrega real de correo para recuperación.

