import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  format,
  formatDistanceToNow,
  isToday,
  isTomorrow,
  isYesterday,
} from "date-fns";
import { es } from "date-fns/locale";
import type { AppointmentStatus, PaymentStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return format(new Date(date), "dd/MM/yyyy", { locale: es });
}

export function formatTime(date: Date | string): string {
  return format(new Date(date), "HH:mm", { locale: es });
}

export function formatDateTime(date: Date | string): string {
  return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: es });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(amount);
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function getRelativeDay(date: Date | string): string {
  const d = new Date(date);
  if (isToday(d)) return "Hoy";
  if (isTomorrow(d)) return "Mañana";
  if (isYesterday(d)) return "Ayer";
  return format(d, "EEEE dd/MM", { locale: es });
}

export function getRelativeTime(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es });
}

// Appointment status
export const appointmentStatusColors: Record<AppointmentStatus, string> = {
  SCHEDULED: "default",
  CONFIRMED: "primary",
  COMPLETED: "success",
  CANCELLED: "danger",
  NO_SHOW: "warning",
};

export const appointmentStatusLabels: Record<AppointmentStatus, string> = {
  SCHEDULED: "Programada",
  CONFIRMED: "Confirmada",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
  NO_SHOW: "No asistió",
};

export const appointmentCalendarColors: Record<AppointmentStatus, { bg: string; border: string; text: string }> = {
  SCHEDULED: { bg: "#3b82f6", border: "#2563eb", text: "#ffffff" },
  CONFIRMED: { bg: "#14b897", border: "#0d937b", text: "#ffffff" },
  COMPLETED: { bg: "#22c55e", border: "#16a34a", text: "#ffffff" },
  CANCELLED: { bg: "#ef4444", border: "#dc2626", text: "#ffffff" },
  NO_SHOW: { bg: "#f59e0b", border: "#d97706", text: "#ffffff" },
};

// Payment status
export const paymentStatusColors: Record<PaymentStatus, string> = {
  PENDING: "warning",
  PAID: "success",
  PARTIAL: "secondary",
  CANCELLED: "danger",
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  PENDING: "Pendiente",
  PAID: "Cobrado",
  PARTIAL: "Parcial",
  CANCELLED: "Cancelado",
};

export const paymentMethodLabels: Record<string, string> = {
  CASH: "Efectivo",
  CARD: "Tarjeta",
  TRANSFER: "Transferencia",
  OTHER: "Otro",
};

// Build reminder message
export function buildReminderMessage(
  patientName: string,
  clinicName: string,
  date: Date | string,
  treatment: string
): string {
  const d = new Date(date);
  const dateStr = format(d, "EEEE dd 'de' MMMM", { locale: es });
  const timeStr = format(d, "HH:mm", { locale: es });
  return `Hola ${patientName}, le recordamos su cita en ${clinicName} el ${dateStr} a las ${timeStr} para ${treatment}. Por favor confirme su asistencia respondiendo este mensaje.`;
}
