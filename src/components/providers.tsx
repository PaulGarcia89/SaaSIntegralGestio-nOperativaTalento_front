"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Toaster } from "sonner";
import { AppStoreProvider } from "@/store/app-store";
import { DemoModeBanner } from "@/components/integration-state";
import { UnsavedChangesProvider } from "@/hooks/use-unsaved-changes";
import { LocaleProvider } from "@/components/locale-provider";

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
      <LocaleProvider>
      <AppStoreProvider>
        <UnsavedChangesProvider>
          <DemoModeBanner />
          {children}
        </UnsavedChangesProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              borderRadius: "16px",
              padding: "12px 16px",
            },
          }}
          richColors
          closeButton
        />
      </AppStoreProvider>
      </LocaleProvider>
    </QueryClientProvider>
  );
}
