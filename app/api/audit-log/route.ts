import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-server";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const limit = 30;

    const VALID_ENTITIES = ["PATIENT", "APPOINTMENT", "PAYMENT", "REMINDER", "SETTINGS", "USER"] as const;
    type ValidEntity = typeof VALID_ENTITIES[number];
    const rawEntity = searchParams.get("entity");
    const entity: ValidEntity | null = rawEntity && (VALID_ENTITIES as readonly string[]).includes(rawEntity)
      ? (rawEntity as ValidEntity)
      : null;

    const logs = await prisma.auditLog.findMany({
      where: {
        userId: session.user.id,
        ...(entity ? { entity } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = logs.length > limit;
    const items = hasMore ? logs.slice(0, limit) : logs;

    return NextResponse.json({
      logs: items,
      nextCursor: hasMore ? items[items.length - 1].id : null,
      hasMore,
    });
  } catch (error) {
    console.error("Audit log API error:", error);
    return NextResponse.json({ error: "Error al obtener el log" }, { status: 500 });
  }
}
