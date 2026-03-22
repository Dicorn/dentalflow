import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-server";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  price: z.number().min(0).optional(),
  durationMinutes: z.number().min(5).max(480).optional(),
  color: z.string().optional(),
  active: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const existing = await prisma.treatment.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Tratamiento no encontrado" }, { status: 404 });
    }

    const treatment = await prisma.treatment.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json({ ...treatment, price: Number(treatment.price) });
  } catch (error) {
    console.error("Treatment PATCH error:", error);
    return NextResponse.json({ error: "Error al actualizar tratamiento" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const existing = await prisma.treatment.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Tratamiento no encontrado" }, { status: 404 });
    }

    // Soft delete — marcar como inactivo para no perder el historial
    await prisma.treatment.update({
      where: { id },
      data: { active: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Treatment DELETE error:", error);
    return NextResponse.json({ error: "Error al eliminar tratamiento" }, { status: 500 });
  }
}