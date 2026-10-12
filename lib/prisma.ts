import { PrismaClient } from "./generated/prisma/client.ts";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const globalForPrisma = globalThis as unknown as {
  prisma: InstanceType<typeof PrismaClient> | undefined;
};

function createPrismaClient() {
  const connectionString =
    process.env.DATABASE_URL || "mysql://root:root@127.0.0.1:3306/gimnasio";
  const adapter = new PrismaMariaDb(connectionString);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export type { Prisma } from "./generated/prisma/client.ts";
export default prisma;
