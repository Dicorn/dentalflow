"use client";

import { useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Plus, Loader2 } from "lucide-react";
import esLocale from "@fullcalendar/core/locales/es";
import type { CalendarEvent } from "@/types";

interface DateRange {
  start: string; // ISO
  end: string;   // ISO
}

interface Props {
  events: CalendarEvent[];
  isLoading?: boolean;
  onSelectSlot: (info: { startStr: string; endStr: string }) => void;
  onEventClick: (info: { event: { id: string } }) => void;
  onNewAppointment: () => void;
  onDateRangeChange: (range: DateRange) => void;
}

export function CalendarView({
  events,
  isLoading,
  onSelectSlot,
  onEventClick,
  onNewAppointment,
  onDateRangeChange,
}: Props) {
  const calendarRef = useRef<FullCalendar>(null);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-gray-700">Agenda de citas</h2>
          {isLoading && (
            <Loader2 className="w-3.5 h-3.5 text-primary-500 animate-spin" />
          )}
        </div>
        <button
          onClick={onNewAppointment}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-primary-500 hover:bg-primary-600 text-white transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva cita
        </button>
      </div>

      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        locale={esLocale}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        slotMinTime="07:00:00"
        slotMaxTime="21:00:00"
        allDaySlot={false}
        selectable
        selectMirror
        unselectAuto={false}
        select={(info) => {
          onSelectSlot(info);
          calendarRef.current?.getApi().unselect();
        }}
        events={events}
        eventClick={onEventClick}
        height="auto"
        contentHeight={620}
        nowIndicator
        businessHours={{
          daysOfWeek: [1, 2, 3, 4, 5, 6],
          startTime: "08:00",
          endTime: "20:00",
        }}
        slotDuration="00:30:00"
        snapDuration="00:15:00"
        // Dispara cuando el usuario navega o cambia de vista
        datesSet={(info) => {
          onDateRangeChange({
            start: info.startStr,
            end: info.endStr,
          });
        }}
      />
    </div>
  );
}