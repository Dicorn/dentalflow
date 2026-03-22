"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Trash2, Loader2 } from "lucide-react";
import { createPatient, updatePatient, deletePatient } from "@/lib/actions/patients";
import { patientSchema, type PatientFormData } from "@/lib/validations";
import { MedicalHistoryEditor } from "./MedicalHistoryEditor";
import { FieldInput, FieldTextarea, FieldSelect } from "@/components/ui/FieldComponents";
import type { Patient } from "@/types";

interface Props {
  patient?: Patient;
  onClose: () => void;
  onCreated: (p: Patient) => void;
  onUpdated: (p: Patient) => void;
  onDeleted: (id: string) => void;
}

export function PatientModal({ patient, onClose, onCreated, onUpdated, onDeleted }: Props) {
  const isEdit = !!patient;
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "history">("info");

  // Lazy load del historial médico
  const [medicalHistory, setMedicalHistory] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const loadMedicalHistory = async () => {
    if (historyLoaded || !patient?.id) return;
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/patients/${patient.id}`);
      const data = await res.json();
      setMedicalHistory(data.medicalHistory ?? "[]");
      setHistoryLoaded(true);
    } catch (err) {
      console.error("loadMedicalHistory error:", err);
      setMedicalHistory("[]");
      setHistoryLoaded(true);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleTabChange = async (tab: "info" | "history") => {
    setActiveTab(tab);
    if (tab === "history") {
      await loadMedicalHistory();
    }
  };

  const { register, handleSubmit, formState: { errors } } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      name: patient?.name ?? "",
      phone: patient?.phone ?? "",
      email: patient?.email ?? "",
      birthDate: patient?.birthDate
        ? new Date(patient.birthDate).toISOString().split("T")[0]
        : "",
      gender: patient?.gender ?? undefined,
      notes: patient?.notes ?? "",
    },
  });

  const onSubmit = async (data: PatientFormData) => {
    setIsLoading(true);
    setError(null);
    const result = isEdit ? await updatePatient(patient.id, data) : await createPatient(data);
    setIsLoading(false);
    if (result.error) { setError(result.error); return; }
    isEdit ? onUpdated(result.data!) : onCreated(result.data!);
  };

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setIsDeleting(true);
    const result = await deletePatient(patient!.id);
    if (result.error) { setError(result.error); setIsDeleting(false); return; }
    onDeleted(patient!.id);
  };

  const modal = (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-[9999]"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-base font-semibold text-gray-900">
            {isEdit ? "Editar paciente" : "Nuevo paciente"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs — solo en modo edición */}
        {isEdit && (
          <div className="flex gap-0 px-6 pt-3 shrink-0 border-b border-gray-100">
            {(["info", "history"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => handleTabChange(tab)}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === tab
                    ? "text-primary-600 border-primary-500"
                    : "text-gray-400 border-transparent hover:text-gray-600"
                }`}
              >
                {tab === "info" ? "Información" : "Historial médico"}
              </button>
            ))}
          </div>
        )}

        {/* Contenido — ambos montados, solo se ocultan */}
        <div className="flex flex-col flex-1 min-h-0">

          {/* Tab Información */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col flex-1 min-h-0"
            style={{ display: activeTab === "info" ? "flex" : "none" }}
          >
            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
              <FieldInput {...register("name")} label="Nombre completo" placeholder="Ej: Juan Pérez" error={errors.name?.message} />
              <div className="grid grid-cols-2 gap-3">
                <FieldInput {...register("phone")} label="Teléfono" placeholder="+51 999 000 000" error={errors.phone?.message} />
                <FieldInput {...register("email")} type="email" label="Email (opcional)" placeholder="paciente@email.com" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FieldInput {...register("birthDate")} type="date" label="Fecha de nacimiento" />
                <FieldSelect {...register("gender")} label="Género">
                  <option value="">Sin especificar</option>
                  <option value="MALE">Masculino</option>
                  <option value="FEMALE">Femenino</option>
                  <option value="OTHER">Otro</option>
                </FieldSelect>
              </div>
              <FieldTextarea {...register("notes")} label="Notas (opcional)" placeholder="Alergias, condiciones especiales..." />
              {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>}
              {confirmDelete && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">⚠️ ¿Eliminar paciente? Se eliminarán todas sus citas y pagos.</div>}
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
              {isEdit && (
                <button type="button" onClick={handleDelete} disabled={isDeleting}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50">
                  <Trash2 className="w-3.5 h-3.5" />
                  {isDeleting ? "..." : confirmDelete ? "Confirmar" : "Eliminar"}
                </button>
              )}
              <div className="flex gap-2 flex-1 justify-end">
                <button type="button" onClick={onClose}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={isLoading}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary-500 hover:bg-primary-600 text-white transition-colors disabled:opacity-50">
                  {isLoading ? "Guardando..." : isEdit ? "Guardar" : "Crear paciente"}
                </button>
              </div>
            </div>
          </form>

          {/* Tab Historial médico — lazy loaded */}
          {isEdit && (
            <div
              className="flex-1 overflow-y-auto px-6 py-4"
              style={{ display: activeTab === "history" ? "block" : "none" }}
            >
              {loadingHistory ? (
                <div className="flex items-center justify-center py-12 gap-2 text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Cargando historial...</span>
                </div>
              ) : historyLoaded ? (
                <MedicalHistoryEditor
                  patientId={patient!.id}
                  initialHistory={medicalHistory ?? "[]"}
                />
              ) : (
                // No se ha cargado aún — estado inicial antes de hacer click
                <div className="flex items-center justify-center py-12 text-gray-400">
                  <span className="text-sm">Abre esta pestaña para ver el historial</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}