import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-server";
import { settingsSchema } from "@/lib/validations";

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const parsed = settingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: parsed.data.name,
        clinicName: parsed.data.clinicName || null,
        clinicPhone: parsed.data.clinicPhone || null,
        clinicAddress: parsed.data.clinicAddress || null,
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Settings API error:", error);
    return NextResponse.json({ error: "Error al actualizar configuración" }, { status: 500 });
  }
}
