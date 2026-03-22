import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { HeroUIProviderWrapper } from "@/components/providers/HeroUIProvider";

export const metadata: Metadata = {
  title: {
    default: "DentalFlow — Gestión para clínicas dentales",
    template: "%s | DentalFlow",
  },
  description:
    "Software de gestión para clínicas dentales. Agenda citas, gestiona pacientes y cobra con facilidad.",
  keywords: ["clínica dental", "software dental", "gestión citas", "odontología", "Perú"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <QueryProvider>
          <HeroUIProviderWrapper>{children}</HeroUIProviderWrapper>
        </QueryProvider>
      </body>
    </html>
  );
}
