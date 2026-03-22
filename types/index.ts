import type {
  User, Patient, Appointment, Payment, ReminderLog,
  Role, Plan, AppointmentStatus, PaymentStatus,
  PaymentMethod, ReminderChannel, ReminderStatus, Gender,
} from "@prisma/client";

export type {
  User, Patient, Appointment, Payment, ReminderLog,
  Role, Plan, AppointmentStatus, PaymentStatus,
  PaymentMethod, ReminderChannel, ReminderStatus, Gender,
};

// Disponible como tipo local hasta que se corra prisma generate
export type RecurrenceFrequency = "WEEKLY" | "BIWEEKLY" | "MONTHLY";

// Typed user with Better Auth additional fields
export interface AppUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  role: "DENTIST" | "ADMIN";
  clinicName: string | null;
  clinicPhone: string | null;
  clinicAddress: string | null;
  plan: "BASIC" | "PROFESSIONAL" | "CLINIC";
  planActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Serialized types (Decimal → number)
export type SerializedPayment = Omit<Payment, "amount"> & { amount: number };

// treatmentPrice is Decimal in DB — serialized to number | null over the wire
export type AppointmentWithPatient = Omit<Appointment, "treatmentPrice"> & {
  patient: Patient;
  treatmentPrice: number | null;
  recurringRuleId?: string | null;
};

export type PaymentWithRelations = SerializedPayment & {
  patient: Patient;
  appointment?: Appointment | null;
};

export type ReminderLogWithRelations = ReminderLog & {
  appointment: AppointmentWithPatient;
};

// Medical history
export interface MedicalEntry {
  id: string;
  date: string;
  description: string;
}

// Dashboard stats
export interface DashboardStats {
  todayAppointments: number;
  weekAppointments: number;
  totalPatients: number;
  monthRevenue: number;
  pendingPayments: number;
  completionRate: number;
  noShowRate: number;                        // % no-shows este mes
  revenueChange: number | null;
  patientsChange: number | null;
  inactivePatients: number;                  // sin visita en 90 días
  totalPendingFromCompleted: number;         // cobros pendientes de citas completadas
  pendingPaymentAppointmentIds: string[];    // appointmentIds con cobro pendiente
  todayAppointmentsList: AppointmentWithPatient[];
  upcomingAppointments: AppointmentWithPatient[];
  monthlyRevenue: { month: string; revenue: number }[];
  weeklyAppointments: { day: string; count: number }[];
}

// Calendar event
export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  extendedProps: {
    patientName: string;
    treatment: string;
    status: AppointmentStatus;
    duration: number;
    notes?: string | null;
  };
}