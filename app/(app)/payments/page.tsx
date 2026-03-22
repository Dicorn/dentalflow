import type { Metadata } from "next";
import { PaymentsPageClient } from "@/components/modules/payments/PaymentsPageClient";

export const metadata: Metadata = { title: "Pagos" };

export default function PaymentsPage() {
  return <PaymentsPageClient />;
}
