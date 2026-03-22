import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-server";
import { z } from "zod";

const treatmentSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  price: z.number().min(0, "El precio no puede ser negativo"),
  durationMinutes: z.number().min(5).max(480).default(60),
  color: z.string().optional(),
  active: z.boolean().optional().default(true),
});

export async function GET() {
  try {
    const session = await requireAuth();
    const treatments = await prisma.treatment.findMany({
      where: { userId: session.user.id, active: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        price: true,
        durationMinutes: true,
        color: true,
        active: true,
      },
    });

    // Serializar Decimal → number
    const serialized = treatments.map((t) => ({
      ...t,
      price: Number(t.price),
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error("Treatments GET error:", error);
    return NextResponse.json({ error: "Error al obtener tratamientos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const parsed = treatmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const treatment = await prisma.treatment.create({
      data: {
        userId: session.user.id,
        name: parsed.data.name,
        price: parsed.data.price,
        durationMinutes: parsed.data.durationMinutes,
        color: parsed.data.color || null,
        active: true,
      },
    });

    return NextResponse.json({ ...treatment, price: Number(treatment.price) });
  } catch (error) {
    console.error("Treatments POST error:", error);
    return NextResponse.json({ error: "Error al crear tratamiento" }, { status: 500 });
  }
}