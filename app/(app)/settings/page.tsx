import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-server";
import { SettingsForm } from "@/components/modules/settings/SettingsForm";
import type { AppUser } from "@/types";

export const metadata: Metadata = { title: "Configuración" };

export default async function SettingsPage() {
  const session = await requireAuth();
  return <SettingsForm user={session.user as unknown as AppUser} />;
}
