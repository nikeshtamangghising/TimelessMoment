#!/bin/bash

# Run the database migration for enhanced reviews and ratings
echo "Running database migration for enhanced reviews and ratings..."

# Check if we're in the right directory
if [ ! -f "prisma/schema.prisma" ]; then
    echo "Error: Please run this script from the project root directory"
    exit 1
fi

# Run the migration
echo "Executing migration..."
npx prisma migrate dev --name enhance_reviews_and_ratings

echo "Migration completed successfully!"
echo ""
echo "Next steps:"
echo "1. Start your development server: npm run dev"
echo "2. Visit a product page to see the new features"
echo "3. Test the review functionality"
echo "4. Check the recommended products section"
