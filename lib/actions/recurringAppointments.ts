"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-server";
import { recurringAppointmentSchema } from "@/lib/validations";
import { createAuditLog } from "@/lib/audit";
import { addWeeks, addMonths } from "date-fns";

function generateDates(
  start: Date,
  frequency: "WEEKLY" | "BIWEEKLY" | "MONTHLY",
  occurrences?: number,
  endDate?: Date
): Date[] {
  const dates: Date[] = [start];
  const max = occurrences ?? 52;

  for (let i = 1; i < max; i++) {
    let next: Date;
    if (frequency === "WEEKLY") next = addWeeks(start, i);
    else if (frequency === "BIWEEKLY") next = addWeeks(start, i * 2);
    else next = addMonths(start, i);

    if (endDate && next > endDate) break;
    dates.push(next);
  }

  return dates;
}

export async function createRecurringAppointments(raw: unknown) {
  const session = await requireAuth();

  const parsed = recurringAppointmentSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const data = parsed.data;

  const firstDate = new Date(`${data.date}T${data.startTime}`);
  const endTime = new Date(`${data.date}T${data.endTime}`);
  const duration = Math.round((endTime.getTime() - firstDate.getTime()) / 60000);

  if (duration <= 0) return { error: "La duración debe ser mayor a 0 minutos" };
  if (!data.frequency) return { error: "Seleccione la frecuencia" };

  const dates = generateDates(
    firstDate,
    data.frequency,
    data.occurrences,
    data.endDate ? new Date(data.endDate) : undefined
  );

  try {
    // Crear la regla de recurrencia
    const rule = await prisma.recurringRule.create({
      data: {
        userId: session.user.id,
        frequency: data.frequency,
        interval: 1,
        endDate: data.endDate ? new Date(data.endDate) : null,
        occurrences: data.occurrences ?? null,
      },
    });

    // Verificar conflictos para todos los slots generados
    const conflicts: string[] = [];
    for (const date of dates) {
      const slotEnd = new Date(date.getTime() + duration * 60000);
      const conflict = await prisma.appointment.findFirst({
        where: {
          userId: session.user.id,
          status: { in: ["SCHEDULED", "CONFIRMED"] },
          date: { gte: new Date(date.getTime() - 23 * 3600 * 1000), lt: slotEnd },
        },
        select: { date: true, duration: true },
      });
      if (conflict) {
        const conflictEnd = new Date(new Date(conflict.date).getTime() + conflict.duration * 60000);
        if (date < conflictEnd && slotEnd > new Date(conflict.date)) {
          conflicts.push(date.toISOString());
        }
      }
    }

    // Crear todas las citas en lote, saltando conflictos
    const validDates = dates.filter((d) => !conflicts.includes(d.toISOString()));

    await prisma.appointment.createMany({
      data: validDates.map((date) => ({
        userId: session.user.id,
        patientId: data.patientId,
        date,
        duration,
        treatment: data.treatment,
        treatmentPrice: data.treatmentPrice ?? null,
        status: "SCHEDULED" as const,
        notes: data.notes || null,
        recurringRuleId: rule.id,
      })),
    });

    // Crear pagos pendientes para cada cita
    const created = await prisma.appointment.findMany({
      where: { recurringRuleId: rule.id },
      select: { id: true, patientId: true },
    });

    await prisma.payment.createMany({
      data: created.map((apt) => ({
        userId: session.user.id,
        patientId: apt.patientId,
        appointmentId: apt.id,
        treatment: data.treatment,
        amount: data.treatmentPrice ?? 0,
        status: "PENDING" as const,
        method: "CASH" as const,
      })),
    });

    await createAuditLog({
      userId: session.user.id,
      action: "CREATE",
      entity: "APPOINTMENT",
      entityId: rule.id,
      metadata: { recurring: true, frequency: data.frequency, created: validDates.length, skipped: conflicts.length },
    });

    return {
      data: { created: validDates.length, skipped: conflicts.length, ruleId: rule.id },
    };
  } catch (error) {
    console.error("createRecurringAppointments error:", error);
    return { error: "Error al crear las citas recurrentes" };
  }
}

export async function cancelRecurringSeries(recurringRuleId: string) {
  const session = await requireAuth();

  try {
    const rule = await prisma.recurringRule.findFirst({
      where: { id: recurringRuleId, userId: session.user.id },
    });
    if (!rule) return { error: "Serie no encontrada" };

    await prisma.appointment.updateMany({
      where: {
        recurringRuleId,
        userId: session.user.id,
        status: { in: ["SCHEDULED", "CONFIRMED"] },
      },
      data: { status: "CANCELLED" },
    });

    await createAuditLog({
      userId: session.user.id,
      action: "UPDATE",
      entity: "APPOINTMENT",
      entityId: recurringRuleId,
      metadata: { action: "cancel_series" },
    });

    return { data: { success: true } };
  } catch (error) {
    console.error("cancelRecurringSeries error:", error);
    return { error: "Error al cancelar la serie" };
  }
}
