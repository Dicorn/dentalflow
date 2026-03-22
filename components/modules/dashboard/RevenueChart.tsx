"use client";

import { Card, CardBody } from "@heroui/react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface Props {
  data: { month: string; revenue: number }[];
}

export function RevenueChart({ data }: Props) {
  return (
    <Card className="border border-gray-100 shadow-sm">
      <CardBody className="p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Ingresos mensuales</h3>
          <p className="text-xs text-gray-400">Últimos 6 meses</p>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#14b897" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#14b897" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `S/${v}`}
            />
            <Tooltip
              formatter={(value) => [formatCurrency(Number(value)), "Ingresos"]}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#14b897"
              strokeWidth={2}
              fill="url(#revenueGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
}
