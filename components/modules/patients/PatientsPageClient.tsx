"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, FileSpreadsheet, FileText } from "lucide-react";
import { PatientsList } from "./PatientsList";
import { PatientModal } from "./PatientModal";
import type { Patient } from "@/types";
import { exportPatientsCsv } from "@/lib/export/exportCsv";
import { exportPatientsPdf } from "@/lib/export/exportPdf";

type PatientWithCount = Patient & {
  _count: { appointments: number; payments: number };
  pendingDebt: number;
};

interface PatientsResponse {
  data: PatientWithCount[];
  pagination: { total: number };
}

export function PatientsPageClient() {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean; patient?: PatientWithCount }>({ open: false });
  const [search, setSearch] = useState("");

  // Carga todos los pacientes de una vez — client-side filtering
  const { data, isLoading } = useQuery<PatientsResponse>({
    queryKey: ["patients"],
    queryFn: () => fetch("/api/patients?limit=1000").then((r) => r.json()),
    staleTime: 2 * 60 * 1000,
  });

  const allPatients = data?.data ?? [];

  // Filtro client-side: instantáneo, sin debounce ni API calls
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allPatients;
    return allPatients.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.phone?.includes(q) ||
        p.email?.toLowerCase().includes(q)
    );
  }, [allPatients, search]);

  const handleSearch = useCallback((value: string) => setSearch(value), []);

  const handleCreated = (_patient: Patient) => {
    queryClient.invalidateQueries({ queryKey: ["patients"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    setModal({ open: false });
  };

  const handleUpdated = (_patient: Patient) => {
    queryClient.invalidateQueries({ queryKey: ["patients"] });
    setModal({ open: false });
  };

  const handleDeleted = (_id: string) => {
    queryClient.invalidateQueries({ queryKey: ["patients"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    setModal({ open: false });
  };

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const exportLabel = search.trim()
    ? `${filtered.length} filtrado${filtered.length !== 1 ? "s" : ""}`
    : `${allPatients.length} paciente${allPatients.length !== 1 ? "s" : ""}`;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-1">
          <p className="text-sm font-semibold text-gray-700 shrink-0">
            {search.trim()
              ? `${filtered.length} de ${allPatients.length} paciente${allPatients.length !== 1 ? "s" : ""}`
              : `${allPatients.length} paciente${allPatients.length !== 1 ? "s" : ""}`}
          </p>
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Buscar por nombre, teléfono..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {allPatients.length > 0 && (
            <>
              <button
                onClick={() => exportPatientsCsv(filtered)}
                title={`Exportar ${exportLabel}`}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" />
                CSV
                <span className="text-xs text-gray-400">({filtered.length})</span>
              </button>
              <button
                onClick={() => exportPatientsPdf(filtered)}
                title={`Exportar ${exportLabel}`}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <FileText className="w-4 h-4" />
                PDF
                <span className="text-xs text-gray-400">({filtered.length})</span>
              </button>
            </>
          )}
          <button
            onClick={() => setModal({ open: true })}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-primary-500 hover:bg-primary-600 text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuevo paciente
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <PatientsList
          patients={filtered}
          onEdit={(patient) => setModal({ open: true, patient })}
        />
      )}

      {modal.open && (
        <PatientModal
          patient={modal.patient}
          onClose={() => setModal({ open: false })}
          onCreated={handleCreated}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}
