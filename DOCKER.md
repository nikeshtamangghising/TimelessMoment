# Docker Setup for Ecommerce Platform

This document explains how to run the ecommerce platform using Docker for both development and production environments.

## 🚀 Quick Start

### Prerequisites
- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Docker Compose
- At least 4GB of available RAM

### Development Environment

1. **Copy environment file:**
   ```powershell
   Copy-Item .env.example .env.docker
   ```

2. **Update environment variables in `.env.docker`:**
   - Set your Stripe API keys
   - Set your NextAuth secret
   - Update other API keys as needed

3. **Start the development environment:**
   ```powershell
   npm run docker:dev
   ```

4. **Run database migrations:**
   ```powershell
   npm run docker:db:migrate
   ```

5. **Seed the database (optional):**
   ```powershell
   npm run docker:db:seed
   ```

The application will be available at:
- **Main App**: http://localhost:3000
- **Database UI (Adminer)**: http://localhost:8080
- **Redis**: localhost:6379

## 📋 Available Scripts

### Development Commands
```powershell
# Start development environment
npm run docker:dev

# Start with rebuild
npm run docker:dev:build

# View logs
npm run docker:dev:logs

# Stop containers
npm run docker:dev:down

# Clean up (remove volumes and images)
npm run docker:dev:clean

# Database commands
npm run docker:db:migrate
npm run docker:db:seed
npm run docker:db:reset
```

### Production Commands
```powershell
# Start production environment
npm run docker:prod

# Start with rebuild
npm run docker:prod:build

# View logs
npm run docker:prod:logs

# Stop containers
npm run docker:prod:down

# Build image only
npm run docker:build
```

## 🏗️ Architecture

### Development Stack
- **Next.js App** (Hot reload enabled)
- **PostgreSQL 15** (Database)
- **Redis 7** (Caching/Sessions)
- **Adminer** (Database management UI)

### Production Stack
- **Next.js App** (Optimized build)
- **PostgreSQL 15** (Database)
- **Redis 7** (Caching/Sessions)
- **Nginx** (Reverse proxy with rate limiting)

## 🔧 Configuration Files

| File | Purpose |
|------|---------|
| `Dockerfile` | Production multi-stage build |
| `Dockerfile.dev` | Development container |
| `docker-compose.yml` | Development environment |
| `docker-compose.prod.yml` | Production environment |
| `.dockerignore` | Files to exclude from build |
| `.env.docker` | Docker environment variables |
| `nginx.conf` | Nginx configuration for production |

## 🔒 Environment Variables

### Required Variables
```env
# Database
DATABASE_URL="postgresql://postgres:postgres@postgres:5432/ecommerce"

# Authentication
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email
RESEND_API_KEY="re_..."
```

### Production Additional Variables
```env
# Production Database
POSTGRES_PASSWORD="secure-password"
REDIS_PASSWORD="secure-redis-password"

# Site URL
NEXT_PUBLIC_SITE_URL="https://yourdomain.com"
```

## 🗄️ Database Management

### Accessing the Database

**Via Adminer (GUI):**
1. Go to http://localhost:8080
2. Use these credentials:
   - Server: `postgres`
   - Username: `postgres`
   - Password: `postgres`
   - Database: `ecommerce`

**Via Command Line:**
```powershell
# Access PostgreSQL container
docker-compose exec postgres psql -U postgres -d ecommerce

# Run Prisma commands
docker-compose exec app-dev npx prisma studio
```

### Database Operations
```powershell
# Generate Prisma client
docker-compose exec app-dev npx prisma generate

# Push schema changes
docker-compose exec app-dev npx prisma db push

# Run migrations
docker-compose exec app-dev npx prisma migrate dev

# Reset database
docker-compose exec app-dev npx prisma migrate reset

# Seed database
docker-compose exec app-dev npm run db:seed
```

## 🔍 Monitoring & Debugging

### View Logs
```powershell
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app-dev
docker-compose logs -f postgres
docker-compose logs -f redis
```

### Health Checks
- **Application Health**: http://localhost:3000/api/health
- **Database Health**: Automatic health checks in docker-compose
- **Redis Health**: Automatic health checks in docker-compose

### Container Status
```powershell
# View running containers
docker-compose ps

# View resource usage
docker stats

# Access container shell
docker-compose exec app-dev sh
docker-compose exec postgres bash
```

## 🚀 Production Deployment

### 1. Prepare Environment
```powershell
# Copy production environment template
Copy-Item .env.production.example .env.production

# Update with production values
# - Set secure passwords
# - Update domain names
# - Set production API keys
```

### 2. Deploy
```powershell
# Build and start production stack
npm run docker:prod:build

# Or start without building
npm run docker:prod
```

### 3. SSL/HTTPS Setup
For production HTTPS, create SSL certificates and update `nginx.conf`:

```powershell
# Create SSL directory
New-Item -Path "ssl" -ItemType Directory

# Place your SSL certificates in ./ssl/
# - cert.pem
# - privkey.pem
```

### 4. Production URLs
- **Application**: http://localhost (port 80)
- **HTTPS**: https://localhost (port 443, if SSL configured)

## 🐛 Troubleshooting

### Common Issues

**1. Port already in use:**
```powershell
# Find and kill process using port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**2. Database connection issues:**
```powershell
# Check if PostgreSQL is running
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

**3. Permission issues (Windows):**
```powershell
# Run as Administrator or check Docker Desktop settings
# Ensure drive sharing is enabled in Docker Desktop
```

**4. Out of disk space:**
```powershell
# Clean up Docker
docker system prune -a

# Remove unused volumes
docker volume prune
```

**5. Hot reload not working:**
- Ensure volume mounts are correct in docker-compose.yml
- Check Docker Desktop file sharing settings
- Try rebuilding: `npm run docker:dev:build`

### Performance Optimization

**Development:**
- Adjust resource limits in Docker Desktop
- Use volume mounts for faster file access
- Enable BuildKit for faster builds

**Production:**
- Enable multi-stage builds (already configured)
- Use proper caching strategies
- Configure resource limits in docker-compose.prod.yml

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Next.js Docker Documentation](https://nextjs.org/docs/deployment#docker-image)
- [PostgreSQL Docker Documentation](https://hub.docker.com/_/postgres)

## 🤝 Contributing

When contributing to the Docker setup:

1. Test changes in both development and production configurations
2. Update this README if you add new services or change configurations
3. Ensure all health checks work properly
4. Test database migrations and seeding

---

For application-specific documentation, see the main [README.md](README.md).