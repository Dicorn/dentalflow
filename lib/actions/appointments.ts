"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-server";
import { appointmentSchema } from "@/lib/validations";
import { createAuditLog } from "@/lib/audit";
import { z } from "zod";

const createAppointmentSchema = appointmentSchema;

const updateAppointmentSchema = z.object({
  patientId: z.string().min(1).optional(),
  date: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  treatment: z.string().min(2).optional(),
  treatmentPrice: z.number().min(0).optional(),
  status: z
    .enum(["SCHEDULED", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"])
    .optional(),
  notes: z.string().optional(),
});

export async function createAppointment(raw: unknown) {
  const session = await requireAuth();

  const parsed = createAppointmentSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const data = parsed.data;

  const appointmentDate = new Date(`${data.date}T${data.startTime}:00Z`);
  const endDate = new Date(`${data.date}T${data.endTime}:00Z`);
  const duration = Math.round(
    (endDate.getTime() - appointmentDate.getTime()) / 60000
  );

  if (duration <= 0) return { error: "La duración debe ser mayor a 0 minutos" };

  // Verificar conflictos de horario
  const conflict = await prisma.appointment.findFirst({
    where: {
      userId: session.user.id,
      status: { in: ["SCHEDULED", "CONFIRMED"] },
      AND: [
        { date: { lt: endDate } },
        {
          date: {
            gte: new Date(appointmentDate.getTime() - 24 * 60 * 60 * 1000), // ventana de búsqueda
          },
        },
      ],
    },
    select: { id: true, date: true, duration: true, treatment: true, patient: { select: { name: true } } },
  });

  if (conflict) {
    const conflictEnd = new Date(new Date(conflict.date).getTime() + conflict.duration * 60000);
    const hasOverlap =
      appointmentDate < conflictEnd &&
      endDate > new Date(conflict.date);
    if (hasOverlap) {
      return {
        error: `Conflicto de horario: ya existe una cita con ${conflict.patient.name} (${conflict.treatment}) en ese horario`,
      };
    }
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.create({
        data: {
          userId: session.user.id,
          patientId: data.patientId,
          date: appointmentDate,
          duration,
          treatment: data.treatment,
          treatmentPrice: data.treatmentPrice ?? null,
          status: data.status,
          notes: data.notes || null,
        },
        include: { patient: true },
      });

      // Crear pago con el monto del catálogo si viene
      await tx.payment.create({
        data: {
          userId: session.user.id,
          patientId: data.patientId,
          appointmentId: appointment.id,
          treatment: data.treatment,
          amount: data.treatmentPrice ?? 0,
          status: "PENDING",
          method: "CASH",
        },
      });

      return appointment;
    });

    await createAuditLog({ userId: session.user.id, action: "CREATE", entity: "APPOINTMENT", entityId: result.id, metadata: { patient: result.patient.name, treatment: result.treatment, date: result.date } });
    return {
      data: {
        ...result,
        treatmentPrice: result.treatmentPrice ? Number(result.treatmentPrice) : null,
      },
    };
  } catch (error) {
    console.error("createAppointment error:", error);
    return { error: "Error al crear la cita" };
  }
}

export async function updateAppointment(id: string, raw: unknown) {
  const session = await requireAuth();

  const parsed = updateAppointmentSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const data = parsed.data;

  try {
    const existing = await prisma.appointment.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing) return { error: "Cita no encontrada" };

    const updateData: Record<string, unknown> = {};

    if (data.date && data.startTime && data.endTime) {
      const appointmentDate = new Date(`${data.date}T${data.startTime}:00Z`);
      const endDate = new Date(`${data.date}T${data.endTime}:00Z`);
      const duration = Math.round(
        (endDate.getTime() - appointmentDate.getTime()) / 60000
      );
      updateData.date = appointmentDate;
      updateData.duration = duration;
    }

    if (data.patientId) updateData.patientId = data.patientId;
    if (data.treatment) updateData.treatment = data.treatment;
    if (data.treatmentPrice !== undefined)
      updateData.treatmentPrice = data.treatmentPrice;
    if (data.status) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes || null;

    // Transacción: actualizar cita + sincronizar pagos asociados
    const appointment = await prisma.$transaction(async (tx) => {
      const apt = await tx.appointment.update({
        where: { id },
        data: updateData,
        include: { patient: true },
      });

      // Si cambió el paciente → actualizar patientId en pagos asociados
      if (data.patientId && data.patientId !== existing.patientId) {
        await tx.payment.updateMany({
          where: { appointmentId: id },
          data: { patientId: data.patientId },
        });
      }

      // Si cambió el tratamiento → actualizar treatment en pagos asociados
      if (data.treatment && data.treatment !== existing.treatment) {
        await tx.payment.updateMany({
          where: { appointmentId: id },
          data: { treatment: data.treatment },
        });
      }

      // Si cambió el precio → actualizar amount en pagos pendientes
      if (data.treatmentPrice !== undefined && data.treatmentPrice !== Number(existing.treatmentPrice ?? 0)) {
        await tx.payment.updateMany({
          where: { appointmentId: id, status: { in: ["PENDING", "PARTIAL"] } },
          data: { amount: data.treatmentPrice },
        });
      }

      // Cascada por estado
      if (data.status === "CANCELLED") {
        await tx.payment.updateMany({
          where: { appointmentId: id, status: { in: ["PENDING", "PARTIAL"] } },
          data: { status: "CANCELLED" },
        });
      }

      return apt;
    });

    await createAuditLog({ userId: session.user.id, action: "UPDATE", entity: "APPOINTMENT", entityId: id, metadata: { before: { status: existing.status, date: existing.date }, after: { status: appointment.status, date: appointment.date } } });
    return {
      data: {
        ...appointment,
        treatmentPrice: appointment.treatmentPrice
          ? Number(appointment.treatmentPrice)
          : null,
      },
    };
  } catch (error) {
    console.error("updateAppointment error:", error);
    return { error: "Error al actualizar la cita" };
  }
}

export async function deleteAppointment(id: string) {
  const session = await requireAuth();

  if (!id || typeof id !== "string") return { error: "ID inválido" };

  try {
    const existing = await prisma.appointment.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing) return { error: "Cita no encontrada" };

    await prisma.$transaction(async (tx) => {
      await tx.payment.deleteMany({ where: { appointmentId: id } });
      await tx.reminderLog.deleteMany({ where: { appointmentId: id } });
      await tx.appointment.delete({ where: { id } });
    });

    await createAuditLog({ userId: session.user.id, action: "DELETE", entity: "APPOINTMENT", entityId: id, metadata: { treatment: existing.treatment, date: existing.date } });
    return { data: { success: true } };
  } catch (error) {
    console.error("deleteAppointment error:", error);
    return { error: "Error al eliminar la cita" };
  }
}