import type { Patient, PaymentWithRelations } from "@/types";

type PatientWithCount = Patient & {
  _count: { appointments: number; payments: number };
  pendingDebt: number;
};

function buildCsv(headers: string[], rows: string[][]): string {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const header = headers.map(escape).join(",");
  const body = rows.map((row) => row.map(escape).join(",")).join("\n");
  return `${header}\n${body}`;
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportPatientsCsv(patients: PatientWithCount[]) {
  const headers = ["Nombre", "Teléfono", "Email", "Género", "Fecha Nacimiento", "Citas", "Deuda Pendiente (S/)", "Notas"];
  const rows = patients.map((p) => [
    p.name,
    p.phone,
    p.email ?? "",
    p.gender ?? "",
    p.birthDate ? new Date(p.birthDate).toLocaleDateString("es-PE") : "",
    String(p._count.appointments),
    p.pendingDebt.toFixed(2),
    p.notes ?? "",
  ]);
  downloadCsv(buildCsv(headers, rows), `pacientes-${new Date().toISOString().split("T")[0]}.csv`);
}

export function exportPaymentsCsv(payments: PaymentWithRelations[]) {
  const headers = ["Paciente", "Tratamiento", "Monto (S/)", "Estado", "Método", "Fecha Pago", "Notas"];
  const rows = payments.map((p) => [
    p.patient.name,
    p.treatment,
    Number(p.amount).toFixed(2),
    p.status,
    p.method,
    p.paidAt ? new Date(p.paidAt).toLocaleDateString("es-PE") : "",
    p.notes ?? "",
  ]);
  downloadCsv(buildCsv(headers, rows), `pagos-${new Date().toISOString().split("T")[0]}.csv`);
}
