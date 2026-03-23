"use client";

import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Clock, RefreshCw } from "lucide-react";
import { appointmentSchema, recurringAppointmentSchema, type AppointmentFormData } from "@/lib/validations";
import { createAppointment } from "@/lib/actions/appointments";
import { createRecurringAppointments } from "@/lib/actions/recurringAppointments";
import { FieldInput, FieldTextarea } from "@/components/ui/FieldComponents";
import { PatientSearchInput } from "@/components/ui/PatientSearchInput";
import { TreatmentSearchInput } from "@/components/ui/TreatmentSearchInput";
import { formatCurrency } from "@/lib/utils";
import { getBrowserTimezone } from "@/lib/timezone";
import type { AppointmentWithPatient } from "@/types";

interface Props {
  defaultDate?: string;
  defaultStartTime?: string;
  defaultEndTime?: string;
  onClose: () => void;
  onSaved: (apt: AppointmentWithPatient) => void;
}

export function AppointmentModal({ defaultDate, defaultStartTime, defaultEndTime, onClose, onSaved }: Props) {
  const userTimezone = getBrowserTimezone();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringResult, setRecurringResult] = useState<{ created: number; skipped: number } | null>(null);

  const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD en zona horaria local

  const { register, handleSubmit, control, setValue, formState: { errors } } =
    useForm<AppointmentFormData>({
      resolver: zodResolver(isRecurring ? (recurringAppointmentSchema as never) : appointmentSchema),
      defaultValues: {
        patientId: "",
        treatment: "",
        date: defaultDate ?? today,
        startTime: defaultStartTime ?? "09:00",
        endTime: defaultEndTime ?? "10:00",
        status: "SCHEDULED",
        treatmentPrice: undefined,
        timezone: userTimezone,
      },
    });

  const startTime = useWatch({ control, name: "startTime" });
  const endTime = useWatch({ control, name: "endTime" });

  const duration = useMemo(() => {
    if (!startTime || !endTime) return null;
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    const mins = eh * 60 + em - (sh * 60 + sm);
    if (mins <= 0) return null;
    return mins >= 60
      ? `${Math.floor(mins / 60)}h ${mins % 60 > 0 ? `${mins % 60}min` : ""}`.trim()
      : `${mins}min`;
  }, [startTime, endTime]);

  const handleTreatmentSelect = (name: string, treatment?: { price: number; durationMinutes: number }) => {
    setValue("treatment", name);
    if (treatment) {
      setValue("treatmentPrice", treatment.price);
      setSelectedPrice(treatment.price);
      if (startTime) {
        const [h, m] = startTime.split(":").map(Number);
        const totalMins = h * 60 + m + treatment.durationMinutes;
        const endH = Math.floor(totalMins / 60) % 24;
        const endM = totalMins % 60;
        setValue("endTime", `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`);
      }
    } else {
      setValue("treatmentPrice", undefined);
      setSelectedPrice(null);
    }
  };

  const [recurringFrequency, setRecurringFrequency] = useState<"WEEKLY" | "BIWEEKLY" | "MONTHLY">("WEEKLY");
  const [recurringOccurrences, setRecurringOccurrences] = useState(4);

  const onSubmit = async (data: AppointmentFormData) => {
    setIsLoading(true);
    setError(null);
    setRecurringResult(null);

    if (isRecurring) {
      const result = await createRecurringAppointments({
        ...data,
        isRecurring: true,
        frequency: recurringFrequency,
        occurrences: recurringOccurrences,
      });
      setIsLoading(false);
      if (result.error) { setError(result.error); return; }
      setRecurringResult(result.data!);
      setTimeout(onClose, 2000);
    } else {
      const result = await createAppointment(data);
      setIsLoading(false);
      if (result.error) { setError(result.error); return; }
      onSaved(result.data as AppointmentWithPatient);
    }
  };

  const modal = (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-[9999]" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-base font-semibold text-gray-900">Nueva cita</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
          <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
            <Controller name="patientId" control={control}
              render={({ field }) => (
                <PatientSearchInput value={field.value} onChange={field.onChange} error={errors.patientId?.message} />
              )}
            />

            <Controller name="treatment" control={control}
              render={({ field }) => (
                <TreatmentSearchInput value={field.value} onChange={handleTreatmentSelect} error={errors.treatment?.message} />
              )}
            />

            <Controller name="treatmentPrice" control={control}
              render={({ field }) => (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-600">
                    Precio (S/)
                    {selectedPrice !== null && (
                      <span className="ml-2 text-primary-500 font-normal">
                        — catálogo: {formatCurrency(selectedPrice)}
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                    placeholder="0.00"
                    min={0}
                    step={0.5}
                    className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                  />
                </div>
              )}
            />

            <FieldInput
              {...register("date", {
                validate: (val) => {
                  if (!val) return true;
                  const selected = new Date(val + "T00:00:00");
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return selected >= today || "La fecha no puede ser en el pasado";
                },
              })}
              type="date"
              label="Fecha"
              min={today}
              error={errors.date?.message}
            />

            <div className="grid grid-cols-2 gap-3">
              <FieldInput {...register("startTime")} type="time" label="Hora inicio" error={errors.startTime?.message} />
              <FieldInput {...register("endTime")} type="time" label="Hora fin" error={errors.endTime?.message} />
            </div>

            {duration && (
              <div className="flex items-center gap-2 text-xs text-primary-600 bg-primary-50 rounded-lg px-3 py-2 border border-primary-100">
                <Clock className="w-3.5 h-3.5" />
                Duración: <strong>{duration}</strong>
              </div>
            )}

            {/* Estado oculto — siempre SCHEDULED, no mostrar al crear */}
            <input type="hidden" {...register("status")} value="SCHEDULED" />

            <FieldTextarea {...register("notes")} label="Notas (opcional)" placeholder="Observaciones para esta cita..." />

            {/* Toggle recurrencia */}
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <button type="button" onClick={() => setIsRecurring(!isRecurring)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-gray-400" />
                  Cita recurrente
                </span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full transition-colors ${isRecurring ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-500"}`}>
                  {isRecurring ? "Activado" : "Desactivado"}
                </span>
              </button>

              {isRecurring && (
                <div className="px-4 pb-4 pt-2 space-y-3 border-t border-gray-100">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-600">Frecuencia</label>
                    <select
                      value={recurringFrequency}
                      onChange={(e) => setRecurringFrequency(e.target.value as "WEEKLY" | "BIWEEKLY" | "MONTHLY")}
                      className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                    >
                      <option value="WEEKLY">Cada semana</option>
                      <option value="BIWEEKLY">Cada dos semanas</option>
                      <option value="MONTHLY">Cada mes</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-600">Número de repeticiones</label>
                    <input
                      type="number"
                      min={2} max={52}
                      value={recurringOccurrences}
                      onChange={(e) => setRecurringOccurrences(Number(e.target.value))}
                      className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                    />
                  </div>
                  <p className="text-xs text-gray-400">Se crearán {recurringOccurrences} citas en total.</p>
                </div>
              )}
            </div>

            {recurringResult && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-700">
                Se crearon {recurringResult.created} citas recurrentes.
                {recurringResult.skipped > 0 && ` (${recurringResult.skipped} omitidas por conflicto)`}
              </div>
            )}

            {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>}
          </div>

          <div className="flex gap-2 px-6 py-4 border-t border-gray-100 shrink-0 justify-end">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={isLoading}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary-500 hover:bg-primary-600 text-white transition-colors disabled:opacity-50">
              {isLoading ? "Guardando..." : "Guardar cita"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}