"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-server";
import { patientSchema, patientUpdateSchema } from "@/lib/validations";
import { createAuditLog } from "@/lib/audit";
import type { MedicalEntry } from "@/types";
import { z } from "zod";

const medicalEntrySchema = z.object({
  id: z.string(),
  date: z.string(),
  description: z.string().min(1),
});

export async function createPatient(raw: unknown) {
  const session = await requireAuth();

  const parsed = patientSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const data = parsed.data;

  try {
    const patient = await prisma.patient.create({
      data: {
        userId: session.user.id,
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        gender: data.gender || null,
        notes: data.notes || null,
        medicalHistory: "[]",
      },
    });
    await createAuditLog({ userId: session.user.id, action: "CREATE", entity: "PATIENT", entityId: patient.id, metadata: { name: patient.name, phone: patient.phone } });
    return { data: patient };
  } catch (error) {
    console.error("createPatient error:", error);
    return { error: "Error al crear el paciente" };
  }
}

export async function updatePatient(id: string, raw: unknown) {
  const session = await requireAuth();

  if (!id || typeof id !== "string") return { error: "ID inválido" };

  const parsed = patientUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const data = parsed.data;

  try {
    const existing = await prisma.patient.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing) return { error: "Paciente no encontrado" };

    const patient = await prisma.patient.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.phone && { phone: data.phone }),
        email: data.email || null,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        ...(data.gender && { gender: data.gender }),
        notes: data.notes || null,
      },
    });
    await createAuditLog({ userId: session.user.id, action: "UPDATE", entity: "PATIENT", entityId: id, metadata: { before: { name: existing.name }, after: { name: patient.name } } });
    return { data: patient };
  } catch (error) {
    console.error("updatePatient error:", error);
    return { error: "Error al actualizar el paciente" };
  }
}

export async function updateMedicalHistory(id: string, entries: MedicalEntry[]) {
  const session = await requireAuth();

  if (!id || typeof id !== "string") return { error: "ID inválido" };

  // Validate entries structure
  const parsed = z.array(medicalEntrySchema).safeParse(entries);
  if (!parsed.success) {
    return { error: "Historial médico con formato inválido" };
  }

  try {
    const existing = await prisma.patient.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing) return { error: "Paciente no encontrado" };

    const patient = await prisma.patient.update({
      where: { id },
      data: { medicalHistory: JSON.stringify(parsed.data) },
    });
    return { data: patient };
  } catch (error) {
    console.error("updateMedicalHistory error:", error);
    return { error: "Error al actualizar el historial médico" };
  }
}

export async function deletePatient(id: string) {
  const session = await requireAuth();

  if (!id || typeof id !== "string") return { error: "ID inválido" };

  try {
    const existing = await prisma.patient.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing) return { error: "Paciente no encontrado" };

    // Cascades handled by Prisma schema:
    // Patient → Appointment (Cascade) → Payment (SetNull) → ReminderLog (Cascade)
    await prisma.patient.delete({ where: { id } });
    await createAuditLog({ userId: session.user.id, action: "DELETE", entity: "PATIENT", entityId: id, metadata: { name: existing.name } });
    return { data: { success: true } };
  } catch (error) {
    console.error("deletePatient error:", error);
    return { error: "Error al eliminar el paciente" };
  }
}
