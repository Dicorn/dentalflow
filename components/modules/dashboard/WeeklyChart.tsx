"use client";

import { Card, CardBody } from "@heroui/react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Props {
  data: { day: string; count: number }[];
}

export function WeeklyChart({ data }: Props) {
  return (
    <Card className="border border-gray-100 shadow-sm h-full">
      <CardBody className="p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Citas por día</h3>
          <p className="text-xs text-gray-400">Esta semana</p>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              formatter={(value) => [Number(value), "Citas"]}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
            />
            <Bar dataKey="count" fill="#14b897" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
}
