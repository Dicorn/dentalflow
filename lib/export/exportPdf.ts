import type { Patient, PaymentWithRelations } from "@/types";

type PatientWithCount = Patient & {
  _count: { appointments: number; payments: number };
  pendingDebt: number;
};

export async function exportPatientsPdf(patients: PatientWithCount[], clinicName?: string) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF();
  const date = new Date().toLocaleDateString("es-PE");

  doc.setFontSize(16);
  doc.setTextColor(99, 102, 241);
  doc.text(clinicName ?? "DentalFlow", 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Lista de pacientes — ${date}`, 14, 26);

  autoTable(doc, {
    startY: 32,
    head: [["Nombre", "Teléfono", "Email", "Citas", "Deuda (S/)"]],
    body: patients.map((p) => [
      p.name,
      p.phone,
      p.email ?? "—",
      String(p._count.appointments),
      p.pendingDebt.toFixed(2),
    ]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 248, 255] },
  });

  doc.save(`pacientes-${new Date().toISOString().split("T")[0]}.pdf`);
}

export async function exportPaymentsPdf(payments: PaymentWithRelations[], clinicName?: string) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF();
  const date = new Date().toLocaleDateString("es-PE");
  const total = payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  doc.setFontSize(16);
  doc.setTextColor(99, 102, 241);
  doc.text(clinicName ?? "DentalFlow", 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Registro de pagos — ${date}`, 14, 26);
  doc.text(`Total cobrado: S/ ${total.toFixed(2)}`, 14, 33);

  autoTable(doc, {
    startY: 39,
    head: [["Paciente", "Tratamiento", "Monto (S/)", "Estado", "Método", "Fecha Pago"]],
    body: payments.map((p) => [
      p.patient.name,
      p.treatment,
      Number(p.amount).toFixed(2),
      p.status,
      p.method,
      p.paidAt ? new Date(p.paidAt).toLocaleDateString("es-PE") : "—",
    ]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 248, 255] },
  });

  doc.save(`pagos-${new Date().toISOString().split("T")[0]}.pdf`);
}
