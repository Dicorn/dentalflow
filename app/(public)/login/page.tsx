import { LoginForm } from "@/components/auth/LoginForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-brand-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center shadow-lg">
              <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6">
                <path d="M12 2C8.5 2 6 4.5 6 7c0 1.5.5 2.8 1.4 3.8L6 20h2l.8-4h6.4l.8 4h2L16.6 10.8C17.5 9.8 18 8.5 18 7c0-2.5-2.5-5-6-5zm0 2c2.2 0 4 1.8 4 3 0 .8-.3 1.6-.8 2.1L14 10H10l-1.2-1.1C8.3 8.4 8 7.6 8 7c0-1.2 1.8-3 4-3z"/>
              </svg>
            </div>
            <span className="text-2xl font-bold text-gray-900">DentalFlow</span>
          </div>
          <p className="text-gray-500 text-sm">Gestión inteligente para tu clínica dental</p>
        </div>

        <LoginForm />

        <p className="text-center text-xs text-gray-400 mt-6">
          ¿Necesitas una cuenta?{" "}
          <a href="/#pricing" className="text-primary-600 hover:underline font-medium">
            Ver planes
          </a>
        </p>
      </div>
    </div>
  );
}
