import type { Metadata } from "next";
import { CalendarPageClient } from "@/components/modules/calendar/CalendarPageClient";

export const metadata: Metadata = { title: "Calendario" };

export default function CalendarPage() {
  return <CalendarPageClient />;
}
