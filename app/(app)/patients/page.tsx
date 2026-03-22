import type { Metadata } from "next";
import { PatientsPageClient } from "@/components/modules/patients/PatientsPageClient";

export const metadata: Metadata = { title: "Pacientes" };

export default function PatientsPage() {
  return <PatientsPageClient />;
}
