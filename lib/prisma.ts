import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof makePrisma> | undefined;
};

function makePrisma() {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  // Client Extension (API correcta para Prisma 6.x)
  // $use fue eliminado en v6.14.0 — usar $extends en su lugar
  return client.$extends({
    query: {
      $allModels: {
        async $allOperations({ operation, model, args, query }) {
          const MAX = 3;
          for (let i = 0; i < MAX; i++) {
            try {
              return await query(args);
            } catch (e: any) {
              const isConnectionError =
                e?.code === "P1017" ||
                e?.code === "P1001" ||
                e?.message?.includes("Server has closed the connection") ||
                e?.message?.includes("Connection reset");

              if (isConnectionError && i < MAX - 1) {
                console.warn(
                  `[Prisma] Conexión perdida (${model}.${operation}), reintentando ${i + 1}/${MAX - 1}...`
                );
                await new Promise((r) => setTimeout(r, 400 * (i + 1)));
                // Reconectar antes de reintentar
                await client.$connect();
                continue;
              }
              throw e;
            }
          }
        },
      },
    },
  });
}

export const prisma = globalForPrisma.prisma ?? makePrisma();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}