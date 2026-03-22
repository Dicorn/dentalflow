# DentalFlow 🦷

SaaS de gestión para clínicas dentales pequeñas. Construido con Next.js 16, Prisma, Better Auth y HeroUI.

## Stack

- **Framework**: Next.js 16.1.7 (App Router + Server Components)
- **DB**: PostgreSQL + Prisma 7
- **Auth**: Better Auth 1.5
- **UI**: HeroUI v2 + Tailwind CSS 3.4
- **Data fetching**: TanStack Query v5
- **Tablas**: TanStack Table v8
- **Calendario**: FullCalendar v6
- **Gráficos**: Recharts v3
- **Validación**: Zod v4 + React Hook Form v7

## Instalación rápida

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tu DATABASE_URL y BETTER_AUTH_SECRET

# 3. Crear base de datos (PostgreSQL debe estar corriendo)
npm run db:push

# 4. Seed de datos demo
npm run db:seed

# 5. Iniciar en desarrollo
npm run dev
```

Accede a [http://localhost:3000](http://localhost:3000)

**Cuenta demo**: `demo@dental.com` / `demo1234`

## Variables de entorno requeridas

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/dentalflow"
BETTER_AUTH_SECRET="genera-con-openssl-rand-base64-32"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
CRON_SECRET="tu-cron-secret"
```

## Estructura del proyecto

```
app/
├── (public)/       → Landing, Login (sin auth)
├── (app)/          → Dashboard, Calendario, Pacientes, Pagos, Recordatorios, Config
└── api/            → Endpoints REST

components/
├── landing/        → Secciones de la landing page
├── app/            → Sidebar, Header
├── auth/           → LoginForm
└── modules/        → Componentes por módulo (dashboard, calendar, patients, payments, reminders, settings)

lib/
├── auth.ts         → Better Auth config (server)
├── auth-client.ts  → Better Auth client
├── auth-server.ts  → requireAuth(), getServerSession()
├── prisma.ts       → Singleton PrismaClient
├── utils.ts        → Helpers, formatters, status maps
├── validations/    → Schemas Zod
└── actions/        → Server Actions (appointments, patients, payments, reminders, dashboard)

prisma/
├── schema.prisma   → Modelos: User, Patient, Appointment, Payment, ReminderLog
└── seed.ts         → Datos demo
```

## Comandos

```bash
npm run dev          # Desarrollo con Turbopack
npm run build        # Build producción
npm run db:push      # Sync schema → DB (dev)
npm run db:migrate   # Migración formal
npm run db:studio    # Abrir Prisma Studio
npm run db:seed      # Cargar datos demo
npm run db:generate  # Regenerar Prisma Client
```

## Módulos

| Módulo | Ruta | Descripción |
|--------|------|-------------|
| Dashboard | `/dashboard` | Stats, gráficos, actividad reciente |
| Calendario | `/calendar` | FullCalendar semanal, crear/editar citas |
| Pacientes | `/patients` | Lista con búsqueda, historial médico |
| Pagos | `/payments` | Filtros, exportación CSV |
| Recordatorios | `/reminders` | Log de recordatorios, envío manual |
| Configuración | `/settings` | Datos del dentista y clínica |

## Despliegue en Vercel

1. Conectar repositorio en Vercel
2. Configurar variables de entorno
3. El cron de recordatorios se activa automáticamente via `vercel.json`

```bash
npm run build  # verificar que compila
```

## Notas de implementación

- **Modales**: Todos usan `createPortal(modal, document.body)` con `z-[9999]`
- **Decimal → Number**: Los montos de Prisma (Decimal) se serializan a number antes de pasar al cliente
- **Recordatorios MVP**: Se simulan y guardan con status `SIMULATED`. Para producción, activar Twilio.
- **Protección de rutas**: `proxy.ts` (Next.js 16 usa proxy en lugar de middleware)
- **Pagos de pacientes**: Son internos de la app, NO pasan por Culqi. Culqi es solo para suscripción SaaS.
