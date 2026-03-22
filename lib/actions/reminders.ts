"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-server";
import { buildReminderMessage } from "@/lib/utils";
import { addHours, subHours } from "date-fns";

// Server action segura — no requiere CRON_SECRET en el cliente
export async function triggerRemindersAction() {
  const session = await requireAuth();
  return triggerReminders(session.user.id);
}

const REMINDER_WINDOW_HOURS = 24;

export async function triggerReminders(userId?: string) {
  const now = new Date();
  const windowStart = now;
  const windowEnd = addHours(now, REMINDER_WINDOW_HOURS + 1); // +1h buffer to cover edge cases

  const where = {
    ...(userId ? { userId } : {}),
    reminderSent: false,
    status: { in: ["SCHEDULED" as const, "CONFIRMED" as const] },
    date: {
      gte: windowStart,
      lte: windowEnd,
    },
  };

  const appointments = await prisma.appointment.findMany({
    where,
    include: {
      patient: true,
      user: true,
    },
  });

  if (appointments.length === 0) return { processed: 0, results: [] };

  // Build all log data in memory first — no N+1
  const logsData = appointments.map((apt) => ({
    userId: apt.userId,
    appointmentId: apt.id,
    channel: "WHATSAPP" as const,
    recipientPhone: apt.patient.phone,
    message: buildReminderMessage(
      apt.patient.name,
      apt.user.clinicName || apt.user.name,
      apt.date,
      apt.treatment
    ),
    status: "SIMULATED" as const,
    scheduledFor: subHours(apt.date, 24),
    sentAt: now,
  }));

  // Transacción atómica — el re-check dentro evita duplicados en llamadas concurrentes
  const results = await prisma.$transaction(async (tx) => {
    // Re-verificar que aún no se enviaron (previene race condition)
    const stillPending = await tx.appointment.findMany({
      where: {
        id: { in: appointments.map((a) => a.id) },
        reminderSent: false,
      },
      select: { id: true },
    });

    if (stillPending.length === 0) return [];

    const pendingIds = new Set(stillPending.map((a) => a.id));
    const filteredLogs = logsData.filter((l) => pendingIds.has(l.appointmentId));

    // createMany ignora duplicados por @@unique([appointmentId, channel])
    await tx.reminderLog.createMany({ data: filteredLogs, skipDuplicates: true });

    // Marcar como enviados solo los que siguen pendientes
    await tx.appointment.updateMany({
      where: { id: { in: [...pendingIds] } },
      data: { reminderSent: true, reminderSentAt: now },
    });

    return filteredLogs.map((log) => ({
      appointmentId: log.appointmentId,
      status: "SIMULATED",
    }));
  });

  return { processed: results.length, results };
}
