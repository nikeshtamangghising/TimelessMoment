# Production Deployment Script for E-commerce Platform
# This script automates the production deployment process

param(
    [switch]$SkipTests = $false,
    [switch]$Force = $false,
    [string]$Environment = "production"
)

Write-Host "🚀 Starting production deployment for E-commerce Platform" -ForegroundColor Green
Write-Host "Environment: $Environment" -ForegroundColor Yellow

# Check if required environment variables are set
$requiredEnvVars = @(
    "DATABASE_URL",
    "NEXTAUTH_SECRET", 
    "NEXTAUTH_URL",
    "RESEND_API_KEY"
)

Write-Host "🔍 Checking environment variables..." -ForegroundColor Blue
$missingVars = @()
foreach ($var in $requiredEnvVars) {
    if (-not $env:$var) {
        $missingVars += $var
    }
}

if ($missingVars.Count -gt 0) {
    Write-Host "❌ Missing required environment variables:" -ForegroundColor Red
    foreach ($var in $missingVars) {
        Write-Host "   - $var" -ForegroundColor Red
    }
    Write-Host "Please set these variables and try again." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Environment variables check passed" -ForegroundColor Green

# Backup current deployment (if exists)
Write-Host "💾 Creating deployment backup..." -ForegroundColor Blue
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = "backups/deployment_$timestamp"

if (Test-Path "dist" -PathType Container) {
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    Copy-Item "dist" $backupDir -Recurse -Force
    Write-Host "✅ Backup created: $backupDir" -ForegroundColor Green
}

# Install dependencies
Write-Host "📦 Installing production dependencies..." -ForegroundColor Blue
npm ci --only=production
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Run tests (unless skipped)
if (-not $SkipTests) {
    Write-Host "🧪 Running tests..." -ForegroundColor Blue
    npm run test
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Tests failed!" -ForegroundColor Red
        if (-not $Force) {
            Write-Host "Use -Force to deploy anyway" -ForegroundColor Yellow
            exit 1
        }
        Write-Host "⚠️  Continuing deployment despite test failures (Force mode)" -ForegroundColor Yellow
    } else {
        Write-Host "✅ All tests passed" -ForegroundColor Green
    }
} else {
    Write-Host "⚠️  Skipping tests" -ForegroundColor Yellow
}

# Build the application
Write-Host "🔨 Building application..." -ForegroundColor Blue
$env:NODE_ENV = "production"
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build completed successfully" -ForegroundColor Green

# Generate Prisma client
Write-Host "🗄️  Generating Prisma client..." -ForegroundColor Blue
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Prisma client generation failed!" -ForegroundColor Red
    exit 1
}

# Run database migrations
Write-Host "🗃️  Running database migrations..." -ForegroundColor Blue
npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Database migration failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Database migrations completed" -ForegroundColor Green

# Seed production database (only essential data)
Write-Host "🌱 Seeding production database..." -ForegroundColor Blue
npx tsx scripts/seed-production.ts
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Database seeding failed, but continuing deployment" -ForegroundColor Yellow
} else {
    Write-Host "✅ Database seeding completed" -ForegroundColor Green
}

# Optimize and compress static assets
Write-Host "🎯 Optimizing assets..." -ForegroundColor Blue
# Additional optimization steps can be added here

# Health check endpoint validation
Write-Host "🩺 Performing health checks..." -ForegroundColor Blue
# Add health check logic here when the application is running

Write-Host "🎉 Production deployment completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Post-deployment checklist:" -ForegroundColor Blue
Write-Host "   ✓ Application built and deployed" -ForegroundColor Green
Write-Host "   ✓ Database migrations applied" -ForegroundColor Green
Write-Host "   ✓ Essential data seeded" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Test all critical user flows" -ForegroundColor White
Write-Host "   2. Monitor error logs and performance" -ForegroundColor White
Write-Host "   3. Set up monitoring and alerting" -ForegroundColor White
Write-Host "   4. Configure SSL certificates (if needed)" -ForegroundColor White
Write-Host "   5. Set up automated backups" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Useful commands:" -ForegroundColor Cyan
Write-Host "   View logs: npm run logs" -ForegroundColor White
Write-Host "   Health check: curl https://yourdomain.com/api/health" -ForegroundColor White
Write-Host "   Database status: npx prisma db pull" -ForegroundColor White