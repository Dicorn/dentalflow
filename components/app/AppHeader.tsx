"use client";

import { usePathname, useRouter } from "next/navigation";
import { LogOut, Settings, User, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { signOut } from "@/lib/auth-client";
import { getInitials } from "@/lib/utils";
import type { Session } from "@/lib/auth";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/calendar": "Calendario de citas",
  "/patients": "Pacientes",
  "/payments": "Pagos",
  "/reminders": "Recordatorios",
  "/settings": "Configuración",
};

interface Props { user: Session["user"] }

export function AppHeader({ user }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const title = Object.entries(pageTitles).find(([key]) => pathname.startsWith(key))?.[1] ?? "DentalFlow";

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSignOut = async () => {
    await signOut({ fetchOptions: { onSuccess: () => router.push("/login") } });
  };

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0 relative z-50">
      <h1 className="text-base font-semibold text-gray-800">{title}</h1>

      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="w-7 h-7 rounded-lg bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-700">
            {getInitials(user.name)}
          </div>
          <span className="text-sm font-medium text-gray-700 hidden sm:block max-w-32 truncate">
            {user.name}
          </span>
          <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-[99999]">
            <div className="px-3 py-2 border-b border-gray-100 mb-1">
              <p className="text-xs font-semibold text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
            <button onClick={() => { router.push("/settings"); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              <User className="w-4 h-4 text-gray-400" /> Mi perfil
            </button>
            <button onClick={() => { router.push("/settings"); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              <Settings className="w-4 h-4 text-gray-400" /> Configuración
            </button>
            <div className="border-t border-gray-100 mt-1 pt-1">
              <button onClick={handleSignOut}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                <LogOut className="w-4 h-4" /> Cerrar sesión
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}