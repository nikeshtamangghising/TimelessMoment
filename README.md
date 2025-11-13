# TimelessMoment — Next.js E‑commerce Platform

A production-ready e‑commerce platform built with Next.js (App Router) and TypeScript. It features secure payments, robust admin tooling, inventory tracking, email notifications, and a modern, responsive UI.

## Features

- Next.js App Router with server/client component separation
- Responsive UI with TailwindCSS and custom animations
- Multiple payment gateways (eSewa, Khalti) with webhook verification
- Role-based authentication (NextAuth.js)
- PostgreSQL + Drizzle ORM schema with migrations
- Inventory tracking with low‑stock alerts and audit trails
- Order workflow (PENDING → PROCESSING → SHIPPED → DELIVERED)
- Transactional emails via Resend with templates and logging
- Health checks at `/api/health`
- Admin dashboard for products, orders, inventory

## Tech Stack

- Next.js 15, TypeScript
- TailwindCSS
- Drizzle ORM, PostgreSQL
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
- PostgreSQL database (Neon or local)

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

3) Set up the database
```bash
npm run db:push
```
This applies the Drizzle schema to your PostgreSQL database.

4) Seed the database with sample data
```bash
npm run db:seed
```

5) Start the dev server
```bash
npm run dev
```
Open http://localhost:3000

## Scripts

- Generate migrations: `npm run db:generate`
- Push schema to DB: `npm run db:push`
- Run migrations: `npm run db:migrate`
- Seed data: `npm run db:seed`
- Lint: `npm run lint`
- Build: `npm run build`
- Start (prod): `npm run start`

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

- PostgreSQL database with Drizzle ORM
- Using Neon PostgreSQL: `postgresql://neondb_owner:...@ep-steep-forest-a143un19-pooler.ap-southeast-1.aws.neon.tech/neondb`

## Important Paths

- Drizzle Schema: `src/lib/db/schema.ts`
- API Routes: `src/app/api/`
- Components: `src/components/`
- Context Providers: `src/contexts/`
- Tests: `src/__tests__/`

## Deployment

- Supports production build via `npm run build` and `npm run start`.
- Ensure all environment variables are configured in your host (e.g., Vercel, Docker secrets).

## Key Improvements & Enhancements

### MVP Improvements
The platform follows "beat Amazon" principles focusing on product-first approach, mobile responsiveness, performance optimization, and simplified user experience:

1. **Prominent Search Bar** - Front and center in both desktop and mobile layouts
2. **Mobile-First Sticky Bottom Navigation** - Easy access to key sections
3. **Product-First Homepage** - Focus on product discovery rather than company story
4. **Visual Category Icons** - Shopping window approach with beautiful category tiles
5. **Mobile-First Product Grid** - 2-column mobile layout optimized for touch
6. **Advanced Search with Autocomplete** - Lightning-fast search with real-time suggestions
7. **Guest Checkout** - No forced registration at checkout for better conversion
8. **Performance Optimizations** - Image optimization, caching, and lazy loading

### UI/UX Enhancements
- **Enhanced Product Cards** - Modern design with better visual appeal and interactions
- **Improved Responsive Design** - Granular breakpoints for better mobile experience
- **Better Loading States** - Enhanced skeleton components with shimmer effects
- **Enhanced Button Design** - Stacked layout with gradient backgrounds
- **Improved Touch Interactions** - Larger touch targets and better spacing

### Technical Improvements
- **Production-Ready Configuration** - ESLint v9 migration with zero build errors
- **TypeScript Enhancements** - Comprehensive type definitions and safety
- **Performance Optimizations** - Image optimization, caching, and bundle optimization
- **Mobile Search Fix** - Resolved 404 errors when accessing search via mobile navigation
- **Quick Wins Implementation** - Higher grid density, load more button, sticky filters

## Production Readiness

The codebase has been optimized for production deployment with:
- Zero build errors
- Comprehensive error handling
- Production-optimized ESLint configuration
- TypeScript type safety
- Performance optimizations
- Security best practices

## License

MIT