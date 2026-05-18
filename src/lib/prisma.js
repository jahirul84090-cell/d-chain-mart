const { PrismaClient } = require("@prisma/client");

// Use Node.js global object to prevent multiple instances
const globalForPrisma = global;

// Reuse existing Prisma client if available
const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["error"], // keep logs minimal in production
  });

// Store prisma on global in development to avoid hot-reload issues
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

module.exports = { prisma };
