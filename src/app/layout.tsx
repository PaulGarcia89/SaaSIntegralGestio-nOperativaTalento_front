import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/providers";
import { PortalContextProvider } from "@/components/portal-context";
import { PortalThemeProvider } from "@/components/portal-theme";
import { PwaRegistration } from "@/components/pwa-registration";
import { LocalizedDocumentTitle } from "@/components/localized-document-title";
import { APPEARANCE_BOOT_SCRIPT } from "@/components/appearance";
import { fontVariables } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "TalentOS | SaaS multiempresa de RRHH",
  description:
    "Frontend SaaS empresarial para reclutamiento, incorporación, capacitación, productividad con IA, inventario y administración.",
  manifest: "/manifest.webmanifest",
};

/**
 * `viewportFit: "cover"` es lo que permite que `env(safe-area-inset-*)` tenga
 * un valor distinto de cero en un iPhone con muesca o isla dinámica. Sin él,
 * las barras inferiores fijas del producto quedan bajo el indicador de inicio.
 *
 * No se fija `maximumScale`: impedir el zoom rompe WCAG 1.4.4. El zoom
 * automático de Safari al enfocar un campo se evita por la vía correcta, que es
 * no bajar de 16px en los controles nativos (ver `globals.css`).
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F6F7F9" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0F14" },
  ],
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
      data-density="comfortable"
      className={fontVariables}
      suppressHydrationWarning
    >
      <head>
        {/*
          Corre antes del primer pintado y aplica el tema y la densidad que el
          usuario ya tenía, leídos del espejo local. Sin esto, la preferencia
          real llega por red después del primer frame y se ve un fogonazo claro
          antes del tema oscuro. `suppressHydrationWarning` en <html> es
          necesario justo porque este script modifica el elemento antes de que
          React lo hidrate.
        */}
        <script dangerouslySetInnerHTML={{ __html: APPEARANCE_BOOT_SCRIPT }} />
      </head>
      <body suppressHydrationWarning>
        <Providers>
          <PortalContextProvider>
            <PortalThemeProvider>
              <PwaRegistration />
              {/* Único escritor del título de la pestaña; elige por ruta. */}
              <LocalizedDocumentTitle />
              {children}
            </PortalThemeProvider>
          </PortalContextProvider>
        </Providers>
      </body>
    </html>
  );
}
