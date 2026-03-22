"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Clock } from "lucide-react";
import { updateMedicalHistory } from "@/lib/actions/patients";
import { formatDate } from "@/lib/utils";
import { FieldInput, FieldTextarea } from "@/components/ui/FieldComponents";
import type { MedicalEntry, Patient } from "@/types";

interface Props {
  patientId: string;
  initialHistory: string;
}

export function MedicalHistoryEditor({ patientId, initialHistory }: Props) {
  const queryClient = useQueryClient();

  const [entries, setEntries] = useState<MedicalEntry[]>(() => {
    try { return JSON.parse(initialHistory); } catch { return []; }
  });
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split("T")[0],
    description: "",
  });
  const [message, setMessage] = useState<string | null>(null);

  // Sync the patients cache so the modal shows fresh data on reopen
  const syncCache = (updatedEntries: MedicalEntry[]) => {
    queryClient.setQueryData<Patient[]>(["patients"], (old = []) =>
      old.map((p) =>
        p.id === patientId
          ? { ...p, medicalHistory: JSON.stringify(updatedEntries) }
          : p
      )
    );
  };

  const handleAdd = async () => {
    if (!newEntry.description.trim()) return;
    const entry: MedicalEntry = {
      id: Date.now().toString(),
      date: new Date(newEntry.date).toISOString(),
      description: newEntry.description.trim(),
    };
    const updated = [entry, ...entries];
    setIsSaving(true);
    const result = await updateMedicalHistory(patientId, updated);
    setIsSaving(false);
    if (result.error) { setMessage(result.error); return; }

    setEntries(updated);
    syncCache(updated); // ← actualiza el cache de TanStack Query
    setNewEntry({ date: new Date().toISOString().split("T")[0], description: "" });
    setIsAdding(false);
    setMessage("Entrada guardada");
    setTimeout(() => setMessage(null), 2000);
  };

  const handleDelete = async (id: string) => {
    const updated = entries.filter((e) => e.id !== id);
    setIsSaving(true);
    const result = await updateMedicalHistory(patientId, updated);
    setIsSaving(false);
    if (result.error) { setMessage(result.error); return; }

    setEntries(updated);
    syncCache(updated); // ← actualiza el cache de TanStack Query
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Historial médico</h3>
        <button
          type="button"
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary-50 hover:bg-primary-100 text-primary-600 border border-primary-200 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Agregar entrada
        </button>
      </div>

      {isAdding && (
        <div className="border border-primary-200 bg-primary-50/60 rounded-xl p-4 space-y-3">
          <FieldInput
            type="date"
            label="Fecha"
            value={newEntry.date}
            onChange={(e) => setNewEntry((p) => ({ ...p, date: e.target.value }))}
          />
          <FieldTextarea
            label="Descripción"
            placeholder="Ej: Extracción muela del juicio. Sin complicaciones."
            value={newEntry.description}
            onChange={(e) => setNewEntry((p) => ({ ...p, description: e.target.value }))}
          />
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={isSaving || !newEntry.description.trim()}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary-500 hover:bg-primary-600 text-white transition-colors disabled:opacity-50"
            >
              {isSaving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      )}

      {message && (
        <div className="text-xs text-primary-600 bg-primary-50 rounded-lg px-3 py-2 border border-primary-100">
          {message}
        </div>
      )}

      {entries.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Sin entradas en el historial</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex gap-3 p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors group"
            >
              <div className="w-1 bg-primary-300 rounded-full shrink-0 mt-1" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 mb-1">{formatDate(entry.date)}</p>
                <p className="text-sm text-gray-700 leading-relaxed">{entry.description}</p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(entry.id)}
                className="text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}