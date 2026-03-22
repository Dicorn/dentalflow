"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Search, User, X, Phone, Calendar, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Patient } from "@/types";

// Reutiliza el mismo cache de PatientSearchInput
const patientCache = {
    data: null as Patient[] | null,
    loadedAt: 0,
    TTL: 5 * 60 * 1000,
    isValid() { return this.data !== null && Date.now() - this.loadedAt < this.TTL; },
    set(data: Patient[]) { this.data = data; this.loadedAt = Date.now(); },
};

export function GlobalSearch() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [patients, setPatients] = useState<Patient[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    // Abrir con Cmd+K / Ctrl+K
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setOpen((prev) => !prev);
            }
            if (e.key === "Escape") setOpen(false);
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, []);

    // Focus al abrir
    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 50);
            loadPatients();
        } else {
            setQuery("");
            setActiveIndex(0);
            setLoadError(false);
        }
    }, [open]);

    const loadPatients = async () => {
        if (patientCache.isValid()) {
            setPatients(patientCache.data!);
            return;
        }
        setIsLoading(true);
        setLoadError(false);
        try {
            const res = await fetch("/api/patients");
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            patientCache.set(data);
            setPatients(data);
        } catch (err) {
            console.error("[GlobalSearch] Error cargando pacientes:", err);
            setLoadError(true);
            setPatients([]);
        } finally {
            setIsLoading(false);
        }
    };

    const filtered = query.trim()
        ? patients.filter((p) =>
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.phone?.includes(query) ||
            p.email?.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 6)
        : patients.slice(0, 6);

    const handleSelect = useCallback((patient: Patient) => {
        setOpen(false);
        router.push(`/patients?search=${encodeURIComponent(patient.name)}`);
    }, [router]);

    // Navegación con teclado
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter" && filtered[activeIndex]) {
            handleSelect(filtered[activeIndex]);
        }
    };

    useEffect(() => { setActiveIndex(0); }, [query]);

    if (!open) return null;

    const modal = (
        <div
            className="fixed inset-0 flex items-start justify-center pt-24 p-4 z-[99999]"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            onClick={() => setOpen(false)}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Input */}
                <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
                    <Search className="w-4 h-4 text-gray-400 shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Buscar paciente por nombre, teléfono o email..."
                        className="flex-1 text-sm outline-none text-gray-900 placeholder:text-gray-400"
                    />
                    {query && (
                        <button onClick={() => setQuery("")} className="text-gray-300 hover:text-gray-500">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                    <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 text-xs text-gray-400 bg-gray-100 rounded-md font-mono">
                        ESC
                    </kbd>
                </div>

                {/* Resultados */}
                <div className="max-h-80 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex items-center gap-2 px-4 py-4 text-sm text-gray-400">
                            <div className="w-4 h-4 border-2 border-gray-300 border-t-primary-500 rounded-full animate-spin" />
                            Cargando pacientes...
                        </div>
                    ) : loadError ? (
                        <div className="flex items-center gap-2 px-4 py-4 text-sm text-red-500">
                            Error al cargar pacientes. Intenta de nuevo.
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="px-4 py-8 text-center">
                            <User className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                            <p className="text-sm text-gray-400">
                                {query ? `Sin resultados para "${query}"` : "No hay pacientes"}
                            </p>
                        </div>
                    ) : (
                        <ul className="py-1">
                            {filtered.map((patient, i) => (
                                <li key={patient.id}>
                                    <button
                                        onClick={() => handleSelect(patient)}
                                        onMouseEnter={() => setActiveIndex(i)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${i === activeIndex ? "bg-primary-50" : "hover:bg-gray-50"
                                            }`}
                                    >
                                        <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center shrink-0 text-sm font-bold text-primary-700">
                                            {patient.name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 truncate">{patient.name}</p>
                                            <div className="flex items-center gap-3 mt-0.5">
                                                {patient.phone && (
                                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                                        <Phone className="w-3 h-3" />{patient.phone}
                                                    </span>
                                                )}
                                                {patient.email && (
                                                    <span className="text-xs text-gray-400 truncate">{patient.email}</span>
                                                )}
                                            </div>
                                        </div>
                                        <ArrowRight className={`w-4 h-4 shrink-0 transition-colors ${i === activeIndex ? "text-primary-500" : "text-gray-200"}`} />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100 bg-gray-50">
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-xs font-mono">↑↓</kbd>
                            navegar
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-xs font-mono">↵</kbd>
                            seleccionar
                        </span>
                    </div>
                    <span className="text-xs text-gray-400">{filtered.length} resultado{filtered.length !== 1 ? "s" : ""}</span>
                </div>
            </div>
        </div>
    );

    return createPortal(modal, document.body);
}