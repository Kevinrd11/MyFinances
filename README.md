# MyFinances

Aplicación privada para centralizar finanzas personales, tours y proyectos web.

La primera fase incluye autenticación segura con sesiones persistentes,
recuperación de contraseña, protección de rutas, esquema PostgreSQL y dashboard
financiero responsive alimentado por datos reales.

## Desarrollo local

Copie `.env.example` como `.env` y cambie las credenciales y secretos. Luego:

```bash
docker compose up -d
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

El registro público permanece deshabilitado cuando
`ALLOW_REGISTRATION=false`. Para una instalación privada se recomienda crear el
usuario con `npm run db:seed` y mantener esa opción cerrada.

En desarrollo, `PASSWORD_RESET_DELIVERY=development` muestra el enlace de
recuperación dentro de la propia interfaz. Producción debe conectar un proveedor
de correo antes de habilitar esa función.

## Validación

```bash
npm run lint
npm test
npm run build
```

## Documentación

- [Arquitectura](docs/architecture.md)
- [Plan por fases](docs/implementation-plan.md)
