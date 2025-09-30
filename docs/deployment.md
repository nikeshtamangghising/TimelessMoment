# Production Deployment Guide

This guide covers deploying the ecommerce platform to production using Vercel and setting up all necessary infrastructure.

## Prerequisites

- [Vercel CLI](https://vercel.com/cli) installed
- [PostgreSQL database](https://vercel.com/docs/storage/vercel-postgres) (Vercel Postgres or external)
- [Stripe account](https://stripe.com) with live keys
- [Email service](https://resend.com) account
- Domain name (optional but recommended)

## Environment Setup

### 1. Database Setup

#### Option A: Vercel Postgres (Recommended)
```bash
# Install Vercel Postgres
vercel storage create postgres

# This will provide you with:
# - DATABASE_URL
# - DIRECT_URL (for connection pooling)
```

#### Option B: External PostgreSQL
Set up a PostgreSQL database with your preferred provider:
- [Neon](https://neon.tech)
- [Supabase](https://supabase.com)
- [PlanetScale](https://planetscale.com)
- [Railway](https://railway.app)

### 2. Environment Variables

Copy the production environment template:
```bash
cp .env.production.example .env.production
```

Fill in all required values:

#### Required Variables
```bash
# Application
NODE_ENV=production
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-super-secret-nextauth-secret-here

# Database
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
DIRECT_URL=postgresql://username:password@host:port/database?sslmode=require&pgbouncer=true

# Stripe (Live Keys)
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email Service
RESEND_API_KEY=re_...
FROM_EMAIL=noreply@yourdomain.com
```

#### Optional Variables
```bash
# Monitoring
SENTRY_DSN=https://...@sentry.io/...
VERCEL_ANALYTICS_ID=your-analytics-id

# Performance
REDIS_URL=redis://username:password@host:port
CDN_URL=https://cdn.yourdomain.com

# Feature Flags
ENABLE_ANALYTICS=true
ENABLE_MONITORING=true
ENABLE_CACHING=true
```

## Deployment Steps

### 1. Initial Setup

```bash
# Login to Vercel
vercel login

# Link project to Vercel
vercel link

# Set up environment variables
vercel env add NODE_ENV production
vercel env add NEXTAUTH_URL https://your-domain.vercel.app
vercel env add NEXTAUTH_SECRET your-secret-here
# ... add all other environment variables
```

### 2. Database Migration

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Seed production data (optional)
npx prisma db seed
```

### 3. Deploy to Production

```bash
# Deploy to production
vercel --prod

# Or use GitHub integration for automatic deployments
```

### 4. Post-Deployment Setup

#### Configure Custom Domain (Optional)
```bash
# Add custom domain
vercel domains add yourdomain.com

# Configure DNS records as instructed by Vercel
```

#### Set up Stripe Webhooks
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Create new webhook endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `checkout.session.completed`
4. Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

#### Configure Email Service
1. Set up [Resend](https://resend.com) account
2. Add your domain for sending emails
3. Verify domain ownership
4. Copy API key to `RESEND_API_KEY`

## Monitoring Setup

### 1. Error Tracking (Sentry)

```bash
# Install Sentry
npm install @sentry/nextjs

# Initialize Sentry
npx @sentry/wizard -i nextjs

# Add DSN to environment variables
vercel env add SENTRY_DSN your-sentry-dsn
```

### 2. Performance Monitoring

The application includes built-in performance monitoring. Enable it by setting:
```bash
vercel env add ENABLE_MONITORING true
```

### 3. Health Checks

Health check endpoints are available at:
- `/api/health` - Overall application health
- `/api/health/ready` - Readiness probe

Set up monitoring alerts for these endpoints.

## Backup and Recovery

### 1. Database Backups

Set up automated backups using the provided script:

```bash
# Make backup script executable
chmod +x scripts/backup-database.sh

# Set up cron job for daily backups
crontab -e

# Add this line for daily backup at 2 AM
0 2 * * * /path/to/your/project/scripts/backup-database.sh
```

#### Environment Variables for Backups
```bash
export DATABASE_URL="your-production-database-url"
export BACKUP_DIR="/path/to/backup/directory"
export RETENTION_DAYS=7
export AWS_S3_BUCKET="your-backup-bucket" # Optional
export WEBHOOK_URL="your-notification-webhook" # Optional
```

### 2. Disaster Recovery

To restore from backup:

```bash
# Restore database
./scripts/restore-database.sh ecommerce_backup_20231201_120000.sql.gz

# Redeploy application
vercel --prod
```

## Security Checklist

### Pre-Deployment
- [ ] All environment variables are set correctly
- [ ] Database credentials are secure
- [ ] Stripe webhook secret is configured
- [ ] NEXTAUTH_SECRET is cryptographically secure
- [ ] All API keys are production keys, not test keys

### Post-Deployment
- [ ] HTTPS is enabled (automatic with Vercel)
- [ ] Security headers are configured (check `next.config.js`)
- [ ] Database connections use SSL
- [ ] Webhook endpoints are secured
- [ ] Error tracking is configured
- [ ] Monitoring is active

## Performance Optimization

### 1. Caching Strategy

The application uses multiple caching layers:
- **ISR (Incremental Static Regeneration)** for product pages
- **Client-side caching** for API responses
- **Database query optimization** with Prisma
- **Image optimization** with Next.js Image component

### 2. CDN Configuration

If using a custom CDN:
```bash
vercel env add CDN_URL https://cdn.yourdomain.com
```

### 3. Database Optimization

- Use connection pooling (DIRECT_URL with pgbouncer)
- Enable query optimization in Prisma
- Monitor slow queries
- Set up read replicas for high traffic

## Monitoring and Alerts

### 1. Application Metrics

Monitor these key metrics:
- Response time (< 200ms for API endpoints)
- Error rate (< 1%)
- Database query performance
- Memory usage
- CPU usage

### 2. Business Metrics

Track important business events:
- Order completion rate
- Cart abandonment rate
- User registration rate
- Revenue metrics

### 3. Alert Configuration

Set up alerts for:
- Application errors (> 10 errors/minute)
- High response times (> 1 second)
- Database connection issues
- Payment processing failures
- Low inventory levels

## Scaling Considerations

### 1. Database Scaling

- **Vertical scaling**: Increase database instance size
- **Horizontal scaling**: Add read replicas
- **Connection pooling**: Use PgBouncer or similar
- **Query optimization**: Monitor and optimize slow queries

### 2. Application Scaling

Vercel automatically scales your application, but consider:
- **Function timeout limits**: Optimize long-running operations
- **Memory limits**: Monitor memory usage
- **Cold starts**: Use edge functions for better performance

### 3. External Services

- **Stripe**: No scaling needed, handles high volume
- **Email service**: Monitor rate limits
- **Image storage**: Use CDN for better performance

## Troubleshooting

### Common Issues

#### 1. Database Connection Errors
```bash
# Check database connectivity
npx prisma db pull

# Verify environment variables
vercel env ls
```

#### 2. Stripe Webhook Issues
- Verify webhook URL is accessible
- Check webhook secret matches
- Monitor webhook delivery in Stripe dashboard

#### 3. Email Delivery Issues
- Verify domain is configured in Resend
- Check API key permissions
- Monitor email delivery logs

#### 4. Performance Issues
- Check function execution logs
- Monitor database query performance
- Verify caching is working correctly

### Debugging Tools

```bash
# View deployment logs
vercel logs

# Check function performance
vercel inspect

# Monitor real-time logs
vercel logs --follow
```

## Maintenance

### Regular Tasks

#### Daily
- [ ] Monitor error rates
- [ ] Check application performance
- [ ] Verify backup completion

#### Weekly
- [ ] Review security alerts
- [ ] Update dependencies (if needed)
- [ ] Analyze performance metrics

#### Monthly
- [ ] Review and rotate secrets
- [ ] Update documentation
- [ ] Perform disaster recovery test
- [ ] Review and optimize costs

### Updates and Deployments

```bash
# Deploy updates
git push origin main  # If using GitHub integration

# Or manual deployment
vercel --prod

# Rollback if needed
vercel rollback
```

## Support and Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [Application Health Checks](https://yourdomain.com/api/health)

## Emergency Contacts

Maintain a list of emergency contacts and procedures:
- Database provider support
- Vercel support
- Stripe support
- Domain registrar support
- Team contact information