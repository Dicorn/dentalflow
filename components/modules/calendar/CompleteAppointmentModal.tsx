"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { CheckCircle, X, CreditCard, Clock, FileText } from "lucide-react";
import { updateAppointment } from "@/lib/actions/appointments";
import { updatePayment, createPayment } from "@/lib/actions/payments";
import { formatCurrency } from "@/lib/utils";
import type { AppointmentWithPatient } from "@/types";

interface Props {
  appointment: AppointmentWithPatient;
  onClose: () => void;
  onCompleted: (apt: AppointmentWithPatient) => void;
  skipAsk?: boolean;
}

const PAYMENT_METHODS = [
  { value: "CASH", label: "Efectivo" },
  { value: "CARD", label: "Tarjeta" },
  { value: "TRANSFER", label: "Transferencia" },
  { value: "OTHER", label: "Otro" },
];

async function appendMedicalNote(patientId: string, note: string, treatment: string): Promise<string | null> {
  if (!note.trim()) return null;
  try {
    const res = await fetch(`/api/patients/${patientId}`);
    if (!res.ok) return "No se pudo leer el historial médico";
    const data = await res.json();
    const current = JSON.parse(data.medicalHistory || "[]");
    const newEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      description: `[${treatment}] ${note.trim()}`,
    };
    const patch = await fetch(`/api/patients/${patientId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ medicalHistory: JSON.stringify([newEntry, ...current]) }),
    });
    if (!patch.ok) return "No se pudo guardar la nota en el historial";
    return null;
  } catch {
    console.error("Error guardando nota en historial");
    return "No se pudo guardar la nota en el historial";
  }
}

export function CompleteAppointmentModal({ appointment, onClose, onCompleted, skipAsk = false }: Props) {
  const [step, setStep] = useState<"ask" | "payment">(skipAsk ? "payment" : "ask");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quickNote, setQuickNote] = useState("");
  const [saveNote, setSaveNote] = useState(false);

  const savedPrice = appointment.treatmentPrice;
  const [amount, setAmount] = useState(
    savedPrice && Number(savedPrice) > 0 ? String(Number(savedPrice)) : ""
  );
  const [method, setMethod] = useState("CASH");

  // Usar ref para el textarea — evita el bug de texto al revés con autoFocus en portales
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  // Focus manual después del render — no usar autoFocus dentro de portales
  useEffect(() => {
    if (step === "payment") {
      setTimeout(() => amountRef.current?.focus(), 50);
    }
  }, [step]);

  useEffect(() => {
    if (saveNote) {
      setTimeout(() => noteRef.current?.focus(), 50);
    }
  }, [saveNote]);

  const handleCompleteNoPay = async () => {
    setIsLoading(true);
    const result = await updateAppointment(appointment.id, { status: "COMPLETED" });
    if (result.error) { setError(result.error); setIsLoading(false); return; }
    if (saveNote && quickNote.trim()) {
      const noteError = await appendMedicalNote(appointment.patientId, quickNote, appointment.treatment);
      if (noteError) { setError(noteError); setIsLoading(false); return; }
    }
    setIsLoading(false);
    if (result.data) onCompleted(result.data as AppointmentWithPatient);
  };

  const handleCompleteWithPay = async () => {
    if (!amount || Number(amount) <= 0) { setError("Ingresa un monto válido"); return; }
    setIsLoading(true);
    setError(null);
    try {
      let aptData = appointment;
      if (!skipAsk) {
        const aptResult = await updateAppointment(appointment.id, { status: "COMPLETED" });
        if (aptResult.error) { setError(aptResult.error); setIsLoading(false); return; }
        if (aptResult.data) aptData = aptResult.data as AppointmentWithPatient;
      }
      if (saveNote && quickNote.trim()) {
        const noteError = await appendMedicalNote(appointment.patientId, quickNote, appointment.treatment);
        if (noteError) { setError(noteError); setIsLoading(false); return; }
      }
      const res = await fetch(`/api/payments-list?appointmentId=${appointment.id}`);
      const payments = await res.json();
      const pending = payments.find(
        (p: { appointmentId: string; status: string }) => p.status === "PENDING" || p.status === "PARTIAL"
      );
      if (pending) {
        await updatePayment(pending.id, {
          amount: Number(amount), status: "PAID",
          method: method as any, paidAt: new Date().toISOString(),
        });
      } else {
        await createPayment({
          patientId: appointment.patientId, appointmentId: appointment.id,
          treatment: appointment.treatment, amount: Number(amount),
          status: "PAID", method: method as any, paidAt: new Date().toISOString(),
        });
      }
      onCompleted(aptData);
    } catch {
      setError("Error al procesar el cobro");
      setIsLoading(false);
    }
  };

  // NoteToggle inlineado — NO definir como componente interno para evitar
  // que React desmonte el textarea en cada keystroke (pérdida de foco)
  const noteToggleJsx = (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button type="button" onClick={() => setSaveNote(!saveNote)}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-gray-500 hover:bg-gray-50 transition-colors">
        <FileText className="w-3.5 h-3.5" />
        <span className="flex-1 text-left">Agregar nota al historial médico</span>
        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${saveNote ? "bg-primary-500 border-primary-500" : "border-gray-300"}`}>
          {saveNote && <div className="w-2 h-2 bg-white rounded-sm" />}
        </div>
      </button>
      {saveNote && (
        <div className="px-3 pb-3 border-t border-gray-100">
          <textarea
            ref={noteRef}
            value={quickNote}
            onChange={(e) => setQuickNote(e.target.value)}
            placeholder="Ej: Limpieza completa, sin caries. Próxima revisión en 6 meses."
            rows={2}
            dir="ltr"
            className="w-full mt-2 px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 resize-none placeholder:text-gray-400"
          />
        </div>
      )}
    </div>
  );

  const modal = (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-[9999]" style={{ backgroundColor: "rgba(0,0,0,0.55)" }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${skipAsk ? "bg-primary-100" : "bg-emerald-100"}`}>
              {skipAsk ? <CreditCard className="w-4 h-4 text-primary-600" /> : <CheckCircle className="w-4 h-4 text-emerald-600" />}
            </div>
            <h2 className="text-base font-semibold text-gray-900">{skipAsk ? "Registrar cobro" : "Completar cita"}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div className="bg-gray-50 rounded-xl p-3 space-y-1">
            <p className="text-sm font-semibold text-gray-900">{appointment.patient.name}</p>
            <p className="text-xs text-gray-500">{appointment.treatment}</p>
            {savedPrice && Number(savedPrice) > 0 && (
              <p className="text-xs text-primary-600 font-semibold">Precio: {formatCurrency(Number(savedPrice))}</p>
            )}
          </div>

          {step === "ask" ? (
            <>
              <p className="text-sm font-medium text-gray-700 text-center">¿El paciente ya realizó el pago?</p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setStep("payment")}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-all">
                  <CreditCard className="w-6 h-6 text-emerald-600" />
                  <span className="text-sm font-semibold text-emerald-700">Sí, cobrado</span>
                </button>
                <button onClick={handleCompleteNoPay} disabled={isLoading}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 bg-gray-50 hover:bg-gray-100 transition-all disabled:opacity-50">
                  <Clock className="w-6 h-6 text-gray-400" />
                  <span className="text-sm font-semibold text-gray-600">{isLoading ? "..." : "No, pendiente"}</span>
                </button>
              </div>
              {noteToggleJsx}
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-gray-700">Registrar cobro</p>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">
                  Monto cobrado (S/)
                  {savedPrice && Number(savedPrice) > 0 && (
                    <span className="ml-1 text-gray-400 font-normal">— catálogo: {formatCurrency(Number(savedPrice))}</span>
                  )}
                </label>
                <input
                  ref={amountRef}
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  min={0}
                  step={0.5}
                  className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">Método de pago</label>
                <div className="grid grid-cols-4 gap-2">
                  {PAYMENT_METHODS.map((m) => (
                    <button key={m.value} type="button" onClick={() => setMethod(m.value)}
                      className={`py-2 rounded-lg text-xs font-medium transition-all border ${method === m.value ? "bg-primary-500 text-white border-primary-500" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                        }`}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
              {noteToggleJsx}
              {error && <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-xs text-red-700">{error}</div>}
              <div className="flex gap-2">
                <button onClick={() => { skipAsk ? onClose() : setStep("ask"); setError(null); }}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
                  {skipAsk ? "Cancelar" : "Atrás"}
                </button>
                <button onClick={handleCompleteWithPay} disabled={isLoading || !amount || Number(amount) <= 0}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-white transition-colors disabled:opacity-50">
                  {isLoading ? "Guardando..." : "Confirmar cobro"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}