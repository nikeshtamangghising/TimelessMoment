# E-commerce Platform

A modern e-commerce platform built with Next.js 14, featuring a responsive design, secure payments, and comprehensive admin tools.

## Features

- **Frontend**: Next.js 14 with App Router, ISR for blazing fast pages
- **Responsive Design**: TailwindCSS for mobile, tablet, and desktop
- **SEO Optimized**: Auto-generated sitemap, JSON-LD structured data, meta tags
- **Payments**: Stripe checkout with order confirmation emails
- **Admin Dashboard**: Product management, inventory tracking, order fulfillment
- **Authentication**: NextAuth.js with role-based access control
- **Database**: PostgreSQL with Prisma ORM

## Tech Stack

- Next.js 14
- TypeScript
- TailwindCSS
- Prisma ORM
- NextAuth.js
- Stripe
- PostgreSQL

## Getting Started

### Prerequisites

- Node.js 18+ 
- Docker (for local database)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Fill in your actual values for database, Stripe, and other services.

4. Start Docker Desktop (if not already running)

5. Set up the database (automated):
   ```bash
   npm run db:setup
   ```
   
   Or manually:
   ```bash
   # Start PostgreSQL container
   docker run --name pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=ecommerce -p 5432:5432 -d postgres
   
   # Push schema and seed data
   npm run db:push
   npm run db:seed
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with sample data

## Deployment

This project is optimized for deployment on Vercel. Simply connect your repository to Vercel and it will automatically deploy.

Make sure to set up your environment variables in the Vercel dashboard.

## License

MIT