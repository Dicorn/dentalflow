"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  X, Trash2, Clock, CheckCircle, XCircle, UserX,
  Calendar, ChevronDown, ChevronUp, RefreshCw,
} from "lucide-react";
import { updateAppointment, deleteAppointment } from "@/lib/actions/appointments";
import { cancelRecurringSeries } from "@/lib/actions/recurringAppointments";
import { appointmentSchema, type AppointmentFormData } from "@/lib/validations";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { FieldInput, FieldTextarea } from "@/components/ui/FieldComponents";
import { PatientSearchInput } from "@/components/ui/PatientSearchInput";
import { TreatmentSearchInput } from "@/components/ui/TreatmentSearchInput";
import { CompleteAppointmentModal } from "./CompleteAppointmentModal";
import { appointmentStatusLabels, formatCurrency } from "@/lib/utils";
import type { AppointmentWithPatient, AppointmentStatus } from "@/types";

interface Props {
  appointment: AppointmentWithPatient;
  onClose: () => void;
  onUpdated: (apt: AppointmentWithPatient) => void;
  onDeleted: (id: string) => void;
}

const statusActions: Record<AppointmentStatus, {
  label: string; icon: any; next?: AppointmentStatus; style: string; action?: "complete" | "reschedule";
}[]> = {
  SCHEDULED: [
    { label: "Marcar completada", icon: CheckCircle, action: "complete", style: "bg-emerald-500 hover:bg-emerald-600 text-white" },
    { label: "No asistió", icon: UserX, next: "NO_SHOW", style: "bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200" },
    { label: "Cancelar", icon: XCircle, next: "CANCELLED", style: "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200" },
  ],
  CONFIRMED: [
    { label: "Marcar completada", icon: CheckCircle, action: "complete", style: "bg-emerald-500 hover:bg-emerald-600 text-white" },
    { label: "No asistió", icon: UserX, next: "NO_SHOW", style: "bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200" },
    { label: "Cancelar", icon: XCircle, next: "CANCELLED", style: "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200" },
  ],
  COMPLETED: [],
  CANCELLED: [
    // Reprogramar → abre el form de editar con fecha en blanco para elegir nueva fecha
    { label: "Reprogramar", icon: Calendar, action: "reschedule", style: "bg-primary-50 hover:bg-primary-100 text-primary-600 border border-primary-200" },
  ],
  NO_SHOW: [
    { label: "Reprogramar", icon: Calendar, action: "reschedule", style: "bg-primary-50 hover:bg-primary-100 text-primary-600 border border-primary-200" },
  ],
};

const statusBadge: Record<AppointmentStatus, string> = {
  SCHEDULED: "bg-blue-100 text-blue-700",
  CONFIRMED: "bg-primary-100 text-primary-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-700",
  NO_SHOW: "bg-amber-100 text-amber-700",
};

