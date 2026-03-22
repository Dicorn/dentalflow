"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, Loader2, X, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Treatment {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
  color?: string | null;
}

// Cache global con TTL 5 min — evita re-fetch cada vez que se abre el modal
const treatmentCache = {
  data: null as Treatment[] | null,
  loadedAt: 0,
  TTL: 5 * 60 * 1000,
  isValid() { return this.data !== null && Date.now() - this.loadedAt < this.TTL; },
  set(data: Treatment[]) { this.data = data; this.loadedAt = Date.now(); },
  clear() { this.data = null; this.loadedAt = 0; },
};

interface Props {
  value: string;
  onChange: (name: string, treatment?: Treatment) => void;
  error?: string;
  label?: string;
}

export function TreatmentSearchInput({ value, onChange, error, label = "Tratamiento" }: Props) {
  const [treatments, setTreatments] = useState<Treatment[]>(treatmentCache.data ?? []);
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState(value || "");
  const [open, setOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const loadTreatments = useCallback(async () => {
    if (treatmentCache.isValid()) {
      setTreatments(treatmentCache.data!);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/treatments");
      const data = await res.json();
      treatmentCache.set(data);
      setTreatments(data);
    } catch {
      setTreatments([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { setQuery(value || ""); }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = query.trim()
    ? treatments.filter((t) => t.name.toLowerCase().includes(query.toLowerCase()))
    : treatments;

  const handleFocus = async () => {
    await loadTreatments();
    setOpen(true);
  };

  const handleSelect = (treatment: Treatment) => {
    setQuery(treatment.name);
    onChange(treatment.name, treatment);
    setOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);
    if (!open) setOpen(true);
  };

  const handleClear = () => {
    setQuery("");
    onChange("");
    inputRef.current?.focus();
  };

  const formatDuration = (mins: number) => {
    if (mins < 60) return `${mins}min`;
    return `${Math.floor(mins / 60)}h${mins % 60 ? `${mins % 60}m` : ""}`;
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
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleChange}
            onFocus={handleFocus}
            placeholder="Buscar o escribir tratamiento..."
            className="flex-1 text-sm outline-none bg-transparent placeholder:text-gray-400"
          />
          {query && (
            <button type="button" onClick={handleClear}
              className="text-gray-300 hover:text-gray-500 transition-colors shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {open && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
            {isLoading ? (
              <div className="flex items-center gap-2 px-4 py-3 text-sm text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" /> Cargando catálogo...
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-400">
                {query
                  ? <span>Sin coincidencias — se usará <strong className="text-gray-600">"{query}"</strong></span>
                  : "No hay tratamientos en el catálogo"}
              </div>
            ) : (
              <ul className="max-h-52 overflow-y-auto py-1">
                {filtered.map((t) => (
                  <li key={t.id}>
                    <button type="button" onClick={() => handleSelect(t)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-primary-50 transition-colors">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: t.color || "#14b897" }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 truncate font-medium">{t.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-primary-600 font-semibold">{formatCurrency(t.price)}</span>
                          <span className="text-xs text-gray-400 flex items-center gap-0.5">
                            <Clock className="w-3 h-3" />{formatDuration(t.durationMinutes)}
                          </span>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
                {query && !filtered.find((t) => t.name.toLowerCase() === query.toLowerCase()) && (
                  <li>
                    <button type="button" onClick={() => { onChange(query); setOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors border-t border-gray-100">
                      <div className="w-2.5 h-2.5 rounded-full bg-gray-300 shrink-0" />
                      <p className="text-sm text-gray-500">
                        Usar <strong className="text-gray-700">"{query}"</strong> como tratamiento personalizado
                      </p>
                    </button>
                  </li>
                )}
              </ul>
            )}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export function invalidateTreatmentCache() {
  treatmentCache.clear();
}