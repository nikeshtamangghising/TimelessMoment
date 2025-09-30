# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Architecture Overview

This is a **Next.js 14+ E-commerce Platform** built with the App Router pattern, featuring:

### Core Stack
- **Framework**: Next.js 15 with App Router, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: TailwindCSS with custom animations and responsive design
- **Authentication**: NextAuth.js with role-based access control
- **Payments**: Stripe integration with webhooks
- **State Management**: Zustand for cart state, React Context for providers
- **Email**: Resend for transactional emails with template system

### Key Architectural Patterns

**Database Schema**: The Prisma schema defines core e-commerce entities:
- Users with role-based access (CUSTOMER/ADMIN)
- Products with inventory tracking and low-stock alerts
- Orders with status workflow (PENDING → PROCESSING → SHIPPED → DELIVERED)
- Inventory adjustments with audit trails
- Email logs for delivery tracking

**State Management**: 
- Cart state managed via Zustand store (`@/stores/cart-store`)
- Cart Context provides async operations and error handling
- Session management through NextAuth providers

**API Architecture**: 
- RESTful API routes under `/api/`
- Admin routes protected with role-based middleware
- Health checks available at `/api/health`
- Cron jobs for cleanup and analytics

**Component Structure**:
- Layout components: Header, Footer, MainLayout with cart sidebar
- Feature modules: products, cart, checkout, admin dashboard
- Reusable UI components with consistent styling
- Client/Server component separation following Next.js patterns

## Development Commands

### Environment Setup
```powershell
# Copy environment template
Copy-Item .env.example .env.local

# Install dependencies
npm install

# Set up database (automated PostgreSQL container + schema)
npm run db:setup

# Start development server
npm run dev
```

### Database Operations
```powershell
# Generate Prisma client after schema changes
npm run db:generate

# Push schema changes to database
npm run db:push

# Run database migrations
npm run db:migrate

# Seed database with sample data
npm run db:seed
```

### Testing
```powershell
# Unit tests (Jest)
npm run test
npm run test:watch

# End-to-end tests (Playwright)
npm run test:e2e
npm run test:e2e:ui            # Run with Playwright UI
npm run test:e2e:headed        # Run with browser visible
npm run test:e2e:debug         # Debug mode
npm run test:e2e:report        # View test report

# Run all tests
npm run test:all
```

### Docker Development
```powershell
# Start development environment
npm run docker:dev

# Start with rebuild
npm run docker:dev:build

# View logs
npm run docker:dev:logs

# Stop containers
npm run docker:dev:down

# Database operations in Docker
npm run docker:db:migrate
npm run docker:db:reset
```

### Production & Deployment
```powershell
# Build for production
npm run build

# Start production server
npm run start

# Lint code
npm run lint

# Production Docker
npm run docker:prod
npm run docker:prod:build
```

## Key Development Areas

### Adding New Products
Products are managed through:
- Admin dashboard at `/admin`
- API endpoints at `/api/products`
- Database schema includes inventory tracking and low-stock thresholds
- Images stored as URL arrays in database

### Order Processing
Order workflow:
1. Cart state managed in Zustand store
2. Checkout creates Stripe PaymentIntent
3. Order records created with PENDING status
4. Webhook handlers update order status
5. Email notifications sent via Resend

### Authentication & Authorization
- NextAuth.js handles authentication
- Role-based access control (CUSTOMER/ADMIN)
- Admin routes protected via `AdminProtectedRoute` component
- Database sessions stored in PostgreSQL

### Email System
- Transactional emails via Resend API
- Email logs tracked in database with delivery status
- Templates for order confirmations, password resets
- Test endpoint available at `/api/email/test`

## Database Connection

Default development setup uses Docker PostgreSQL:
- Host: localhost:5432
- Database: ecommerce
- User: postgres
- Password: postgres

Access database via:
- Adminer UI: http://localhost:8080 (when using Docker)
- Direct connection: `docker-compose exec postgres psql -U postgres -d ecommerce`

## Important File Locations

- **Database Schema**: `prisma/schema.prisma`
- **Environment Templates**: `.env.example`, `.env.docker`, `.env.production.example`
- **API Routes**: `src/app/api/`
- **Components**: `src/components/` (organized by feature)
- **Context Providers**: `src/contexts/`
- **Test Suites**: `src/__tests__/`
- **Docker Config**: `docker-compose.yml`, `Dockerfile.dev`

## Configuration Notes

- **TypeScript**: Strict mode disabled in `tsconfig.json` for development speed
- **Next.js Config**: Build errors temporarily ignored for faster iteration
- **TailwindCSS**: Custom animations and responsive breakpoints defined
- **Testing**: Playwright configured for multiple browsers and viewports
- **Path Aliases**: `@/*` maps to `src/*` for clean imports

## Development Environment Requirements

- **Node.js**: 18+ required
- **Docker**: Required for database (PostgreSQL container)
- **Environment Variables**: Must configure Stripe keys, database URL, NextAuth secret
- **Port Usage**: 3000 (app), 5432 (PostgreSQL), 8080 (Adminer), 6379 (Redis in Docker)