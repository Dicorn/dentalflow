import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-server";
import { isValid } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);

    const start = searchParams.get("start");
    const end = searchParams.get("end");

    // Si no viene rango, devolver el mes actual por defecto
    const now = new Date();

    const parsedStart = start ? new Date(start) : null;
    const parsedEnd = end ? new Date(end) : null;

    if (parsedStart && !isValid(parsedStart)) {
      return NextResponse.json({ error: "Fecha de inicio inválida" }, { status: 400 });
    }
    if (parsedEnd && !isValid(parsedEnd)) {
      return NextResponse.json({ error: "Fecha de fin inválida" }, { status: 400 });
    }

    const from = parsedStart ?? new Date(now.getFullYear(), now.getMonth(), 1);
    const to = parsedEnd ?? new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const appointments = await prisma.appointment.findMany({
      where: {
        userId: session.user.id,
        date: { gte: from, lte: to },
      },
      orderBy: { date: "asc" },
      include: {
        patient: {
          select: { id: true, name: true, phone: true, email: true },
        },
      },
    });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error("Appointments API error:", error);
    return NextResponse.json({ error: "Error al obtener citas" }, { status: 500 });
  }
}