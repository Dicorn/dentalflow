"use client";

import { Calendar, Users, CreditCard, Bell, BarChart3, Shield } from "lucide-react";

const features = [
  { icon: Calendar, title: "Calendario visual", description: "Vista semanal y mensual. Arrastra citas, asigna horarios y visualiza tu agenda de un vistazo." },
  { icon: Users, title: "Gestión de pacientes", description: "Ficha completa con historial médico, tratamientos anteriores y datos de contacto." },
  { icon: CreditCard, title: "Control de pagos", description: "Registra cobros, exporta reportes en CSV y lleva el control de cobros pendientes." },
  { icon: Bell, title: "Recordatorios automáticos", description: "Envía recordatorios por WhatsApp o SMS automáticamente 24 horas antes de cada cita." },
  { icon: BarChart3, title: "Dashboard con métricas", description: "Ingresos del mes, tasa de completado, citas por semana y más en tiempo real." },
  { icon: Shield, title: "Seguro y confiable", description: "Tus datos y los de tus pacientes protegidos con cifrado en reposo y en tránsito." },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Todo lo que necesitas</h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Herramientas pensadas para dentistas que trabajan solos o con equipos pequeños.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="p-6 rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-sm transition-all group">
              <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-100 transition-colors">
                <f.icon className="w-5 h-5 text-primary-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
