"use client";

import { Spinner } from "@heroui/react";

export default function CalendarLoading() {
  return (
    <div className="flex items-center justify-center h-64">
      <Spinner size="lg" color="primary" />
    </div>
  );
}
