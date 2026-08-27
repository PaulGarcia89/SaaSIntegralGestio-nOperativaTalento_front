"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { resolveCareerPortal } from "@/lib/backend";
import type { CareerPortalContext } from "@/lib/career-portals";

const PortalContext = createContext<{ portal: CareerPortalContext | null; isResolving: boolean }>({ portal: null, isResolving: true });

function fallbackPortal(pathname: string): CareerPortalContext {
  const type = pathname.startsWith("/careers") ? "BRANDED" : pathname.startsWith("/company/") ? "PRIVATE_STANDARD" : "PUBLIC";
  return {
    portalId: "pending",
    type,
    accessType: "OPEN",
    branding: {},
    requireLoginToViewJobs: false,
    requireLoginToApply: false,
    allowApplicantRegistration: true,
  };
}

export function PortalContextProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const query = useQuery({
    queryKey: ["career-portal", pathname],
    queryFn: () => resolveCareerPortal(),
    retry: false,
    staleTime: 0,
  });

  const portal = useMemo(() => query.data ?? fallbackPortal(pathname), [query.data, pathname]);

  return <PortalContext.Provider value={{ portal, isResolving: query.isLoading }}>{children}</PortalContext.Provider>;
}

export function useCareerPortal() {
  return useContext(PortalContext);
}
