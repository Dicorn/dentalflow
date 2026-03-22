"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { PaymentsList } from "./PaymentsList";
import { PaymentModal } from "./PaymentModal";
import type { PaymentWithRelations } from "@/types";

export function PaymentsPageClient() {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean; payment?: PaymentWithRelations }>({ open: false });

  const { data: payments = [], isLoading } = useQuery<PaymentWithRelations[]>({
    queryKey: ["payments"],
    queryFn: () => fetch("/api/payments-list").then((r) => r.json()),
  });

  const handleCreated = (payment: PaymentWithRelations) => {
    queryClient.setQueryData<PaymentWithRelations[]>(["payments"], (old = []) => [payment, ...old]);
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    setModal({ open: false });
  };

  const handleUpdated = (payment: PaymentWithRelations) => {
    queryClient.setQueryData<PaymentWithRelations[]>(["payments"], (old = []) =>
      old.map((p) => (p.id === payment.id ? payment : p))
    );
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    setModal({ open: false });
  };

  const handleDeleted = (id: string) => {
    queryClient.setQueryData<PaymentWithRelations[]>(["payments"], (old = []) =>
      old.filter((p) => p.id !== id)
    );
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    setModal({ open: false });
  };

  const handleQuickUpdated = (payment: PaymentWithRelations) => {
    queryClient.setQueryData<PaymentWithRelations[]>(["payments"], (old = []) =>
      old.map((p) =>
        p.id === payment.id
          ? { ...payment, createdAt: p.createdAt } // preservar el string de createdAt del cache
          : p
      )
    );
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm font-semibold text-gray-700">
          {payments.length} registro{payments.length !== 1 ? "s" : ""} de pago
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setModal({ open: true })}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-primary-500 hover:bg-primary-600 text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuevo pago
          </button>
        </div>
      </div>

      <PaymentsList
        payments={payments}
        onEdit={(p) => setModal({ open: true, payment: p })}
        onUpdated={handleQuickUpdated}
      />

      {modal.open && (
        <PaymentModal
          payment={modal.payment}
          onClose={() => setModal({ open: false })}
          onCreated={handleCreated}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}