# PowerShell script to set up the development database

Write-Host "🐘 Setting up PostgreSQL database..." -ForegroundColor Green

# Check if Docker is running
try {
    docker version | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check if container already exists
$containerExists = docker ps -a --filter "name=pg" --format "{{.Names}}" | Select-String "^pg$"

if ($containerExists) {
    Write-Host "📦 PostgreSQL container already exists. Starting it..." -ForegroundColor Yellow
    docker start pg
} else {
    Write-Host "📦 Creating new PostgreSQL container..." -ForegroundColor Blue
    docker run --name pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=ecommerce -p 5432:5432 -d postgres
}

# Wait for database to be ready
Write-Host "⏳ Waiting for database to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Push schema and seed database
Write-Host "🔄 Pushing database schema..." -ForegroundColor Blue
npm run db:push

Write-Host "🌱 Seeding database with sample data..." -ForegroundColor Blue
npm run db:seed

Write-Host "✅ Database setup complete!" -ForegroundColor Green
Write-Host '🔗 Database URL: postgresql://postgres:postgres@localhost:5432/ecommerce' -ForegroundColor Cyan