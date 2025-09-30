-- Migration to add inventory tracking features

-- Add lowStockThreshold column to products table
ALTER TABLE "products" ADD COLUMN "lowStockThreshold" INTEGER NOT NULL DEFAULT 5;

-- Create inventory_adjustments table
CREATE TABLE "inventory_adjustments" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_adjustments_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraint
ALTER TABLE "inventory_adjustments" ADD CONSTRAINT "inventory_adjustments_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Create index for better query performance
CREATE INDEX "inventory_adjustments_productId_idx" ON "inventory_adjustments"("productId");
CREATE INDEX "inventory_adjustments_type_idx" ON "inventory_adjustments"("type");
CREATE INDEX "inventory_adjustments_createdAt_idx" ON "inventory_adjustments"("createdAt");

-- Optional: Add some sample inventory adjustments for existing products if needed
-- INSERT INTO "inventory_adjustments" ("id", "productId", "quantity", "type", "reason")
-- SELECT 
--     gen_random_uuid()::TEXT,
--     id,
--     0,
--     'INITIAL',
--     'Initial inventory setup'
-- FROM "products"
-- WHERE "inventory" > 0;