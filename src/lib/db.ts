import { PrismaClient, Prisma } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Production-ready logging configuration
const logs: ("query" | "error" | "warn" | "info")[] =
  process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn', 'info'] 
    : ['error', 'warn']

// Enhanced Prisma configuration for production
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: logs,
    errorFormat: process.env.NODE_ENV === 'production' ? 'minimal' : 'pretty',
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

// Production optimization: prevent multiple instances
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Graceful shutdown handling
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})

// Production-ready connection health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('Database connection failed:', error)
    return false
  }
}

export { Prisma }
