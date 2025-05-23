import { PrismaClient } from "@prisma/client";

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.


const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prismadb = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prismadb