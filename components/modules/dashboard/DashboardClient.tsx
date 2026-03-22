"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { StatsCards } from "./StatsCards";
import { TodayAppointments } from "./TodayAppointments";
import { RevenueChart } from "./RevenueChart";
import { WeeklyChart } from "./WeeklyChart";
import type { DashboardStats, AppointmentWithPatient } from "@/types";

export function DashboardClient() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ["dashboard"],
    queryFn: () => fetch("/api/dashboard").then((r) => r.json()),
  });

  const handleAppointmentUpdated = (updated: AppointmentWithPatient) => {
    queryClient.setQueryData<DashboardStats>(["dashboard"], (old) => {
      if (!old) return old;
      return {
        ...old,
        todayAppointmentsList: old.todayAppointmentsList.map((a) =>
          a.id === updated.id ? { ...a, ...updated } : a
        ),
        upcomingAppointments: old.upcomingAppointments.map((a) =>
          a.id === updated.id ? { ...a, ...updated } : a
        ),
      };
    });
    queryClient.removeQueries({ queryKey: ["payments"] });
    queryClient.removeQueries({ queryKey: ["patients"] });
    queryClient.invalidateQueries({ queryKey: ["appointments"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
        Error al cargar el dashboard
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <StatsCards data={data} />

      <TodayAppointments
        todayList={data.todayAppointmentsList}
        upcomingList={data.upcomingAppointments}
        pendingPaymentIds={data.pendingPaymentAppointmentIds}
        onUpdated={handleAppointmentUpdated}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart data={data.monthlyRevenue} />
        </div>
        <div>
          <WeeklyChart data={data.weeklyAppointments} />
        </div>
      </div>
    </div>
  );
}