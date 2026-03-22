import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-server";
import { z } from "zod";

const patchSchema = z.object({
  medicalHistory: z.string().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const patient = await prisma.patient.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true, medicalHistory: true },
    });

    if (!patient) {
      return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ medicalHistory: patient.medicalHistory ?? "[]" });
  } catch (error) {
    console.error("Patient medical history error:", error);
    return NextResponse.json({ error: "Error al obtener historial" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const existing = await prisma.patient.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 });
    }

    const patient = await prisma.patient.update({
      where: { id },
      data: {
        ...(parsed.data.medicalHistory !== undefined && {
          medicalHistory: parsed.data.medicalHistory,
        }),
      },
    });

    return NextResponse.json({ medicalHistory: patient.medicalHistory ?? "[]" });
  } catch (error) {
    console.error("Patient PATCH error:", error);
    return NextResponse.json({ error: "Error al actualizar paciente" }, { status: 500 });
  }
}