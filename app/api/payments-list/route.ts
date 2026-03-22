import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-server";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);

    const appointmentId = searchParams.get("appointmentId");

    const payments = await prisma.payment.findMany({
      where: {
        userId: session.user.id,
        ...(appointmentId ? { appointmentId } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        appointment: {
          select: {
            id: true,
            date: true,
            treatment: true,
            status: true,
            duration: true,
          },
        },
      },
    });

    // Serialize Decimal → number
    const serialized = payments.map((p) => ({
      ...p,
      amount: Number(p.amount),
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error("Payments API error:", error);
    return NextResponse.json({ error: "Error al obtener pagos" }, { status: 500 });
  }
}
