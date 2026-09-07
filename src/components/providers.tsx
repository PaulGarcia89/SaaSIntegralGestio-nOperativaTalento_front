"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Toaster } from "sonner";
import { AppStoreProvider } from "@/store/app-store";
import { DemoModeBanner } from "@/components/integration-state";
import { UnsavedChangesProvider } from "@/hooks/use-unsaved-changes";
import { LocaleProvider } from "@/components/locale-provider";
import { AppearanceProvider, useAppearance } from "@/components/appearance";

/**
 * Los avisos emergentes siguen el tema activo y los tokens del sistema, en vez
 * de los colores propios de la librería. `richColors` se retira a propósito:
 * pintaba verdes y rojos ajenos a la paleta, y era la única superficie del
 * producto cuyo color no salía de `globals.css`.
 */
function AppToaster() {
  const { theme } = useAppearance();
  return (
    <Toaster
      position="bottom-right"
      theme={theme}
      closeButton
      offset={16}
      toastOptions={{
        classNames: {
          toast:
            "!rounded-xl !border !border-line !bg-surface-1 !text-ink-1 !shadow-e3 !font-sans !text-sm",
          description: "!text-ink-2",
          actionButton: "!rounded-md !bg-action !text-on-action",
          cancelButton: "!rounded-md !bg-surface-2 !text-ink-1",
          success: "!border-status-success/40",
          warning: "!border-status-warning/40",
          error: "!border-status-danger/40",
          info: "!border-status-info/40",
        },
      }}
    />
  );
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AppearanceProvider>
        <LocaleProvider>
          <AppStoreProvider>
            <UnsavedChangesProvider>
              <DemoModeBanner />
              {children}
            </UnsavedChangesProvider>
            <AppToaster />
          </AppStoreProvider>
        </LocaleProvider>
      </AppearanceProvider>
    </QueryClientProvider>
  );
}
