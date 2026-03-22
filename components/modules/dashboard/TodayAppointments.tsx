"use client";

import { useState } from "react";
import { Card, CardBody } from "@heroui/react";
import { Clock, XCircle, UserX, CalendarDays, ChevronRight, CheckCircle, CreditCard, AlertCircle } from "lucide-react";
import { formatTime, getRelativeDay, formatCurrency } from "@/lib/utils";
import { updateAppointment } from "@/lib/actions/appointments";
import { CompleteAppointmentModal } from "@/components/modules/calendar/CompleteAppointmentModal";
import type { AppointmentWithPatient, AppointmentStatus } from "@/types";

interface Props {
  todayList: AppointmentWithPatient[];
  upcomingList: AppointmentWithPatient[];
  pendingPaymentIds?: string[]; // appointmentIds con pago pendiente aunque completadas
  onUpdated?: (apt: AppointmentWithPatient) => void;
}

const statusBadge: Record<AppointmentStatus, string> = {
  SCHEDULED: "bg-blue-100 text-blue-700",
  CONFIRMED: "bg-primary-100 text-primary-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-700",
  NO_SHOW: "bg-amber-100 text-amber-700",
};

const statusLabel: Record<AppointmentStatus, string> = {
  SCHEDULED: "Programada",
  CONFIRMED: "Confirmada",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
  NO_SHOW: "No asistió",
};

const DONE_STATUSES: AppointmentStatus[] = ["COMPLETED", "CANCELLED", "NO_SHOW"];

function InitialsAvatar({ name }: { name: string }) {
  const initials = name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
  return (
    <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center shrink-0 text-xs font-bold text-primary-700">
      {initials}
    </div>
  );
}

export function TodayAppointments({ todayList, upcomingList, pendingPaymentIds = [], onUpdated }: Props) {
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [completingApt, setCompletingApt] = useState<AppointmentWithPatient | null>(null);
  const [cobrandoApt, setCobrandoApt] = useState<AppointmentWithPatient | null>(null); // cobro directo sin "completar"

  const handleAction = async (apt: AppointmentWithPatient, nextStatus: AppointmentStatus) => {
    const key = `${apt.id}-${nextStatus}`;
    setLoadingKey(key);
    const result = await updateAppointment(apt.id, { status: nextStatus });
    setLoadingKey(null);
    if (!result.error && result.data && onUpdated) onUpdated(result.data as AppointmentWithPatient);
  };

  // Ordenar: pendientes primero (por hora), completadas/canceladas al fondo
  const sortedToday = [...todayList].sort((a, b) => {
    const aDone = DONE_STATUSES.includes(a.status) ? 1 : 0;
    const bDone = DONE_STATUSES.includes(b.status) ? 1 : 0;
    if (aDone !== bDone) return aDone - bDone;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Citas de hoy ── */}
        <Card className="border border-gray-100 shadow-sm">
          <CardBody className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Citas de hoy</h3>
                <p className="text-xs text-gray-400">
                  {todayList.filter(a => !DONE_STATUSES.includes(a.status)).length} pendiente{todayList.filter(a => !DONE_STATUSES.includes(a.status)).length !== 1 ? "s" : ""}
                  {" · "}
                  {todayList.length} total
                </p>
              </div>
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
            </div>

            {sortedToday.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Sin citas para hoy</p>
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto max-h-[250px] pr-1">
                {sortedToday.map((apt) => {
                  const isDone = DONE_STATUSES.includes(apt.status);
                  const hasPendingPayment = apt.status === "COMPLETED" && pendingPaymentIds.includes(apt.id);

                  return (
                    <div key={apt.id} className={`rounded-xl border transition-all ${isDone && !hasPendingPayment
                        ? "bg-gray-50 border-gray-100 opacity-60"
                        : hasPendingPayment
                          ? "bg-amber-50 border-amber-200"
                          : "bg-white border-gray-100 hover:border-primary-100 hover:shadow-sm"
                      }`}>
                      <div className="flex items-center gap-3 px-3 py-2.5">
                        <InitialsAvatar name={apt.patient.name} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{apt.patient.name}</p>
                          <p className="text-xs text-gray-400 truncate">{apt.treatment}</p>
                        </div>
                        <span className="text-xs font-semibold text-gray-500 shrink-0">{formatTime(apt.date)}</span>

                        {/* Acciones según estado */}
                        {apt.status === "COMPLETED" && hasPendingPayment ? (
                          // Completada pero sin cobrar
                          <button
                            onClick={() => setCobrandoApt(apt)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white transition-colors shrink-0"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            Cobrar
                          </button>
                        ) : isDone ? (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${statusBadge[apt.status]}`}>
                            {statusLabel[apt.status]}
                          </span>
                        ) : (
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => setCompletingApt(apt)} disabled={loadingKey !== null} title="Completar"
                              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors disabled:opacity-50">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Completar
                            </button>
                            <button onClick={() => handleAction(apt, "NO_SHOW")} disabled={loadingKey !== null} title="No asistió"
                              className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-colors disabled:opacity-50">
                              <UserX className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleAction(apt, "CANCELLED")} disabled={loadingKey !== null} title="Cancelar"
                              className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors disabled:opacity-50">
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Banner de cobro pendiente */}
                      {hasPendingPayment && apt.treatmentPrice && Number(apt.treatmentPrice) > 0 && (
                        <div className="flex items-center gap-1.5 px-3 pb-2.5 text-xs text-amber-700">
                          <AlertCircle className="w-3 h-3" />
                          Cobro pendiente: {formatCurrency(Number(apt.treatmentPrice))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>

        {/* ── Próximas citas ── */}
        <Card className="border border-gray-100 shadow-sm">
          <CardBody className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Próximas citas</h3>
                <p className="text-xs text-gray-400">Los siguientes días</p>
              </div>
              <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center">
                <CalendarDays className="w-4 h-4 text-violet-600" />
              </div>
            </div>

            {upcomingList.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No hay citas próximas</p>
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto max-h-[250px] pr-1">
                {upcomingList.map((apt) => (
                  <div key={apt.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                    <InitialsAvatar name={apt.patient.name} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{apt.patient.name}</p>
                      <p className="text-xs text-gray-400 truncate">{apt.treatment}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-semibold text-gray-600 capitalize">{getRelativeDay(apt.date)}</p>
                      <p className="text-xs text-gray-400">{formatTime(apt.date)}</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Modal completar (con pregunta de cobro) */}
      {completingApt && (
        <CompleteAppointmentModal
          appointment={completingApt}
          onClose={() => setCompletingApt(null)}
          onCompleted={(apt) => { setCompletingApt(null); if (onUpdated) onUpdated(apt); }}
        />
      )}

      {/* Modal cobrar directo (cita ya completada, solo registrar pago) */}
      {cobrandoApt && (
        <CompleteAppointmentModal
          appointment={cobrandoApt}
          skipAsk
          onClose={() => setCobrandoApt(null)}
          onCompleted={(apt) => { setCobrandoApt(null); if (onUpdated) onUpdated(apt); }}
        />
      )}
    </>
  );
}