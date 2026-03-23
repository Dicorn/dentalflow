"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CalendarCheck, Users, Bell } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-white pt-20 pb-24">
      {/* Nav */}
      <nav className="absolute top-0 left-0 right-0 flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
              <path d="M12 2C8.5 2 6 4.5 6 7c0 1.5.5 2.8 1.4 3.8L6 20h2l.8-4h6.4l.8 4h2L16.6 10.8C17.5 9.8 18 8.5 18 7c0-2.5-2.5-5-6-5z" />
            </svg>
          </div>
          <span className="text-lg font-bold text-gray-900">DentalFlow</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Iniciar sesión
          </Link>
          <Link
            href="#pricing"
            className="text-sm font-semibold bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            Ver planes
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
          <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse" />
          Diseñado para clínicas dentales en Perú y LATAM
        </div>

        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
          Gestiona tu clínica dental{" "}
          <span className="text-primary-500">sin complicaciones</span>
        </h1>

        <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-10">
          Agenda citas, gestiona pacientes y envía recordatorios automáticos por WhatsApp.
          Todo en un solo lugar, pensado para dentistas que trabajan solos o con un equipo pequeño.
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap mb-16">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors shadow-lg shadow-primary-200"
          >
            Comenzar gratis — 14 días
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="#features"
            className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-medium px-6 py-3 rounded-xl transition-colors border border-gray-200 hover:border-gray-300"
          >
            Ver cómo funciona
          </Link>
        </div>

        {/* Feature pills */}
        <div className="flex items-center justify-center gap-6 flex-wrap text-sm text-gray-500">
          {[
            { icon: CalendarCheck, text: "Calendario visual" },
            { icon: Users, text: "Historial de pacientes" },
            { icon: Bell, text: "Recordatorios WhatsApp" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2">
              <Icon className="w-4 h-4 text-primary-500" />
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* App screenshot */}
      <div className="max-w-5xl mx-auto px-6 mt-16">
        <div className="rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
          <Image
            src="/denta_dashboard.jpg"
            alt="Vista previa del dashboard de DentalFlow"
            width={1280}
            height={720}
            className="w-full h-auto"
            priority
          />
        </div>
      </div>
    </section>
  );
}