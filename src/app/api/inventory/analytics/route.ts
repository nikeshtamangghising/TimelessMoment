import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
      },
    });

    const totalProducts = products.length;

    const totalInventoryValue = products.reduce((acc, product) => {
      const value = product.price * product.inventory;
      return acc + value;
    }, 0);

    const totalInventoryUnits = products.reduce((acc, product) => {
      return acc + product.inventory;
    }, 0);

    const outOfStockProducts = products.filter(
      (product) => product.inventory === 0
    );

    const lowStockProducts = products.filter(
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
    console.error('Error fetching inventory analytics:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
