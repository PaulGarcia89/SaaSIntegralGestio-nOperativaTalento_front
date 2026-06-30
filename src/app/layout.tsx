import type { Metadata } from "next";
import { IBM_Plex_Sans, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { AppStoreProvider } from "@/store/app-store";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
});

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TalentOS | Reclutamiento, Operacion y Productividad con IA",
  description:
    "Plataforma SaaS multi-tenant para reclutamiento, onboarding, entrenamiento, inventario y productividad empresarial con IA.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${plusJakartaSans.variable} ${ibmPlexSans.variable} ${jetBrainsMono.variable}`}
    >
      <body>
        <AppStoreProvider>{children}</AppStoreProvider>
      </body>
    </html>
  );
}
