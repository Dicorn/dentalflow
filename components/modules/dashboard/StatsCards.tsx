"use client";

import { Card, CardBody } from "@heroui/react";
import { Calendar, Users, TrendingUp, CreditCard, Clock, CheckCircle, ArrowUp, ArrowDown, UserX, AlertCircle, UserMinus } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { DashboardStats } from "@/types";

interface Props { data: DashboardStats }

export function StatsCards({ data }: Props) {
  const stats = [
    {
      label: "Citas hoy",
      value: data.todayAppointments,
      icon: Calendar,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Ingresos del mes",
      value: formatCurrency(data.monthRevenue),
      icon: TrendingUp,
      color: "text-primary-600",
      bg: "bg-primary-50",
      change: data.revenueChange,
      changeLabel: "vs mes anterior",
    },
    {
      label: "Cobros pendientes",
      value: data.pendingPayments,
      icon: CreditCard,
      color: "text-amber-600",
      bg: "bg-amber-50",
      // Si hay cobros de citas ya completadas, mostrar alerta
      alert: data.totalPendingFromCompleted > 0
        ? `${formatCurrency(data.totalPendingFromCompleted)} de citas completadas`
        : undefined,
    },
    {
      label: "Total pacientes",
      value: data.totalPatients,
      icon: Users,
      color: "text-cyan-600",
      bg: "bg-cyan-50",
      change: data.patientsChange,
      changeLabel: "nuevos este mes",
      changeIsAbsolute: true,
    },
    {
      label: "Tasa de completado",
      value: `${data.completionRate}%`,
      icon: CheckCircle,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "No asistieron",
      value: `${data.noShowRate}%`,
      icon: UserX,
      color: data.noShowRate > 20 ? "text-red-600" : "text-gray-500",
      bg: data.noShowRate > 20 ? "bg-red-50" : "bg-gray-50",
      subtitle: "este mes",
      alert: data.inactivePatients > 0
        ? `${data.inactivePatients} paciente${data.inactivePatients !== 1 ? "s" : ""} sin visita en 90 días`
        : undefined,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <CardBody className="p-4">
            <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
              <stat.icon className={`w-4.5 h-4.5 ${stat.color}`} size={18} />
            </div>
            <p className="text-2xl font-bold text-gray-900 leading-none mb-1">{stat.value}</p>
            <p className="text-xs text-gray-500 font-medium leading-tight">{stat.label}</p>
            {stat.subtitle && <p className="text-xs text-gray-400">{stat.subtitle}</p>}

            {/* % cambio vs mes anterior */}
            {stat.change !== null && stat.change !== undefined && (
              <div className={`flex items-center gap-0.5 mt-1.5 text-xs font-medium ${stat.change > 0 ? "text-emerald-600" : stat.change < 0 ? "text-red-500" : "text-gray-400"
                }`}>
                {stat.change > 0 ? <ArrowUp className="w-3 h-3" /> : stat.change < 0 ? <ArrowDown className="w-3 h-3" /> : null}
                <span>
                  {stat.changeIsAbsolute
                    ? `+${stat.change} ${stat.changeLabel}`
                    : `${stat.change > 0 ? "+" : ""}${stat.change}% ${stat.changeLabel}`}
                </span>
              </div>
            )}

            {/* Alerta contextual */}
            {stat.alert && (
              <div className="flex items-start gap-1 mt-1.5">
                <AlertCircle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                <span className="text-xs text-amber-600 leading-tight">{stat.alert}</span>
              </div>
            )}
          </CardBody>
        </Card>
      ))}
    </div>
  );
}