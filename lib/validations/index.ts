import { z } from "zod";

// Auth
export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

// Patient
export const patientSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  phone: z.string().min(7, "Teléfono inválido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  birthDate: z.string().optional().or(z.literal("")),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  notes: z.string().optional(),
});

export const patientUpdateSchema = patientSchema.partial();

// Appointment
export const appointmentSchema = z
  .object({
    patientId: z.string().min(1, "Seleccione un paciente"),
    date: z.string().min(1, "Seleccione una fecha"),
    startTime: z.string().min(1, "Seleccione hora de inicio"),
    endTime: z.string().min(1, "Seleccione hora de fin"),
    treatment: z.string().min(2, "Ingrese el tratamiento"),
    treatmentPrice: z.number().min(0).optional(),
    status: z.enum(["SCHEDULED", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"]),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.startTime || !data.endTime) return true;
      return data.startTime < data.endTime;
    },
    {
      message: "La hora de fin debe ser mayor a la hora de inicio",
      path: ["endTime"],
    }
  )
  .refine(
    (data) => {
      if (!data.date) return true;
      const selected = new Date(data.date + "T00:00:00");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selected >= today;
    },
    {
      message: "La fecha no puede ser en el pasado",
      path: ["date"],
    }
  );

// Recurring appointment
export const recurringAppointmentSchema = z.object({
  patientId: z.string().min(1, "Seleccione un paciente"),
  date: z.string().min(1, "Seleccione una fecha"),
  startTime: z.string().min(1, "Seleccione hora de inicio"),
  endTime: z.string().min(1, "Seleccione hora de fin"),
  treatment: z.string().min(2, "Ingrese el tratamiento"),
  treatmentPrice: z.number().min(0).optional(),
  notes: z.string().optional(),
  isRecurring: z.boolean().default(false),
  frequency: z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY"]).optional(),
  occurrences: z.number().int().min(2).max(52).optional(),
  endDate: z.string().optional(),
}).refine(
  (data) => !data.isRecurring || !!data.frequency,
  { message: "Seleccione la frecuencia de repetición", path: ["frequency"] }
).refine(
  (data) => !data.isRecurring || (!!data.occurrences || !!data.endDate),
  { message: "Indique cuántas veces o hasta qué fecha", path: ["occurrences"] }
);

export const appointmentUpdateSchema = z.object({
  patientId: z.string().optional(),
  date: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  treatment: z.string().optional(),
  status: z.enum(["SCHEDULED", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"]).optional(),
  notes: z.string().optional(),
});

// Payment
export const paymentSchema = z.object({
  patientId: z.string().min(1, "Seleccione un paciente"),
  appointmentId: z.string().optional(),
  treatment: z.string().min(2, "Ingrese el tratamiento"),
  amount: z.number().positive("El monto debe ser mayor a 0"),
  status: z.enum(["PENDING", "PAID", "PARTIAL", "CANCELLED"]),
  method: z.enum(["CASH", "CARD", "TRANSFER", "OTHER"]),
  notes: z.string().optional(),
  paidAt: z.string().optional(),
});

export const paymentUpdateSchema = paymentSchema.partial();

// Settings
export const settingsSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  clinicName: z.string().optional(),
  clinicPhone: z.string().optional(),
  clinicAddress: z.string().optional(),
});

// Types
export type LoginFormData = z.infer<typeof loginSchema>;
export type PatientFormData = z.infer<typeof patientSchema>;
export type AppointmentFormData = z.infer<typeof appointmentSchema>;
export type AppointmentUpdateFormData = z.infer<typeof appointmentUpdateSchema>;
export type PaymentFormData = z.infer<typeof paymentSchema>;
export type SettingsFormData = z.infer<typeof settingsSchema>;
