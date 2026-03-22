"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Spinner } from "@heroui/react";
import { ShieldCheck, Plus, Pencil, Trash2, ChevronDown } from "lucide-react";
import { getRelativeTime } from "@/lib/utils";

interface AuditEntry {
  id: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "EXPORT";
  entity: "PATIENT" | "APPOINTMENT" | "PAYMENT" | "REMINDER" | "SETTINGS" | "USER";
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

interface AuditResponse {
  logs: AuditEntry[];
  nextCursor: string | null;
  hasMore: boolean;
}

const actionConfig = {
  CREATE: { label: "Creó", icon: Plus, color: "bg-emerald-100 text-emerald-700" },
  UPDATE: { label: "Actualizó", icon: Pencil, color: "bg-blue-100 text-blue-700" },
  DELETE: { label: "Eliminó", icon: Trash2, color: "bg-red-100 text-red-700" },
  LOGIN:  { label: "Inició sesión", icon: ShieldCheck, color: "bg-gray-100 text-gray-600" },
  EXPORT: { label: "Exportó", icon: ShieldCheck, color: "bg-purple-100 text-purple-700" },
};

const entityLabels: Record<string, string> = {
  PATIENT: "paciente",
  APPOINTMENT: "cita",
  PAYMENT: "pago",
  REMINDER: "recordatorio",
  SETTINGS: "configuración",
  USER: "usuario",
};

function MetadataViewer({ metadata }: { metadata: Record<string, unknown> | null }) {
  const [open, setOpen] = useState(false);
  if (!metadata || Object.keys(metadata).length === 0) return null;
  return (
    <div className="mt-1">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
        {open ? "Ocultar detalles" : "Ver detalles"}
      </button>
      {open && (
        <pre className="mt-1 text-xs bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 overflow-x-auto text-gray-600">
          {JSON.stringify(metadata, null, 2)}
        </pre>
      )}
    </div>
  );
}

export function AuditLog() {
  const [cursor, setCursor] = useState<string | null>(null);
  const [allLogs, setAllLogs] = useState<AuditEntry[]>([]);

  const { data, isLoading, isFetching } = useQuery<AuditResponse>({
    queryKey: ["audit-log", cursor],
    queryFn: () => {
      const params = new URLSearchParams();
      if (cursor) params.set("cursor", cursor);
      return fetch(`/api/audit-log?${params}`).then((r) => r.json());
    },
    staleTime: 30_000,
  });

  // Acumular logs al cargar más páginas
  const logs = cursor === null ? (data?.logs ?? []) : [...allLogs, ...(data?.logs ?? [])];

  const handleLoadMore = () => {
    if (data?.logs) setAllLogs((prev) => [...prev, ...data.logs]);
    setCursor(data?.nextCursor ?? null);
  };

  if (isLoading && cursor === null) {
    return <div className="flex justify-center py-8"><Spinner color="primary" /></div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className="w-4 h-4 text-gray-400" />
        <h2 className="text-sm font-semibold text-gray-900">Registro de actividad</h2>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <ShieldCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No hay actividad registrada</p>
          <p className="text-xs mt-1">Las acciones aparecerán aquí conforme uses el sistema</p>
        </div>
      ) : (
        <>
          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {logs.map((log) => {
              const cfg = actionConfig[log.action] ?? actionConfig.UPDATE;
              const Icon = cfg.icon;
              return (
                <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${cfg.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">{cfg.label}</span>{" "}
                      <span className="text-gray-500">{entityLabels[log.entity] ?? log.entity}</span>
                      {log.entityId && (
                        <span className="ml-1 text-xs text-gray-400 font-mono">#{log.entityId.slice(-6)}</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{getRelativeTime(log.createdAt)}</p>
                    <MetadataViewer metadata={log.metadata} />
                  </div>
                </div>
              );
            })}
          </div>

          {data?.hasMore && (
            <button
              onClick={handleLoadMore}
              disabled={isFetching}
              className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {isFetching ? "Cargando..." : "Cargar más"}
            </button>
          )}
        </>
      )}
    </div>
  );
}
