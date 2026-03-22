"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, Loader2, User, X } from "lucide-react";
import type { Patient } from "@/types";

// Cache global — persiste entre renders y re-mounts en la misma sesión
const patientCache = {
  data: null as Patient[] | null,
  loadedAt: 0,
  TTL: 5 * 60 * 1000, // 5 minutos
  isValid() { return this.data !== null && Date.now() - this.loadedAt < this.TTL; },
  set(data: Patient[]) { this.data = data; this.loadedAt = Date.now(); },
  clear() { this.data = null; this.loadedAt = 0; },
};

interface Props {
  value: string;
  onChange: (patientId: string) => void;
  error?: string;
  label?: string;
  placeholder?: string;
  initialName?: string;
}

export function PatientSearchInput({
  value,
  onChange,
  error,
  label = "Paciente",
  placeholder = "Buscar paciente por nombre...",
  initialName,
}: Props) {
  const [patients, setPatients] = useState<Patient[]>(patientCache.data ?? []);
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedName, setSelectedName] = useState(initialName ?? "");

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const loadPatients = useCallback(async () => {
    // Usar cache si es válido
    if (patientCache.isValid()) {
      setPatients(patientCache.data!);
      if (value && !selectedName) {
        const found = patientCache.data!.find((p) => p.id === value);
        if (found) setSelectedName(found.name);
      }
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/patients?limit=100&page=1");
      const json = await res.json();
      // La API devuelve { data: [], pagination: {} } — extraemos el array
      const patients: Patient[] = Array.isArray(json) ? json : (json.data ?? []);
      patientCache.set(patients);
      setPatients(patients);
      if (value && !selectedName) {
        const found = patients.find((p: Patient) => p.id === value);
        if (found) setSelectedName(found.name);
      }
    } catch {
      setPatients([]);
    } finally {
      setIsLoading(false);
    }
  }, [value, selectedName]);

  // Si hay value pero no nombre, cargar al montar
  useEffect(() => {
    if (value && !selectedName) loadPatients();
  }, [value, selectedName, loadPatients]);

  // Cerrar al click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = query.trim()
    ? patients.filter((p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.phone?.includes(query) ||
      p.email?.toLowerCase().includes(query.toLowerCase())
    )
    : patients;

  const handleFocus = async () => {
    await loadPatients();
    setOpen(true);
  };

  const handleSelect = (patient: Patient) => {
    onChange(patient.id);
    setSelectedName(patient.name);
    setQuery("");
    setOpen(false);
  };

  const handleClear = () => {
    onChange("");
    setSelectedName("");
    setQuery("");
    setOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-gray-600">{label}</label>}
      <div className="relative">
        <div
          className={`flex items-center gap-2 px-3 py-2.5 border rounded-lg bg-white transition-all cursor-text ${open ? "border-primary-400 ring-2 ring-primary-100"
              : error ? "border-red-300"
                : "border-gray-200 hover:border-gray-300"
            }`}
          onClick={() => inputRef.current?.focus()}
        >
          {isLoading
            ? <Loader2 className="w-4 h-4 text-gray-400 shrink-0 animate-spin" />
            : <Search className="w-4 h-4 text-gray-400 shrink-0" />
          }
          {selectedName && !open ? (
            <span className="flex-1 text-sm text-gray-900 truncate">{selectedName}</span>
          ) : (
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={handleFocus}
              placeholder={selectedName || placeholder}
              className="flex-1 text-sm outline-none bg-transparent placeholder:text-gray-400"
            />
          )}
          {(selectedName || query) && (
            <button type="button" onClick={(e) => { e.stopPropagation(); handleClear(); }}
              className="text-gray-300 hover:text-gray-500 transition-colors shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {open && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
            {isLoading ? (
              <div className="flex items-center gap-2 px-4 py-3 text-sm text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" /> Cargando pacientes...
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-400 flex items-center gap-2">
                <User className="w-4 h-4" />
                {query ? `Sin resultados para "${query}"` : "No hay pacientes registrados"}
              </div>
            ) : (
              <ul className="max-h-52 overflow-y-auto py-1">
                {filtered.map((patient) => (
                  <li key={patient.id}>
                    <button type="button" onClick={() => handleSelect(patient)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-primary-50 transition-colors ${patient.id === value ? "bg-primary-50" : ""}`}>
                      <div className="w-7 h-7 rounded-lg bg-primary-100 flex items-center justify-center shrink-0 text-xs font-bold text-primary-700">
                        {patient.name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${patient.id === value ? "font-semibold text-primary-700" : "text-gray-900"}`}>
                          {patient.name}
                        </p>
                        {patient.phone && <p className="text-xs text-gray-400 truncate">{patient.phone}</p>}
                      </div>
                      {patient.id === value && <div className="w-2 h-2 rounded-full bg-primary-500 shrink-0" />}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// Exportar para invalidar el cache cuando se crea/edita un paciente
export function invalidatePatientCache() {
  patientCache.clear();
}