"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar } from "@heroui/react";
import {
  LayoutDashboard,
  Calendar,
  Users,
  CreditCard,
  Bell,
  Settings,
  Stethoscope,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import type { Session } from "@/lib/auth";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/calendar", icon: Calendar, label: "Calendario" },
  { href: "/patients", icon: Users, label: "Pacientes" },
  { href: "/payments", icon: CreditCard, label: "Pagos" },
  { href: "/reminders", icon: Bell, label: "Recordatorios" },
  { href: "/settings", icon: Settings, label: "Configuración" },
];

interface Props {
  user: Session["user"];
}

export function AppSidebar({ user }: Props) {
  const pathname = usePathname();

  return (
    <aside className="w-60 bg-white border-r border-gray-100 flex flex-col h-full shadow-sm shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center shadow-sm">
            <Stethoscope className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900">DentalFlow</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                active
                  ? "bg-primary-50 text-primary-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon
                className={cn("w-4.5 h-4.5 shrink-0", active ? "text-primary-600" : "text-gray-400")}
                size={18}
              />
              {item.label}
              {active && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      <div className="px-3 py-3 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
          <Avatar
            name={getInitials(user.name)}
            size="sm"
            classNames={{ base: "bg-primary-100", name: "text-primary-700 font-semibold text-xs" }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
