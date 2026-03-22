"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Trash2 } from "lucide-react";
import { createPayment, updatePayment, deletePayment } from "@/lib/actions/payments";
import { paymentSchema, type PaymentFormData } from "@/lib/validations";
import { FieldInput, FieldTextarea, FieldSelect } from "@/components/ui/FieldComponents";
import { PatientSearchInput } from "@/components/ui/PatientSearchInput";
import type { PaymentWithRelations } from "@/types";

interface Props {
  payment?: PaymentWithRelations;
  onClose: () => void;
  onCreated: (p: PaymentWithRelations) => void;
  onUpdated: (p: PaymentWithRelations) => void;
  onDeleted: (id: string) => void;
}

export function PaymentModal({ payment, onClose, onCreated, onUpdated, onDeleted }: Props) {
  const isEdit = !!payment;
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, control, formState: { errors } } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      patientId: payment?.patientId ?? "",
      treatment: payment?.treatment ?? "",
      amount: payment?.amount ?? 0,
      status: payment?.status ?? "PENDING",
      method: payment?.method ?? "CASH",
      notes: payment?.notes ?? "",
    },
  });

  const onSubmit = async (data: PaymentFormData) => {
    setIsLoading(true);
    setError(null);
    const result = isEdit ? await updatePayment(payment.id, data) : await createPayment(data);
    setIsLoading(false);
    if (result.error) { setError(result.error); return; }
    isEdit ? onUpdated(result.data as PaymentWithRelations) : onCreated(result.data as PaymentWithRelations);
  };

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setIsDeleting(true);
    const result = await deletePayment(payment!.id);
    if (result.error) { setError(result.error); setIsDeleting(false); return; }
    onDeleted(payment!.id);
  };

  const modal = (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-[9999]" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-base font-semibold text-gray-900">{isEdit ? "Editar pago" : "Nuevo pago"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
          <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">

            {/* Buscador de paciente */}
            <Controller
              name="patientId"
              control={control}
              render={({ field }) => (
                <PatientSearchInput
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.patientId?.message}
                />
              )}
            />

            <FieldInput {...register("treatment")} label="Tratamiento" placeholder="Ej: Limpieza dental" error={errors.treatment?.message} />

            <Controller
              name="amount"
              control={control}
              render={({ field }) => (
                <FieldInput
                  {...field}
                  value={field.value === 0 ? "" : String(field.value)}
                  onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                  type="number"
                  label="Monto (S/)"
                  placeholder="0.00"
                  min={0}
                  step={0.01}
                  error={errors.amount?.message}
                />
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FieldSelect {...register("status")} label="Estado">
                <option value="PENDING">Pendiente</option>
                <option value="PAID">Cobrado</option>
                <option value="PARTIAL">Parcial</option>
                <option value="CANCELLED">Cancelado</option>
              </FieldSelect>
              <FieldSelect {...register("method")} label="Método">
                <option value="CASH">Efectivo</option>
                <option value="CARD">Tarjeta</option>
                <option value="TRANSFER">Transferencia</option>
                <option value="OTHER">Otro</option>
              </FieldSelect>
            </div>

            <FieldTextarea {...register("notes")} label="Notas (opcional)" />

            {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>}
            {confirmDelete && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">⚠️ ¿Confirmar eliminación del pago?</div>}
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
                {isLoading ? "Guardando..." : isEdit ? "Guardar" : "Crear pago"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}