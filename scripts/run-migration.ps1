# Run the database migration for enhanced reviews and ratings
Write-Host "Running database migration for enhanced reviews and ratings..." -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "prisma/schema.prisma")) {
    Write-Host "Error: Please run this script from the project root directory" -ForegroundColor Red
    exit 1
}

# Run the migration
Write-Host "Executing migration..." -ForegroundColor Yellow
npx prisma migrate dev --name enhance_reviews_and_ratings

Write-Host "Migration completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Start your development server: npm run dev" -ForegroundColor White
Write-Host "2. Visit a product page to see the new features" -ForegroundColor White
Write-Host "3. Test the review functionality" -ForegroundColor White
Write-Host "4. Check the recommended products section" -ForegroundColor White
