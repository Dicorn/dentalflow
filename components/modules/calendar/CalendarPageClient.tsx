"use client";

import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarView } from "./CalendarView";
import { AppointmentModal } from "./AppointmentModal";
import { AppointmentDetailModal } from "./AppointmentDetailModal";
import type { AppointmentWithPatient, CalendarEvent } from "@/types";
import { appointmentCalendarColors } from "@/lib/utils";
import { addMinutes } from "date-fns";

interface DateRange { start: string; end: string; }

function getInitialRange(): DateRange {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 7);
  return { start: monday.toISOString(), end: sunday.toISOString() };
}

export function CalendarPageClient() {
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState<DateRange>(getInitialRange);
  const [createModal, setCreateModal] = useState<{
    open: boolean; date?: string; startTime?: string; endTime?: string;
  }>({ open: false });
  const [detailModal, setDetailModal] = useState<{
    open: boolean; appointment?: AppointmentWithPatient;
  }>({ open: false });

  const { data: appointments = [], isFetching } = useQuery<AppointmentWithPatient[]>({
    queryKey: ["appointments", dateRange.start, dateRange.end],
    queryFn: () =>
      fetch(`/api/appointments?start=${dateRange.start}&end=${dateRange.end}`)
        .then((r) => r.json()),
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  const handleDateRangeChange = useCallback((range: DateRange) => {
    // Normalizar siempre a UTC para que React Query use el mismo cache key
    // independientemente del formato que devuelva FullCalendar (ej: -05:00 vs Z)
    setDateRange({
      start: new Date(range.start).toISOString(),
      end: new Date(range.end).toISOString(),
    });
  }, []);

  const events: CalendarEvent[] = appointments.map((apt) => {
    const colors = appointmentCalendarColors[apt.status];
    return {
      id: apt.id,
      title: `${apt.patient.name} — ${apt.treatment}`,
      start: apt.date as unknown as string,
      end: addMinutes(new Date(apt.date), apt.duration).toISOString(),
      backgroundColor: colors.bg,
      borderColor: colors.border,
      textColor: colors.text,
      extendedProps: {
        patientName: apt.patient.name,
        treatment: apt.treatment,
        status: apt.status,
        duration: apt.duration,
        notes: apt.notes,
      },
    };
  });

  const handleSelectSlot = useCallback((info: { startStr: string; endStr: string }) => {
    const startTime = info.startStr.split("T")[1]?.slice(0, 5) ?? "09:00";
    const endTime = info.endStr.split("T")[1]?.slice(0, 5) ?? "10:00";
    const date = info.startStr.split("T")[0];
    setCreateModal({ open: true, date, startTime, endTime });
  }, []);

  const handleEventClick = useCallback((info: { event: { id: string } }) => {
    const apt = appointments.find((a) => a.id === info.event.id);
    if (apt) setDetailModal({ open: true, appointment: apt });
  }, [appointments]);

  // Limpia cache relacionado para forzar fetch fresco al navegar
  const clearRelatedCache = () => {
    queryClient.removeQueries({ queryKey: ["payments"] });
    queryClient.removeQueries({ queryKey: ["patients"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const handleCreated = (apt: AppointmentWithPatient) => {
    queryClient.setQueryData<AppointmentWithPatient[]>(
      ["appointments", dateRange.start, dateRange.end],
      (old = []) => [...old, apt]
    );
    clearRelatedCache();
    setCreateModal({ open: false });
  };

  const handleUpdated = (apt: AppointmentWithPatient) => {
    queryClient.setQueryData<AppointmentWithPatient[]>(
      ["appointments", dateRange.start, dateRange.end],
      (old = []) => old.map((a) => (a.id === apt.id ? apt : a))
    );
    clearRelatedCache();
    setDetailModal({ open: false });
  };

  const handleDeleted = (id: string) => {
    queryClient.setQueryData<AppointmentWithPatient[]>(
      ["appointments", dateRange.start, dateRange.end],
      (old = []) => old.filter((a) => a.id !== id)
    );
    clearRelatedCache();
    setDetailModal({ open: false });
  };

  return (
    <div className="animate-fade-in">
      <CalendarView
        events={events}
        isLoading={isFetching}
        onSelectSlot={handleSelectSlot}
        onEventClick={handleEventClick}
        onNewAppointment={() => setCreateModal({ open: true })}
        onDateRangeChange={handleDateRangeChange}
      />

      {createModal.open && (
        <AppointmentModal
          defaultDate={createModal.date}
          defaultStartTime={createModal.startTime}
          defaultEndTime={createModal.endTime}
          onClose={() => setCreateModal({ open: false })}
          onSaved={handleCreated}
        />
      )}

      {detailModal.open && detailModal.appointment && (
        <AppointmentDetailModal
          appointment={detailModal.appointment}
          onClose={() => setDetailModal({ open: false })}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}