import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { PortalContextProvider } from "@/components/portal-context";
import { PortalThemeProvider } from "@/components/portal-theme";
import { PwaRegistration } from "@/components/pwa-registration";
import "./globals.css";

export const metadata: Metadata = {
  title: "TalentOS | SaaS multiempresa de RRHH",
  description:
    "Frontend SaaS empresarial para reclutamiento, incorporación, capacitación, productividad con IA, inventario y administración.",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      data-scroll-behavior="smooth"
    >
      <body suppressHydrationWarning>
        <Providers>
          <PortalContextProvider>
            <PortalThemeProvider>
              <PwaRegistration />
              {children}
            </PortalThemeProvider>
          </PortalContextProvider>
        </Providers>
      </body>
    </html>
  );
}
