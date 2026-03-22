import type { Metadata } from "next";
import { RemindersPageClient } from "@/components/modules/reminders/RemindersPageClient";

export const metadata: Metadata = { title: "Recordatorios" };

export default function RemindersPage() {
  return <RemindersPageClient />;
}
