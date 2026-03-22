"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardBody, Button, Chip, Spinner } from "@heroui/react";
import { Bell, Send, CheckCircle, Clock, MessageSquare, Phone } from "lucide-react";
import { formatDateTime, getRelativeTime } from "@/lib/utils";
import { triggerRemindersAction } from "@/lib/actions/reminders";
import type { ReminderLogWithRelations } from "@/types";

interface RemindersData {
  logs: ReminderLogWithRelations[];
  pendingCount: number;
}

const channelIcons = { SMS: Phone, EMAIL: MessageSquare, WHATSAPP: MessageSquare };
const statusColors = { PENDING: "warning", SENT: "success", SIMULATED: "primary", FAILED: "danger" } as const;
const statusLabels = { PENDING: "Pendiente", SENT: "Enviado", SIMULATED: "Simulado", FAILED: "Fallido" };

export function RemindersPageClient() {
  const queryClient = useQueryClient();
  const [isTriggering, setIsTriggering] = useState(false);

  const { data, isLoading } = useQuery<RemindersData>({
    queryKey: ["reminders"],
    queryFn: () => fetch("/api/reminders-log").then((r) => r.json()),
  });

  const handleTrigger = async () => {
    setIsTriggering(true);
    try {
      const result = await triggerRemindersAction();
      if (result && result.processed >= 0) {
        queryClient.invalidateQueries({ queryKey: ["reminders"] });
        queryClient.invalidateQueries({ queryKey: ["appointments"] });
      }
    } finally {
      setIsTriggering(false);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" color="primary" /></div>;

  const { logs = [], pendingCount = 0 } = data ?? {};

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-gray-100 shadow-sm">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center">
                <Clock className="w-4.5 h-4.5 text-amber-600" size={18} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
                <p className="text-xs text-gray-500">Recordatorios pendientes</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-gray-100 shadow-sm">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary-50 rounded-lg flex items-center justify-center">
                <Bell className="w-4.5 h-4.5 text-primary-600" size={18} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{logs.filter((l) => l.status === "SIMULATED").length}</p>
                <p className="text-xs text-gray-500">Simulados (MVP)</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-gray-100 shadow-sm">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-4.5 h-4.5 text-emerald-600" size={18} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{logs.filter((l) => l.status === "SENT").length}</p>
                <p className="text-xs text-gray-500">Enviados</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Trigger button */}
      <Card className="border border-primary-100 bg-primary-50/30 shadow-sm">
        <CardBody className="p-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Envío manual de recordatorios</h3>
              <p className="text-xs text-gray-500">
                Dispara el proceso de recordatorios ahora. En producción se ejecuta automáticamente cada hora (Vercel Cron).
                En MVP los mensajes se <strong>simulan</strong> y guardan en el log.
              </p>
            </div>
            <Button
              color="primary"
              startContent={<Send className="w-4 h-4" />}
              onPress={handleTrigger}
              isLoading={isTriggering}
            >
              Enviar recordatorios
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Log */}
      <Card className="border border-gray-100 shadow-sm">
        <CardBody className="p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Historial de recordatorios</h3>

          {logs.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No hay recordatorios registrados</p>
              <p className="text-xs mt-1">Los recordatorios aparecerán aquí cuando se procesen</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => {
                const Icon = channelIcons[log.channel] ?? Bell;
                return (
                  <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-50">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-4 h-4 text-gray-500" size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="text-sm font-medium text-gray-900">
                          {log.appointment.patient.name}
                        </p>
                        <Chip size="sm" color={statusColors[log.status]} variant="flat" className="text-xs">
                          {statusLabels[log.status]}
                        </Chip>
                        <span className="text-xs text-gray-400">{log.channel}</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{log.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {log.recipientPhone} · {getRelativeTime(log.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