export function AppointmentDetailModal({ appointment, onClose, onUpdated, onDeleted }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [isCancelingSeries, setIsCancelingSeries] = useState(false);
  const [editPrice, setEditPrice] = useState(
    appointment.treatmentPrice != null ? String(appointment.treatmentPrice) : ""
  );
  // Para reprogramar: limpiar fecha/hora para que el doctor elija nuevas
  const [isRescheduling, setIsRescheduling] = useState(false);

  const aptDate = new Date(appointment.date);
  const endDate = new Date(aptDate.getTime() + appointment.duration * 60000);

  const { register, handleSubmit, control, setValue, reset, formState: { errors } } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      patientId: appointment.patientId,
      date: format(aptDate, "yyyy-MM-dd"),
      startTime: format(aptDate, "HH:mm"),
      endTime: format(endDate, "HH:mm"),
      treatment: appointment.treatment,
      status: appointment.status,
      notes: appointment.notes ?? "",
    },
  });

  const startTime = useWatch({ control, name: "startTime" });
  const endTime = useWatch({ control, name: "endTime" });

  const getDuration = () => {
    if (!startTime || !endTime) return null;
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    const mins = eh * 60 + em - (sh * 60 + sm);
    if (mins <= 0) return null;
    return mins >= 60
      ? `${Math.floor(mins / 60)}h ${mins % 60 > 0 ? `${mins % 60}min` : ""}`.trim()
      : `${mins}min`;
  };

  const handleTreatmentSelect = (name: string, treatment?: { price: number; durationMinutes: number }) => {
    setValue("treatment", name);
    if (treatment) {
      setEditPrice(String(treatment.price));
      if (startTime) {
        const [h, m] = startTime.split(":").map(Number);
        const totalMins = h * 60 + m + treatment.durationMinutes;
        const endH = Math.floor(totalMins / 60) % 24;
        const endM = totalMins % 60;
        setValue("endTime", `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`);
      }
    }
  };

  const handleStatusAction = async (action: (typeof statusActions)[AppointmentStatus][0]) => {
    if (action.action === "complete") {
      setShowCompleteModal(true);
      return;
    }

    // Reprogramar → limpiar fecha/hora y abrir form de edición
    if (action.action === "reschedule") {
      const today = new Date().toISOString().split("T")[0];
      reset({
        patientId: appointment.patientId,
        date: today,          // fecha de hoy como punto de partida
        startTime: "",        // forzar al doctor a elegir hora
        endTime: "",
        treatment: appointment.treatment,
        status: "SCHEDULED",  // vuelve a SCHEDULED al reprogramar
        notes: appointment.notes ?? "",
      });
      setIsRescheduling(true);
      setShowEditForm(true);
      return;
    }

    if (!action.next) return;
    setActionLoadingId(action.label);
    const result = await updateAppointment(appointment.id, { status: action.next });
    setActionLoadingId(null);
    if (result.error) { setError(result.error); return; }
    onUpdated(result.data as AppointmentWithPatient);
  };

  const onSubmit = async (data: AppointmentFormData) => {
    setIsLoading(true);
    const result = await updateAppointment(appointment.id, {
      ...data,
      treatmentPrice: editPrice ? Number(editPrice) : undefined,
    } as any);
    setIsLoading(false);
    if (result.error) { setError(result.error); return; }
    setIsRescheduling(false);
    onUpdated(result.data as AppointmentWithPatient);
  };

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setIsDeleting(true);
    const result = await deleteAppointment(appointment.id);
    if (result.error) { setError(result.error); setIsDeleting(false); return; }
    onDeleted(appointment.id);
  };

  const actions = statusActions[appointment.status] ?? [];
  const savedPrice = appointment.treatmentPrice;

  const modal = (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-[9999]" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-gray-900">Cita</h2>
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusBadge[appointment.status]}`}>
              {appointmentStatusLabels[appointment.status]}
            </span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">

          {/* Resumen */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900">{appointment.patient.name}</p>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {format(aptDate, "HH:mm")} – {format(endDate, "HH:mm")}
              </span>
            </div>
            <p className="text-sm text-gray-600">{appointment.treatment}</p>
            <p className="text-xs text-gray-400 capitalize">
              {format(aptDate, "EEEE dd 'de' MMMM yyyy", { locale: es })}
            </p>
            {savedPrice != null && Number(savedPrice) > 0 && (
              <p className="text-xs font-semibold text-primary-600">{formatCurrency(Number(savedPrice))}</p>
            )}
            {appointment.notes && (
              <p className="text-xs text-gray-500 bg-white rounded-lg px-3 py-2 border border-gray-100 mt-1">
                📝 {appointment.notes}
              </p>
            )}
          </div>

          {/* Banner serie recurrente */}
          {appointment.recurringRuleId && (
            <div className="flex items-center justify-between gap-3 bg-primary-50 border border-primary-200 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-primary-600 shrink-0" />
                <p className="text-sm text-primary-700 font-medium">Cita de una serie recurrente</p>
              </div>
              <button
                onClick={async () => {
                  setIsCancelingSeries(true);
                  await cancelRecurringSeries(appointment.recurringRuleId!);
                  setIsCancelingSeries(false);
                  onDeleted(appointment.id);
                }}
                disabled={isCancelingSeries}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                {isCancelingSeries ? "..." : "Cancelar serie"}
              </button>
            </div>
          )}

          {/* Acciones */}
          {actions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Acciones</p>
              <div className="flex flex-col gap-2">
                {actions.map((action) => (
                  <button key={action.label}
                    onClick={() => handleStatusAction(action)}
                    disabled={actionLoadingId !== null}
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 ${action.style}`}>
                    <action.icon className="w-4 h-4" />
                    {actionLoadingId === action.label ? "Procesando..." : action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {appointment.status === "COMPLETED" && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <p className="text-sm text-emerald-700 font-medium">Cita completada</p>
            </div>
          )}

          {/* Editar / Reprogramar */}
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <button type="button" onClick={() => { setShowEditForm(!showEditForm); setIsRescheduling(false); }}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              <span>{isRescheduling ? "📅 Reprogramar cita — elige nueva fecha y hora" : "Editar detalles"}</span>
              {showEditForm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showEditForm && (
              <form onSubmit={handleSubmit(onSubmit)} className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">

                {isRescheduling && (
                  <div className="bg-primary-50 border border-primary-200 rounded-lg px-3 py-2 text-xs text-primary-700">
                    📅 Elige la nueva fecha y hora para esta cita. Se guardará como <strong>Programada</strong>.
                  </div>
                )}

                <Controller name="patientId" control={control}
                  render={({ field }) => (
                    <PatientSearchInput value={field.value} onChange={field.onChange}
                      error={errors.patientId?.message} initialName={appointment.patient.name} />
                  )}
                />

                <Controller name="treatment" control={control}
                  render={({ field }) => (
                    <TreatmentSearchInput value={field.value} onChange={handleTreatmentSelect}
                      error={errors.treatment?.message} />
                  )}
                />

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-600">Precio (S/) <span className="text-gray-400 font-normal">— editable</span></label>
                  <input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)}
                    placeholder="0.00" min={0} step={0.5}
                    className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100" />
                </div>

                <FieldInput {...register("date")} type="date" label="Fecha"
                  error={errors.date?.message} />

                <div className="grid grid-cols-2 gap-3">
                  <FieldInput {...register("startTime")} type="time" label="Hora inicio"
                    error={errors.startTime?.message} />
                  <FieldInput {...register("endTime")} type="time" label="Hora fin"
                    error={errors.endTime?.message} />
                </div>

                {getDuration() && (
                  <div className="flex items-center gap-2 text-xs text-primary-600 bg-primary-50 rounded-lg px-3 py-2 border border-primary-100">
                    <Clock className="w-3.5 h-3.5" />
                    Duración: <strong>{getDuration()}</strong>
                  </div>
                )}

                <FieldTextarea {...register("notes")} label="Notas" />

                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => { setShowEditForm(false); setIsRescheduling(false); }}
                    className="px-3 py-2 rounded-lg text-xs font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" disabled={isLoading}
                    className="px-3 py-2 rounded-lg text-xs font-semibold bg-primary-500 hover:bg-primary-600 text-white transition-colors disabled:opacity-50">
                    {isLoading ? "Guardando..." : isRescheduling ? "Confirmar reprogramación" : "Guardar cambios"}
                  </button>
                </div>
              </form>
            )}
          </div>

          {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>}
          {confirmDelete && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">⚠️ ¿Confirmar eliminación? También se eliminarán los pagos asociados.</div>}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 shrink-0">
          <button onClick={handleDelete} disabled={isDeleting}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50">
            <Trash2 className="w-3.5 h-3.5" />
            {isDeleting ? "..." : confirmDelete ? "Confirmar" : "Eliminar"}
          </button>
          <button onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
            Cerrar
          </button>
        </div>
      </div>

      {showCompleteModal && (
        <CompleteAppointmentModal
          appointment={appointment}
          onClose={() => setShowCompleteModal(false)}
          onCompleted={(apt) => { setShowCompleteModal(false); onUpdated(apt); }}
        />
      )}
    </div>
  );

  return createPortal(modal, document.body);
}