# TimelessMoment — Next.js E‑commerce Platform

A production-ready e‑commerce platform built with Next.js (App Router) and TypeScript. It features secure payments, robust admin tooling, inventory tracking, email notifications, and a modern, responsive UI.

- Live development: http://localhost:3000
- Repository: https://github.com/nikeshtamangghising/TimelessMoment

## Features

- Next.js App Router with server/client component separation
- Responsive UI with TailwindCSS and custom animations
- Multiple payment gateways (eSewa, Khalti) with webhook verification
- Role-based authentication (NextAuth.js)
- PostgreSQL + Prisma ORM schema with migrations
- Inventory tracking with low‑stock alerts and audit trails
- Order workflow (PENDING → PROCESSING → SHIPPED → DELIVERED)
- Transactional emails via Resend with templates and logging
- Health checks at `/api/health`
- Admin dashboard for products, orders, inventory

## Tech Stack

- Next.js 15, TypeScript
- TailwindCSS
- Prisma ORM, PostgreSQL
- NextAuth.js
- eSewa, Khalti
- Zustand (cart state) + React Context providers

## Architecture Overview

- Database schema defines Users (CUSTOMER/ADMIN), Products, Orders, Inventory adjustments, Email logs.
- State: Zustand for cart (`@/stores/cart-store`), async ops via Cart Context.
- API: REST routes under `/api/*`; admin routes protected via role-based middleware.
- Components: Layouts (Header, Footer, MainLayout with cart sidebar), feature modules (products, cart, checkout, admin dashboard), reusable UI.

## Getting Started

### Prerequisites

- Node.js 18+
- Docker (for local PostgreSQL)

### Setup

1) Install dependencies
```bash
npm install
```

2) Configure environment
```bash
cp .env.example .env.local
```
Fill in database URL, payment gateway credentials (eSewa/Khalti), NextAuth secret, Resend, etc.

3) Set up the database (automated)
```bash
npm run db:setup
```
This provisions PostgreSQL (via Docker) and applies the Prisma schema.

4) Start the dev server
```bash
npm run dev
```
Open http://localhost:3000

## Scripts

- Generate Prisma client: `npm run db:generate`
- Push schema to DB: `npm run db:push`
- Run migrations: `npm run db:migrate`
- Seed data: `npm run db:seed`
- Lint: `npm run lint`
- Build: `npm run build`
- Start (prod): `npm run start`

## Docker (Development)

```bash
npm run docker:dev          # Start dev environment
npm run docker:dev:build    # Start with rebuild
npm run docker:dev:logs     # View logs
npm run docker:dev:down     # Stop containers

npm run docker:db:migrate   # DB migrations in Docker
npm run docker:db:reset     # Reset DB in Docker
```

## Testing

```bash
npm run test           # Unit (Jest)
npm run test:watch

npm run test:e2e       # E2E (Playwright)
npm run test:e2e:ui    # Playwright UI
npm run test:e2e:headed
npm run test:e2e:debug
npm run test:e2e:report

npm run test:all       # Run all tests
```

## Environment Variables

Set these in `.env.local` (and your deployment platform):

- DATABASE_URL
- NEXTAUTH_SECRET
- NEXTAUTH_URL
- RESEND_API_KEY

## Useful Endpoints

- Health check: `GET /api/health`
- Products API: `/api/products`
- Admin dashboard: `/admin`

## Database Access (Dev)

- Default Docker PostgreSQL
  - Host: `localhost:5432`
  - DB: `ecommerce`
  - User: `postgres`
  - Password: `postgres`
- Adminer (when using Docker): http://localhost:8080
- Direct psql: `docker-compose exec postgres psql -U postgres -d ecommerce`

## Important Paths

- Prisma Schema: `prisma/schema.prisma`
- API Routes: `src/app/api/`
- Components: `src/components/`
- Context Providers: `src/contexts/`
- Tests: `src/__tests__/`
- Docker: `docker-compose.yml`, `Dockerfile.dev`

## Deployment

- Supports production build via `npm run build` and `npm run start`.
- Docker production: `npm run docker:prod`, `npm run docker:prod:build`.
- Ensure all environment variables are configured in your host (e.g., Vercel, Docker secrets).

## License

MIT
