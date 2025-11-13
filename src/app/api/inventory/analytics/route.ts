import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const productsList = await db.select().from(products).where(eq(products.isActive, true));

    const totalProducts = productsList.length;

    const totalInventoryValue = productsList.reduce((acc, product) => {
      const value = parseFloat(product.price as string) * product.inventory;
      return acc + value;
    }, 0);

    const totalInventoryUnits = productsList.reduce((acc, product) => {
      return acc + product.inventory;
    }, 0);

    const outOfStockProducts = productsList.filter(
      (product) => product.inventory === 0
    );

    const lowStockProducts = productsList.filter(
      (product) => product.inventory > 0 && product.inventory <= product.lowStockThreshold
    );

    return NextResponse.json({
      totalProducts,
      totalInventoryValue,
      totalInventoryUnits,
      outOfStockProducts: outOfStockProducts.length,
      lowStockProducts: lowStockProducts.length,
    });
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}