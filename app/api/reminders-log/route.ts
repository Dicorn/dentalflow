import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-server";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const limit = 50;

    const [logs, pendingCount] = await Promise.all([
      prisma.reminderLog.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        include: {
          appointment: {
            select: {
              id: true,
              date: true,
              treatment: true,
              patient: {
                select: { id: true, name: true, phone: true },
              },
            },
          },
        },
      }),
      prisma.appointment.count({
        where: {
          userId: session.user.id,
          reminderSent: false,
          status: { in: ["SCHEDULED", "CONFIRMED"] },
          date: { gte: new Date() },
        },
      }),
    ]);

    const hasMore = logs.length > limit;
    const items = hasMore ? logs.slice(0, limit) : logs;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return NextResponse.json({ logs: items, pendingCount, nextCursor, hasMore });
  } catch (error) {
    console.error("Reminders log API error:", error);
    return NextResponse.json({ error: "Error al obtener recordatorios" }, { status: 500 });
  }
}
