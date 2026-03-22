"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, User, Shield, Bell, CheckCircle } from "lucide-react";
import { settingsSchema, type SettingsFormData } from "@/lib/validations";
import { FieldInput } from "@/components/ui/FieldComponents";
import { TreatmentCatalog } from "@/components/modules/settings/TreatmentCatalog";
import { AuditLog } from "@/components/modules/settings/AuditLog";
import type { AppUser } from "@/types";

const planColors: Record<string, string> = {
  BASIC: "bg-gray-100 text-gray-600",
  PROFESSIONAL: "bg-primary-100 text-primary-700",
  CLINIC: "bg-emerald-100 text-emerald-700",
};
const planLabels: Record<string, string> = {
  BASIC: "Básico",
  PROFESSIONAL: "Profesional",
  CLINIC: "Clínica",
};

interface Props {
  user: AppUser;
}

export function SettingsForm({ user }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: user.name ?? "",
      clinicName: user.clinicName ?? "",
      clinicPhone: user.clinicPhone ?? "",
      clinicAddress: user.clinicAddress ?? "",
    },
  });

  const onSubmit = async (data: SettingsFormData) => {
    setIsLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setMessage({ type: "success", text: "Configuración guardada" });
        setTimeout(() => setMessage(null), 3000);
      } else {
        const err = await res.json();
        setMessage({ type: "error", text: err.error ?? "Error al guardar" });
      }
    } catch {
      setMessage({ type: "error", text: "Error de conexión" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* ── Bento grid principal ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 auto-rows-auto">

        {/* ① Recordatorios — col 1-2, row 1 (card grande) */}
        <div className="lg:col-span-2 lg:col-start-1 lg:row-start-1">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 h-full">
            <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Bell className="w-4 h-4 text-gray-400" />
              Recordatorios
            </h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs font-medium text-gray-700">WhatsApp / SMS</p>
                  <p className="text-xs text-gray-400">24h antes de cada cita</p>
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-amber-100 text-amber-700 shrink-0">
                  Simulado
                </span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Para activar envío real, configura Twilio en variables de entorno.
              </p>
            </div>
          </div>
        </div>

        {/* ② Plan/cuenta — col 3, row 1 (card pequeña) */}
        <div className="lg:col-start-3 lg:row-start-1">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 h-full flex flex-col">
            {/* Top: icono + nombre + plan badge */}
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4 text-primary-600" />
                </div>
                <p className="text-sm font-semibold text-gray-900">Plan actual</p>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg shrink-0 ${planColors[user.plan] ?? "bg-gray-100 text-gray-600"}`}>
                {planLabels[user.plan] ?? user.plan}
              </span>
            </div>

            {/* Email */}
            <p className="text-xs text-gray-400 ml-[42px] mb-4 truncate">{user.email}</p>

            {/* Bottom: estado + acción */}
            <div className="flex items-center justify-between mt-auto">
              {user.planActive ? (
                <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Activo
                </span>
              ) : <span />}
              <button className="text-xs font-medium px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                Cambiar plan
              </button>
            </div>
          </div>
        </div>

        {/* ③ Perfil + clínica — col 1, row 2 */}
        <div className="lg:col-start-1 lg:row-start-2 h-[550px]">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 h-full overflow-y-auto">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 h-full flex flex-col">
              <div>
                <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  Dentista
                </h2>
                <FieldInput
                  {...register("name")}
                  label="Nombre completo"
                  placeholder="Dr. Juan Pérez"
                  error={errors.name?.message}
                />
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-3">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  Clínica
                </h3>
                <FieldInput
                  {...register("clinicName")}
                  label="Nombre"
                  placeholder="Clínica Dental Sonrisa"
                />
                <FieldInput
                  {...register("clinicPhone")}
                  label="Teléfono"
                  placeholder="+51 999 123 456"
                />
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-600">RUC (opcional)</label>
                  <input
                    type="text"
                    placeholder="20123456789"
                    className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 placeholder:text-gray-400"
                  />
                </div>
                <FieldInput
                  {...register("clinicAddress")}
                  label="Dirección"
                  placeholder="Av. Principal 123, Lima"
                />
              </div>

              <div className="mt-auto pt-2 space-y-3">
                {message && (
                  <div className={`rounded-lg p-3 text-sm flex items-center gap-2 ${
                    message.type === "success"
                      ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                      : "bg-red-50 border border-red-200 text-red-700"
                  }`}>
                    {message.type === "success" && <CheckCircle className="w-4 h-4 shrink-0" />}
                    {message.text}
                  </div>
                )}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary-500 hover:bg-primary-600 text-white transition-colors disabled:opacity-50"
                  >
                    {isLoading ? "Guardando..." : "Guardar cambios"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* ④ Catálogo bento — col 2-3, row 2 */}
        <div className="lg:col-span-2 lg:col-start-2 lg:row-start-2 h-[550px]">
          <TreatmentCatalog />
        </div>

        {/* ⑤ Registro de actividad — full width, row 3 */}
        <div className="lg:col-span-3 lg:row-start-3">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <AuditLog />
          </div>
        </div>

      </div>
    </div>
  );
}
