"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-server";
import { paymentSchema, paymentUpdateSchema } from "@/lib/validations";
import { createAuditLog } from "@/lib/audit";

export async function createPayment(raw: unknown) {
  const session = await requireAuth();

  const parsed = paymentSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const data = parsed.data;

  try {
    const payment = await prisma.payment.create({
      data: {
        userId: session.user.id,
        patientId: data.patientId,
        appointmentId: data.appointmentId || null,
        treatment: data.treatment,
        amount: data.amount,
        status: data.status,
        method: data.method,
        notes: data.notes || null,
        paidAt: data.paidAt
          ? new Date(data.paidAt)
          : data.status === "PAID"
            ? new Date()
            : null,
      },
      include: { patient: true },
    });

    await createAuditLog({ userId: session.user.id, action: "CREATE", entity: "PAYMENT", entityId: payment.id, metadata: { amount: Number(payment.amount), status: payment.status, patient: payment.patient.name } });
    return { data: { ...payment, amount: Number(payment.amount) } };
  } catch (error) {
    console.error("createPayment error:", error);
    return { error: "Error al crear el pago" };
  }
}

export async function updatePayment(id: string, raw: unknown) {
  const session = await requireAuth();

  if (!id || typeof id !== "string") return { error: "ID inválido" };

  const parsed = paymentUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const data = parsed.data;

  try {
    const existing = await prisma.payment.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing) return { error: "Pago no encontrado" };

    const payment = await prisma.payment.update({
      where: { id },
      data: {
        ...(data.patientId && { patientId: data.patientId }),
        ...(data.appointmentId !== undefined && {
          appointmentId: data.appointmentId || null,
        }),
        ...(data.treatment && { treatment: data.treatment }),
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.status && { status: data.status }),
        ...(data.method && { method: data.method }),
        ...(data.notes !== undefined && { notes: data.notes || null }),
        paidAt: data.paidAt
          ? new Date(data.paidAt)
          : data.status === "PAID" && !existing.paidAt
            ? new Date()
            : undefined,
      },
      include: { patient: true },
    });

    await createAuditLog({ userId: session.user.id, action: "UPDATE", entity: "PAYMENT", entityId: id, metadata: { before: { status: existing.status, amount: Number(existing.amount) }, after: { status: payment.status, amount: Number(payment.amount) } } });
    return { data: { ...payment, amount: Number(payment.amount) } };
  } catch (error) {
    console.error("updatePayment error:", error);
    return { error: "Error al actualizar el pago" };
  }
}

export async function deletePayment(id: string) {
  const session = await requireAuth();

  if (!id || typeof id !== "string") return { error: "ID inválido" };

  try {
    const existing = await prisma.payment.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing) return { error: "Pago no encontrado" };

    await prisma.payment.delete({ where: { id } });
    await createAuditLog({ userId: session.user.id, action: "DELETE", entity: "PAYMENT", entityId: id, metadata: { amount: Number(existing.amount), status: existing.status } });
    return { data: { success: true } };
  } catch (error) {
    console.error("deletePayment error:", error);
    return { error: "Error al eliminar el pago" };
  }
}
