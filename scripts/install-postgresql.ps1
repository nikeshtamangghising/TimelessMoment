# PostgreSQL Installation Script for Windows
# Run this script as Administrator

Write-Host "🔧 Installing PostgreSQL on Windows..." -ForegroundColor Green

# Check if running as administrator
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-NOT $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "❌ This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Install Chocolatey if not installed
if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
    Write-Host "📦 Installing Chocolatey..." -ForegroundColor Yellow
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    
    # Refresh environment variables
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
}

# Install PostgreSQL
Write-Host "📦 Installing PostgreSQL..." -ForegroundColor Yellow
choco install postgresql14 --params '/Password:postgres' -y

# Wait for installation to complete
Start-Sleep -Seconds 10

# Start PostgreSQL service
Write-Host "🚀 Starting PostgreSQL service..." -ForegroundColor Yellow
Start-Service postgresql-x64-14
Set-Service postgresql-x64-14 -StartupType Automatic

Write-Host "✅ PostgreSQL installation completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Connection Details:" -ForegroundColor Cyan
Write-Host "  Host: localhost" -ForegroundColor White
Write-Host "  Port: 5432" -ForegroundColor White
Write-Host "  Username: postgres" -ForegroundColor White
Write-Host "  Password: postgres" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Connection String:" -ForegroundColor Cyan
Write-Host "  postgresql://postgres:postgres@localhost:5432/ecommerce" -ForegroundColor White
Write-Host ""

# Create the ecommerce database
Write-Host "🗄️  Creating ecommerce database..." -ForegroundColor Yellow
try {
    & "C:\Program Files\PostgreSQL\14\bin\createdb.exe" -U postgres -h localhost ecommerce
    Write-Host "✅ Database 'ecommerce' created successfully!" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Database might already exist or there was an error" -ForegroundColor Yellow
    Write-Host "You can create it manually using pgAdmin or psql" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Setup complete! You can now run your application." -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Update your .env file with the connection string above" -ForegroundColor White
Write-Host "  2. Run: npm run db:migrate" -ForegroundColor White
Write-Host "  3. Run: npm run dev" -ForegroundColor White

Read-Host "Press Enter to exit"