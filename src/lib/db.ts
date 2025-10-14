import { PrismaClient, Prisma } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const logs: ("query" | "error" | "warn")[] =
  process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: logs,
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export { Prisma }
