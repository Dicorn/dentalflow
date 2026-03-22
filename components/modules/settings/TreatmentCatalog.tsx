"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Plus, Pencil, Trash2, Check, X, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Treatment {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
  color?: string | null;
  active: boolean;
}

const COLORS = [
  "#14b897", "#3b82f6", "#8b5cf6", "#ef4444",
  "#f59e0b", "#10b981", "#ec4899", "#06b6d4",
];

const DEFAULT_DURATIONS = [15, 30, 45, 60, 90, 120];

const formatDuration = (mins: number) => {
  if (mins < 60) return `${mins}min`;
  return `${Math.floor(mins / 60)}h${mins % 60 ? `${mins % 60}m` : ""}`;
};

interface TreatmentModalProps {
  editingTreatment: Treatment | null;
  onClose: () => void;
  onSaved: (t: Treatment) => void;
}

function TreatmentModal({ editingTreatment, onClose, onSaved }: TreatmentModalProps) {
  const [form, setForm] = useState({
    name: editingTreatment?.name ?? "",
    price: editingTreatment ? String(editingTreatment.price) : "",
    durationMinutes: editingTreatment?.durationMinutes ?? 60,
    color: editingTreatment?.color ?? COLORS[0],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!form.name.trim() || !form.price) { setError("Nombre y precio son requeridos"); return; }
    setSaving(true);
    setError(null);
    const payload = {
      name: form.name.trim(),
      price: parseFloat(form.price),
      durationMinutes: form.durationMinutes,
      color: form.color,
    };
    try {
      let saved: Treatment;
      if (editingTreatment) {
        const res = await fetch(`/api/treatments/${editingTreatment.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        saved = await res.json();
      } else {
        const res = await fetch("/api/treatments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        saved = await res.json();
      }
      onSaved(saved);
    } catch {
      setError("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const modal = (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-[9999]"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">
            {editingTreatment ? "Editar tratamiento" : "Nuevo tratamiento"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Nombre</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Ej: Limpieza dental..."
              autoFocus
              className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Precio (S/)</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                placeholder="0.00"
                min={0}
                step={0.5}
                className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Duración</label>
              <select
                value={form.durationMinutes}
                onChange={(e) => setForm((p) => ({ ...p, durationMinutes: Number(e.target.value) }))}
                className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary-400 bg-white"
              >
                {DEFAULT_DURATIONS.map((d) => <option key={d} value={d}>{formatDuration(d)}</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-600">Color en el calendario</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, color: c }))}
                  className="w-7 h-7 rounded-lg transition-transform hover:scale-110 flex items-center justify-center shrink-0"
                  style={{ backgroundColor: c }}
                >
                  {form.color === c && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex gap-2 justify-end px-5 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary-500 hover:bg-primary-600 text-white transition-colors disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

export function TreatmentCatalog() {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState<Treatment | null>(null);

  useEffect(() => {
    fetch("/api/treatments")
      .then((r) => r.json())
      .then((data) => { setTreatments(data); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  }, []);

  const openCreate = () => { setEditingTreatment(null); setModalOpen(true); };
  const openEdit = (t: Treatment) => { setEditingTreatment(t); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditingTreatment(null); };

  const handleSaved = (saved: Treatment) => {
    if (editingTreatment) {
      setTreatments((prev) => prev.map((t) => (t.id === saved.id ? saved : t)));
    } else {
      setTreatments((prev) => [...prev, saved]);
    }
    closeModal();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este tratamiento? No se perderá el historial de citas.")) return;
    await fetch(`/api/treatments/${id}`, { method: "DELETE" });
    setTreatments((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 h-full flex flex-col">
      {/* Header */}
      <div className="mb-4 shrink-0">
        <h2 className="text-sm font-semibold text-gray-900">Catálogo de tratamientos</h2>
        <p className="text-xs text-gray-400 mt-0.5">{treatments.length} tratamiento{treatments.length !== 1 ? "s" : ""}</p>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-10 flex-1">
          <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="overflow-y-auto flex-1 -mr-1 pr-1">
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-2.5">
            {/* Agregar — siempre primero */}
            <button
              onClick={openCreate}
              className="border-2 border-dashed border-gray-200 rounded-xl p-3.5 flex flex-col items-center justify-center gap-1.5 hover:border-primary-300 hover:bg-primary-50/30 transition-all text-gray-400 hover:text-primary-500 min-h-[90px]"
            >
              <Plus className="w-4 h-4" />
              <span className="text-xs font-medium">Agregar</span>
            </button>

            {treatments.map((t) => (
              <div
                key={t.id}
                className="group relative bg-white border border-gray-100 rounded-xl p-3.5 hover:shadow-md hover:-translate-y-0.5 transition-all"
                style={{ borderTop: `3px solid ${t.color || "#14b897"}` }}
              >
                <p className="text-sm font-semibold text-gray-900 truncate pr-10 mb-2.5">{t.name}</p>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-primary-600">{formatCurrency(t.price)}</span>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDuration(t.durationMinutes)}
                  </span>
                </div>
                <div className="absolute top-2.5 right-2.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(t)}
                    className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="p-1 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {modalOpen && (
        <TreatmentModal
          editingTreatment={editingTreatment}
          onClose={closeModal}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
