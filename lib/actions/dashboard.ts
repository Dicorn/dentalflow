"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-server";
import {
  startOfDay, endOfDay, startOfWeek, endOfWeek,
  startOfMonth, endOfMonth, subMonths, format, addDays, subDays,
} from "date-fns";
import { es } from "date-fns/locale";

export async function getDashboardStats() {
  const session = await requireAuth();
  const userId = session.user.id;
  const now = new Date();

  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const sixMonthsAgo = startOfMonth(subMonths(now, 5));
  const ninetyDaysAgo = subDays(now, 90);

  const [
    todayCount,
    weekCount,
    totalPatients,
    lastMonthPatients,
    pendingPayments,
    completedThisMonth,
    totalThisMonth,
    noShowThisMonth,
    todayAppointmentsList,
    upcomingAppointments,
    last6MonthsPayments,
    weekAppointmentsRaw,
    currentMonthRevenue,
    lastMonthRevenue,
    // Pagos pendientes de citas COMPLETADAS (para indicador en dashboard)
    pendingPaymentsOfCompleted,
    // Pacientes activos en los últimos 90 días
    activePatientIds,
  ] = await Promise.all([
    prisma.appointment.count({
      where: { userId, date: { gte: startOfDay(now), lte: endOfDay(now) } },
    }),
    prisma.appointment.count({
      where: { userId, date: { gte: weekStart, lte: weekEnd }, status: { not: "CANCELLED" } },
    }),
    prisma.patient.count({ where: { userId } }),
    prisma.patient.count({ where: { userId, createdAt: { lte: lastMonthEnd } } }),
    prisma.payment.count({ where: { userId, status: "PENDING" } }),
    prisma.appointment.count({
      where: { userId, status: "COMPLETED", date: { gte: monthStart, lte: monthEnd } },
    }),
    prisma.appointment.count({
      where: { userId, date: { gte: monthStart, lte: monthEnd }, status: { not: "CANCELLED" } },
    }),
    // No-shows este mes
    prisma.appointment.count({
      where: { userId, status: "NO_SHOW", date: { gte: monthStart, lte: monthEnd } },
    }),
    prisma.appointment.findMany({
      where: { userId, date: { gte: startOfDay(now), lte: endOfDay(now) }, status: { not: "CANCELLED" } },
      orderBy: { date: "asc" },
      include: { patient: { select: { id: true, name: true, phone: true, email: true } } },
    }),
    prisma.appointment.findMany({
      where: { userId, date: { gte: startOfDay(addDays(now, 1)) }, status: { in: ["SCHEDULED", "CONFIRMED"] } },
      orderBy: { date: "asc" },
      take: 5,
      include: { patient: { select: { id: true, name: true, phone: true, email: true } } },
    }),
    prisma.payment.findMany({
      where: { userId, status: "PAID", paidAt: { gte: sixMonthsAgo, lte: monthEnd } },
      select: { amount: true, paidAt: true },
    }),
    prisma.appointment.findMany({
      where: { userId, date: { gte: weekStart, lte: weekEnd }, status: { not: "CANCELLED" } },
      select: { date: true },
    }),
    prisma.payment.aggregate({
      where: { userId, status: "PAID", paidAt: { gte: monthStart, lte: monthEnd } },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { userId, status: "PAID", paidAt: { gte: lastMonthStart, lte: lastMonthEnd } },
      _sum: { amount: true },
    }),
    // Pagos PENDING de citas COMPLETADAS (cobros pendientes)
    prisma.payment.findMany({
      where: {
        userId,
        status: "PENDING",
        appointment: { status: "COMPLETED" },
      },
      select: { appointmentId: true, amount: true },
    }),
    // IDs de pacientes con cita en últimos 90 días
    prisma.appointment.findMany({
      where: { userId, date: { gte: ninetyDaysAgo }, status: { not: "CANCELLED" } },
      select: { patientId: true },
      distinct: ["patientId"],
    }),
  ]);

  const monthRevenue = Number(currentMonthRevenue._sum.amount ?? 0);
  const prevMonthRevenue = Number(lastMonthRevenue._sum.amount ?? 0);
  const completionRate = totalThisMonth > 0 ? Math.round((completedThisMonth / totalThisMonth) * 100) : 0;
  const noShowRate = totalThisMonth > 0 ? Math.round((noShowThisMonth / totalThisMonth) * 100) : 0;

  const revenueChange = prevMonthRevenue > 0
    ? Math.round(((monthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100)
    : null;
  const patientsChange = totalPatients - lastMonthPatients;

  // IDs de citas con cobro pendiente
  const pendingPaymentAppointmentIds = pendingPaymentsOfCompleted
    .map((p) => p.appointmentId)
    .filter(Boolean) as string[];

  // Total pendiente de cobrar (citas completadas)
  const totalPendingFromCompleted = pendingPaymentsOfCompleted
    .reduce((sum, p) => sum + Number(p.amount), 0);

  // Pacientes inactivos (no han venido en 90 días)
  const activePatientIdSet = new Set(activePatientIds.map((a) => a.patientId));
  const inactivePatients = totalPatients - activePatientIdSet.size;

  // Agrupar pagos por mes en memoria
  const monthlyRevenue = Array.from({ length: 6 }, (_, i) => {
    const month = subMonths(now, 5 - i);
    const mStart = startOfMonth(month);
    const mEnd = endOfMonth(month);
    const revenue = last6MonthsPayments
      .filter((p) => p.paidAt && p.paidAt >= mStart && p.paidAt <= mEnd)
      .reduce((sum, p) => sum + Number(p.amount), 0);
    return { month: format(month, "MMM", { locale: es }), revenue };
  });

  // Agrupar citas por día en memoria
  const weeklyAppointments = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(weekStart, i);
    const dStart = startOfDay(day);
    const dEnd = endOfDay(day);
    const count = weekAppointmentsRaw.filter((a) => a.date >= dStart && a.date <= dEnd).length;
    return { day: format(day, "EEE", { locale: es }), count };
  });

  return {
    todayAppointments: todayCount,
    weekAppointments: weekCount,
    totalPatients,
    monthRevenue,
    pendingPayments,
    completionRate,
    noShowRate,
    revenueChange,
    patientsChange,
    inactivePatients,
    totalPendingFromCompleted,
    pendingPaymentAppointmentIds,
    todayAppointmentsList: todayAppointmentsList.map((a) => ({
      ...a,
      treatmentPrice: a.treatmentPrice ? Number(a.treatmentPrice) : null,
    })),
    upcomingAppointments: upcomingAppointments.map((a) => ({
      ...a,
      treatmentPrice: a.treatmentPrice ? Number(a.treatmentPrice) : null,
    })),
    monthlyRevenue,
    weeklyAppointments,
  };
}