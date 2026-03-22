"use client";

import { Chip } from "@heroui/react";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Básico",
    price: "S/ 59",
    period: "/mes",
    description: "Para dentistas que trabajan solos",
    features: [
      "Hasta 100 citas al mes",
      "Gestión de pacientes",
      "Recordatorios automáticos",
      "Dashboard básico",
      "Soporte por email",
    ],
    cta: "Comenzar prueba gratis",
    highlighted: false,
  },
  {
    name: "Profesional",
    price: "S/ 99",
    period: "/mes",
    description: "Para clínicas con hasta 3 dentistas",
    features: [
      "Citas ilimitadas",
      "Hasta 3 dentistas",
      "Todo lo del plan Básico",
      "Exportación CSV",
      "Reportes avanzados",
      "Soporte prioritario",
    ],
    cta: "Comenzar prueba gratis",
    badge: "14 días gratis · Más popular",
    highlighted: true,
  },
  {
    name: "Clínica",
    price: "S/ 179",
    period: "/mes",
    description: "Para clínicas con múltiples sedes",
    features: [
      "Todo lo del plan Profesional",
      "Multi-sede",
      "Reportes avanzados",
      "API de integración",
      "Onboarding personalizado",
      "Soporte 24/7",
    ],
    cta: "Contactar ventas",
    highlighted: false,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Planes y precios</h2>
          <p className="text-gray-500 text-lg">Sin permanencia. Cancela cuando quieras.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-6 border transition-all ${
                plan.highlighted
                  ? "border-primary-300 bg-primary-50 shadow-lg shadow-primary-100 scale-105"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
              }`}
            >
              {plan.badge && (
                <div className="mb-4">
                  <span className="inline-block bg-primary-100 text-primary-700 text-xs font-medium px-3 py-1 rounded-full">
                    {plan.badge}
                  </span>
                </div>
              )}

              <h3 className="text-lg font-bold text-gray-900 mb-1">{plan.name}</h3>
              <p className="text-xs text-gray-400 mb-4">{plan.description}</p>

              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-3xl font-black text-gray-900">{plan.price}</span>
                <span className="text-sm text-gray-400">{plan.period}</span>
              </div>

              <button
                onClick={() => alert("Integración con Culqi próximamente")}
                className={`w-full py-2.5 px-4 rounded-xl font-semibold text-sm transition-all mb-6 ${
                  plan.highlighted
                    ? "bg-primary-500 hover:bg-primary-600 text-white shadow-md"
                    : "bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 hover:border-gray-300"
                }`}
              >
                {plan.cta}
              </button>

              <ul className="space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-primary-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          Precios en Soles peruanos (PEN). IGV incluido. Pagos procesados por Culqi.
        </p>
      </div>
    </section>
  );
}