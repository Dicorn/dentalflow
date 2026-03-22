import { PrismaClient } from "@prisma/client";
import { auth } from "../lib/auth";

const prisma = new PrismaClient();

// ── Helpers ────────────────────────────────────────────────
function daysFromNow(days: number, hour = 9, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Main ───────────────────────────────────────────────────
async function main() {
  console.log("🧹 Limpiando base de datos...");

  // Limpiar en orden por FK constraints
  await prisma.reminderLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.treatment.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  console.log("✅ Base de datos limpia");

  // ── Usuario demo ───────────────────────────────────────────
  console.log("👤 Creando usuario demo...");

  await auth.api.signUpEmail({
    body: {
      name: "Dr. María González",
      email: "demo@dental.com",
      password: "demo1234",
    },
  });

  const user = await prisma.user.update({
    where: { email: "demo@dental.com" },
    data: {
      clinicName: "Clínica Dental Sonrisa",
      clinicPhone: "+51 999 123 456",
      clinicAddress: "Av. Javier Prado 1234, San Isidro, Lima",
      plan: "PROFESSIONAL",
      planActive: true,
      role: "DENTIST",
    },
  });

  console.log("✅ Usuario:", user.email);

  // ── Catálogo de tratamientos ───────────────────────────────
  console.log("🦷 Creando catálogo de tratamientos...");

  const treatmentsData = [
    { name: "Limpieza dental", price: 120, durationMinutes: 60, color: "#14b897" },
    { name: "Extracción simple", price: 180, durationMinutes: 45, color: "#3b82f6" },
    { name: "Extracción de muela", price: 280, durationMinutes: 60, color: "#6366f1" },
    { name: "Control de ortodoncia", price: 80, durationMinutes: 30, color: "#8b5cf6" },
    { name: "Instalación de brackets", price: 1800, durationMinutes: 120, color: "#ec4899" },
    { name: "Blanqueamiento dental", price: 350, durationMinutes: 90, color: "#f59e0b" },
    { name: "Endodoncia", price: 450, durationMinutes: 120, color: "#ef4444" },
    { name: "Obturación / Empaste", price: 150, durationMinutes: 45, color: "#10b981" },
    { name: "Radiografía dental", price: 50, durationMinutes: 15, color: "#06b6d4" },
    { name: "Consulta / Evaluación", price: 60, durationMinutes: 30, color: "#64748b" },
    { name: "Corona dental", price: 900, durationMinutes: 90, color: "#d97706" },
    { name: "Implante dental", price: 2500, durationMinutes: 120, color: "#dc2626" },
  ];

  const treatments = await Promise.all(
    treatmentsData.map((t) =>
      prisma.treatment.create({
        data: { userId: user.id, ...t, active: true },
      })
    )
  );

  const getTreatment = (name: string) =>
    treatments.find((t) => t.name === name)!;

  console.log(`✅ ${treatments.length} tratamientos creados`);

  // ── 15 Pacientes ───────────────────────────────────────────
  console.log("👥 Creando 15 pacientes...");

  const patientsData = [
    {
      name: "Carlos Ramírez",
      phone: "+51 987 654 321",
      email: "carlos@example.com",
      birthDate: new Date("1985-03-15"),
      gender: "MALE" as const,
      notes: "Sensibilidad dental alta en molares superiores",
      medicalHistory: JSON.stringify([
        { id: "1", date: new Date("2024-01-10").toISOString(), description: "Limpieza dental completa. Sin caries detectadas." },
        { id: "2", date: new Date("2024-06-20").toISOString(), description: "Extracción muela del juicio superior derecha. Sin complicaciones." },
      ]),
    },
    {
      name: "Ana Torres",
      phone: "+51 976 543 210",
      email: "ana@example.com",
      birthDate: new Date("1992-07-22"),
      gender: "FEMALE" as const,
      notes: "Tratamiento de ortodoncia en curso desde 2023",
      medicalHistory: JSON.stringify([
        { id: "1", date: new Date("2023-11-05").toISOString(), description: "Inicio de tratamiento de ortodoncia. Brackets metálicos instalados." },
        { id: "2", date: new Date("2024-02-15").toISOString(), description: "Control mensual. Ajuste de arco superior." },
        { id: "3", date: new Date("2024-08-10").toISOString(), description: "Control bimestral. Progreso satisfactorio." },
      ]),
    },
    {
      name: "Roberto Silva",
      phone: "+51 965 432 109",
      email: "roberto@example.com",
      birthDate: new Date("1978-11-30"),
      gender: "MALE" as const,
      notes: "Hipertenso. Verificar presión arterial antes de anestesia",
      medicalHistory: JSON.stringify([
        { id: "1", date: new Date("2024-03-12").toISOString(), description: "Endodoncia molar inferior izquierdo. Procedimiento en 2 sesiones." },
      ]),
    },
    {
      name: "Lucía Mendoza",
      phone: "+51 954 321 098",
      email: "lucia@example.com",
      birthDate: new Date("1995-04-08"),
      gender: "FEMALE" as const,
      notes: "Alergia a la penicilina",
      medicalHistory: JSON.stringify([]),
    },
    {
      name: "Miguel Ángel Flores",
      phone: "+51 943 210 987",
      email: "miguel@example.com",
      birthDate: new Date("1988-09-14"),
      gender: "MALE" as const,
      notes: "Paciente ansioso, requiere más tiempo de explicación",
      medicalHistory: JSON.stringify([
        { id: "1", date: new Date("2024-05-20").toISOString(), description: "Blanqueamiento dental. Resultado satisfactorio 3 tonos más claro." },
      ]),
    },
    {
      name: "Patricia Vega",
      phone: "+51 932 109 876",
      email: "patricia@example.com",
      birthDate: new Date("1970-12-03"),
      gender: "FEMALE" as const,
      notes: "Diabetes tipo 2. Cicatrización más lenta",
      medicalHistory: JSON.stringify([
        { id: "1", date: new Date("2023-09-01").toISOString(), description: "Implante dental inferior derecho. Exitoso." },
        { id: "2", date: new Date("2024-01-15").toISOString(), description: "Corona sobre implante. Finalizado." },
      ]),
    },
    {
      name: "Diego Paredes",
      phone: "+51 921 098 765",
      email: "diego@example.com",
      birthDate: new Date("2001-06-18"),
      gender: "MALE" as const,
      notes: "Estudiante universitario. Prefiere citas en la tarde",
      medicalHistory: JSON.stringify([]),
    },
    {
      name: "Sofía Herrera",
      phone: "+51 910 987 654",
      email: "sofia@example.com",
      birthDate: new Date("1998-02-25"),
      gender: "FEMALE" as const,
      notes: null,
      medicalHistory: JSON.stringify([
        { id: "1", date: new Date("2024-07-30").toISOString(), description: "2 obturaciones en premolares. Sin complicaciones." },
      ]),
    },
    {
      name: "Jorge Castillo",
      phone: "+51 999 876 543",
      email: "jorge@example.com",
      birthDate: new Date("1965-08-11"),
      gender: "MALE" as const,
      notes: "Cardiopatía. Requiere premedicación antibiótica",
      medicalHistory: JSON.stringify([
        { id: "1", date: new Date("2024-04-05").toISOString(), description: "Limpieza profunda periodontal. Derivado a periodoncista." },
      ]),
    },
    {
      name: "Valentina Ríos",
      phone: "+51 988 765 432",
      email: "valentina@example.com",
      birthDate: new Date("2005-10-19"),
      gender: "FEMALE" as const,
      notes: "Menor de edad. Asiste con la madre",
      medicalHistory: JSON.stringify([]),
    },
    {
      name: "Fernando Chávez",
      phone: "+51 977 654 321",
      email: "fernando@example.com",
      birthDate: new Date("1982-01-07"),
      gender: "MALE" as const,
      notes: "Bruxismo severo. Uso de férula nocturna",
      medicalHistory: JSON.stringify([
        { id: "1", date: new Date("2024-02-20").toISOString(), description: "Consulta y diagnóstico de bruxismo. Elaboración de férula." },
        { id: "2", date: new Date("2024-09-10").toISOString(), description: "Control. Desgaste moderado de la férula, reemplazar en 6 meses." },
      ]),
    },
    {
      name: "Isabella Morales",
      phone: "+51 966 543 210",
      email: "isabella@example.com",
      birthDate: new Date("1993-05-30"),
      gender: "FEMALE" as const,
      notes: "Embarazada (7 meses). Evitar radiografías",
      medicalHistory: JSON.stringify([]),
    },
    {
      name: "Andrés Romero",
      phone: "+51 955 432 109",
      email: "andres@example.com",
      birthDate: new Date("1975-03-22"),
      gender: "MALE" as const,
      notes: null,
      medicalHistory: JSON.stringify([
        { id: "1", date: new Date("2024-06-01").toISOString(), description: "Extracción de 2 piezas con caries avanzada." },
      ]),
    },
    {
      name: "Camila Díaz",
      phone: "+51 944 321 098",
      email: "camila@example.com",
      birthDate: new Date("1990-11-15"),
      gender: "FEMALE" as const,
      notes: "Fobia al dentista. Necesita mucha paciencia",
      medicalHistory: JSON.stringify([]),
    },
    {
      name: "Sebastián Vargas",
      phone: "+51 933 210 987",
      email: "sebastian@example.com",
      birthDate: new Date("1987-07-04"),
      gender: "MALE" as const,
      notes: null,
      medicalHistory: JSON.stringify([
        { id: "1", date: new Date("2024-08-15").toISOString(), description: "Evaluación completa. Plan de tratamiento: 3 obturaciones + limpieza." },
      ]),
    },
  ];

  const patients = await Promise.all(
    patientsData.map((p) => prisma.patient.create({ data: { userId: user.id, ...p } }))
  );

  console.log(`✅ ${patients.length} pacientes creados`);

  // ── Citas ──────────────────────────────────────────────────
  console.log("📅 Creando citas...");

  const appointmentsData = [
    // HOY
    {
      patient: patients[0], // Carlos
      treatment: getTreatment("Limpieza dental"),
      daysOffset: 0, hour: 9, duration: 60,
      status: "CONFIRMED" as const,
      notes: "Paciente requiere anestesia tópica previa",
    },
    {
      patient: patients[1], // Ana
      treatment: getTreatment("Control de ortodoncia"),
      daysOffset: 0, hour: 11, duration: 30,
      status: "SCHEDULED" as const,
      notes: null,
    },
    {
      patient: patients[7], // Sofía
      treatment: getTreatment("Consulta / Evaluación"),
      daysOffset: 0, hour: 14, duration: 30,
      status: "SCHEDULED" as const,
      notes: "Primera visita",
    },
    // MAÑANA
    {
      patient: patients[2], // Roberto
      treatment: getTreatment("Extracción de muela"),
      daysOffset: 1, hour: 10, duration: 60,
      status: "CONFIRMED" as const,
      notes: "Verificar presión arterial antes del procedimiento",
    },
    {
      patient: patients[5], // Patricia
      treatment: getTreatment("Radiografía dental"),
      daysOffset: 1, hour: 12, duration: 15,
      status: "SCHEDULED" as const,
      notes: null,
    },
    // PASADO MAÑANA
    {
      patient: patients[3], // Lucía
      treatment: getTreatment("Obturación / Empaste"),
      daysOffset: 2, hour: 9, duration: 45,
      status: "SCHEDULED" as const,
      notes: "Alergia a penicilina - usar alternativa",
    },
    {
      patient: patients[4], // Miguel
      treatment: getTreatment("Blanqueamiento dental"),
      daysOffset: 2, hour: 15, duration: 90,
      status: "SCHEDULED" as const,
      notes: null,
    },
    // EN 3 DÍAS
    {
      patient: patients[6], // Diego
      treatment: getTreatment("Limpieza dental"),
      daysOffset: 3, hour: 16, duration: 60,
      status: "SCHEDULED" as const,
      notes: null,
    },
    {
      patient: patients[10], // Fernando
      treatment: getTreatment("Consulta / Evaluación"),
      daysOffset: 3, hour: 10, duration: 30,
      status: "SCHEDULED" as const,
      notes: "Control de bruxismo",
    },
    // EN 5 DÍAS
    {
      patient: patients[8], // Jorge
      treatment: getTreatment("Limpieza dental"),
      daysOffset: 5, hour: 11, duration: 60,
      status: "SCHEDULED" as const,
      notes: "Premedicación antibiótica requerida",
    },
    {
      patient: patients[14], // Sebastián
      treatment: getTreatment("Obturación / Empaste"),
      daysOffset: 5, hour: 14, duration: 45,
      status: "SCHEDULED" as const,
      notes: null,
    },
    // PASADAS — COMPLETADAS
    {
      patient: patients[1], // Ana
      treatment: getTreatment("Control de ortodoncia"),
      daysOffset: -7, hour: 10, duration: 30,
      status: "COMPLETED" as const,
      notes: null,
    },
    {
      patient: patients[5], // Patricia
      treatment: getTreatment("Corona dental"),
      daysOffset: -14, hour: 9, duration: 90,
      status: "COMPLETED" as const,
      notes: "Finalización de corona sobre implante",
    },
    {
      patient: patients[0], // Carlos
      treatment: getTreatment("Radiografía dental"),
      daysOffset: -10, hour: 8, duration: 15,
      status: "COMPLETED" as const,
      notes: null,
    },
    // PASADAS — CANCELADAS / NO SHOW
    {
      patient: patients[13], // Camila
      treatment: getTreatment("Consulta / Evaluación"),
      daysOffset: -5, hour: 15, duration: 30,
      status: "NO_SHOW" as const,
      notes: "No respondió recordatorio",
    },
    {
      patient: patients[12], // Andrés
      treatment: getTreatment("Limpieza dental"),
      daysOffset: -3, hour: 11, duration: 60,
      status: "CANCELLED" as const,
      notes: "Canceló por viaje de trabajo",
    },
  ];

  const createdAppointments = await Promise.all(
    appointmentsData.map((a) =>
      prisma.appointment.create({
        data: {
          userId: user.id,
          patientId: a.patient.id,
          date: daysFromNow(a.daysOffset, a.hour),
          duration: a.duration,
          treatment: a.treatment.name,
          treatmentPrice: Number(a.treatment.price),
          status: a.status,
          notes: a.notes,
          reminderSent: a.daysOffset < 0,
          reminderSentAt: a.daysOffset < 0 ? daysFromNow(a.daysOffset - 1, a.hour) : null,
        },
        include: { patient: true },
      })
    )
  );

  console.log(`✅ ${createdAppointments.length} citas creadas`);

  // ── Pagos ──────────────────────────────────────────────────
  console.log("💰 Creando pagos...");

  const paymentsData = createdAppointments.map((apt) => {
    let status: "PENDING" | "PAID" | "CANCELLED";
    let paidAt: Date | null = null;

    if (apt.status === "COMPLETED") {
      // Las completadas tienen 70% de probabilidad de estar pagadas
      const paid = Math.random() > 0.3;
      status = paid ? "PAID" : "PENDING";
      paidAt = paid ? new Date(apt.date) : null;
    } else if (apt.status === "CANCELLED") {
      status = "CANCELLED";
    } else {
      status = "PENDING";
    }

    return {
      userId: user.id,
      patientId: apt.patientId,
      appointmentId: apt.id,
      treatment: apt.treatment,
      amount: apt.treatmentPrice ?? 0,
      status,
      method: randomItem(["CASH", "CARD", "TRANSFER"] as const),
      paidAt,
    };
  });

  await prisma.payment.createMany({ data: paymentsData });

  const paymentCount = await prisma.payment.count({ where: { userId: user.id } });
  console.log(`✅ ${paymentCount} pagos creados`);

  // ── Recordatorio simulado ──────────────────────────────────
  console.log("🔔 Creando recordatorios...");

  const completedApts = createdAppointments.filter((a) => a.status === "COMPLETED");
  if (completedApts.length > 0) {
    await prisma.reminderLog.createMany({
      data: completedApts.slice(0, 3).map((apt) => ({
        userId: user.id,
        appointmentId: apt.id,
        channel: "WHATSAPP" as const,
        recipientPhone: apt.patient.phone,
        message: `Hola ${apt.patient.name}, le recordamos su cita en Clínica Dental Sonrisa. Por favor confirme su asistencia.`,
        status: "SIMULATED" as const,
        scheduledFor: new Date(apt.date.getTime() - 24 * 60 * 60 * 1000),
        sentAt: new Date(apt.date.getTime() - 24 * 60 * 60 * 1000),
      })),
    });
  }

  console.log("✅ Recordatorios creados");

  // ── Resumen ────────────────────────────────────────────────
  const [totalPatients, totalApts, totalPayments, totalPaid] = await Promise.all([
    prisma.patient.count({ where: { userId: user.id } }),
    prisma.appointment.count({ where: { userId: user.id } }),
    prisma.payment.count({ where: { userId: user.id } }),
    prisma.payment.aggregate({
      where: { userId: user.id, status: "PAID" },
      _sum: { amount: true },
    }),
  ]);

  console.log("\n🎉 Seed completado!");
  console.log("─────────────────────────────");
  console.log(`   Email:      demo@dental.com`);
  console.log(`   Contraseña: demo1234`);
  console.log("─────────────────────────────");
  console.log(`   👥 Pacientes:    ${totalPatients}`);
  console.log(`   📅 Citas:        ${totalApts}`);
  console.log(`   💰 Pagos:        ${totalPayments}`);
  console.log(`   ✅ Total cobrado: S/ ${Number(totalPaid._sum.amount ?? 0).toFixed(2)}`);
  console.log(`   🦷 Tratamientos: ${treatments.length}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());