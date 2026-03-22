import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-server";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search") ?? "";
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const limit = Math.min(1000, Math.max(1, Number(searchParams.get("limit") ?? "20")));
    const skip = (page - 1) * limit;

    const where = {
      userId: session.user.id,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { phone: { contains: search } },
              { email: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [patients, total, pendingPayments] = await Promise.all([
      prisma.patient.findMany({
        where,
        orderBy: { name: "asc" },
        skip,
        take: limit,
        include: {
          _count: { select: { appointments: true, payments: true } },
        },
      }),
      prisma.patient.count({ where }),
      prisma.payment.groupBy({
        by: ["patientId"],
        where: {
          userId: session.user.id,
          status: { in: ["PENDING", "PARTIAL"] },
        },
        _sum: { amount: true },
      }),
    ]);

    const debtMap = new Map(
      pendingPayments.map((p) => [p.patientId, Number(p._sum.amount ?? 0)])
    );

    const result = patients.map((p) => ({
      ...p,
      pendingDebt: debtMap.get(p.id) ?? 0,
    }));

    return NextResponse.json({
      data: result,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      },
    });
  } catch (error) {
    console.error("Patients API error:", error);
    return NextResponse.json({ error: "Error al obtener pacientes" }, { status: 500 });
  }
}
