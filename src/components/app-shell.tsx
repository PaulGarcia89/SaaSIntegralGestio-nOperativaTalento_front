"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  BookOpenCheck,
  Boxes,
  BriefcaseBusiness,
  Building2,
  Building,
  ChartNoAxesCombined,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  FileSignature,
  FileText,
  Gauge,
  GraduationCap,
  Landmark,
  Network,
  LogOut,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  Shield,
  SlidersHorizontal,
  UserCog,
  Users,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { roleLabels } from "@/lib/ui-labels";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AccessibleCommandPalette, MobileDrawer } from "@/components/design-system";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ThemeToggle } from "@/components/theme-toggle";
import { AppBreadcrumb } from "@/components/breadcrumb";
import { Tooltip } from "@/components/ui/tooltip";
import { AccessDenied, AccessLoading } from "@/components/access-state";
import { evaluateRouteAccess, getRoutePolicy } from "@/lib/navigation";
import type { NavGroup, NavItem } from "@/lib/navigation";
import { createTenantTheme } from "@/lib/tenant-branding";
import { ImpersonationBanner } from "@/components/design-system";
import { fetchNotifications } from "@/lib/backend";

const navigationIcons: Record<NavItem["icon"], LucideIcon> = {
  dashboard: Gauge,
  notifications: Bell,
  reports: ChartNoAxesCombined,
  profile: UserRound,
  vacancies: BriefcaseBusiness,
  candidates: Users,
  interviews: ClipboardCheck,
  documents: FileText,
  signatures: FileSignature,
  training: GraduationCap,
  evaluations: BookOpenCheck,
  productivity: ChartNoAxesCombined,
  inventory: Boxes,
  admin: Landmark,
  users: UserCog,
  roles: Shield,
  company: Settings,
  tenants: Building,
  branches: Building2,
  modules: SlidersHorizontal,
  subscription: ClipboardCheck,
  queues: Network,
};

type SidebarContentProps = {
  currentBranch: string;
  currentRoleLabel: string;
  currentTenantName: string;
  currentTenantPlan: string;
  currentUserName: string;
  brandName: string;
  brandAccent: string;
  navigationGroups: readonly NavGroup[];
  navigationLoading: boolean;
  navigationItems:
    | Array<{ href: string; label: string; group: NavGroup; icon: NavItem["icon"] }>
    | undefined;
  pathname: string;
  supportEmail: string;
  onNavigate?: () => void;
  mobile?: boolean;
};

function SidebarNavigationViewport({ children, mobile }: { children: React.ReactNode; mobile: boolean }) {
  if (mobile) {
    return (
      <div className="px-4 pb-[calc(5rem+env(safe-area-inset-bottom))]">
        {children}
        <p className="mt-8 border-t border-white/10 pt-4 text-center text-xs text-sidebar-foreground/50">
          Fin del menú
        </p>
      </div>
    );
  }

  return <ScrollArea className="min-h-0 flex-1 px-4 pb-4">{children}</ScrollArea>;
}

function isActivePath(itemHref: string, pathname: string) {
  if (itemHref === pathname) return true;
  if (itemHref === "/dashboard") return pathname === itemHref;
  if (itemHref === "/admin") return pathname === itemHref;
  return pathname.startsWith(`${itemHref}/`);
}

function SidebarContent({
  currentBranch,
  currentRoleLabel,
  currentTenantName,
  currentTenantPlan,
  currentUserName,
  brandName,
  brandAccent,
  navigationGroups,
  navigationItems,
  navigationLoading,
  onNavigate,
  mobile = false,
  pathname,
  supportEmail,
}: SidebarContentProps) {
  const activeHref = useMemo(
    () =>
      navigationItems
        ?.filter((item) => isActivePath(item.href, pathname))
        .sort((left, right) => right.href.length - left.href.length)[0]?.href,
    [navigationItems, pathname],
  );

  const collapsedGroupsForRoute = useMemo(
    () => {
      const groups: NavGroup[] = ["Inicio", "Personas", "Reclutamiento", "Aprendizaje", "Operaciones", "Analítica", "Administración", "Gobierno de plataforma"];
      const initial = new Set<string>();
      const activeGroup = groups.find((group) =>
        navigationItems?.some(
          (item) =>
            item.group === group &&
            item.href === activeHref,
        ),
      );
      if (activeGroup) {
        groups.filter((g) => g !== activeGroup).forEach((g) => initial.add(g));
      } else {
        groups.forEach((g) => initial.add(g));
      }
      return initial;
    },
    [activeHref, navigationItems],
  );

  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(collapsedGroupsForRoute);

  function toggleGroup(group: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) {
        next.delete(group);
      } else {
        next.add(group);
      }
      return next;
    });
  }

  const groupHasActiveItem = (group: NavGroup) =>
    navigationItems?.some(
      (item) =>
        item.group === group &&
        item.href === activeHref,
    );

  return (
    <Card className={cn(
      "flex flex-col border-sidebar-border bg-sidebar text-sidebar-foreground",
      mobile ? "min-h-full overflow-visible" : "h-full overflow-hidden",
    )}>
      <div className="space-y-4 p-6">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl text-base font-bold text-white" style={{ backgroundColor: brandAccent }}>
            {brandName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold">{brandName}</p>
            <p className="text-xs text-sidebar-foreground/70">Suite empresarial</p>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="mb-3 flex items-center gap-2 text-xs text-sidebar-foreground/70">
            <Building2 className="size-4" />
            Empresa activa
          </div>
          <p className="text-base font-semibold">{currentTenantName}</p>
          <p className="mt-1 text-sm text-sidebar-foreground/70">
            {currentTenantPlan === "global" ? "Contexto global" : `Plan ${currentTenantPlan}`} {supportEmail ? `· ${supportEmail}` : ""}
          </p>
        </div>

        <Separator className="bg-white/10" />

        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-sidebar-foreground/50">
            Sesión actual
          </p>
          <p className="mt-2 text-sm font-semibold">{currentUserName}</p>
          <p className="mt-1 text-sm text-sidebar-foreground/70">{currentRoleLabel}</p>
          <p className="mt-3 text-sm text-sidebar-foreground/70">{currentBranch}</p>
        </div>
      </div>

      <SidebarNavigationViewport mobile={mobile}>
        <div className="space-y-4">
          {navigationGroups.map((group) => {
            const isCollapsed = collapsedGroups.has(group);
            const hasActive = groupHasActiveItem(group);

            return (
              <div key={group} className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggleGroup(group)}
                  className={cn(
                    "flex w-full items-center justify-between px-2 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] transition hover:text-sidebar-foreground/80",
                    hasActive
                      ? "text-sidebar-primary"
                      : "text-sidebar-foreground/50",
                  )}
                >
                  <span>{group}</span>
                  <ChevronRight
                    className={cn(
                      "size-3 transition-transform",
                      !isCollapsed && "rotate-90",
                    )}
                  />
                </button>
                {!isCollapsed && (
                  <div className="space-y-1">
                    {navigationLoading
                      ? Array.from({ length: 3 }).map((_, index) => (
                          <div
                            key={`${group}-${index}`}
                            className="h-10 animate-pulse rounded-xl bg-white/5"
                          />
                        ))
                      : navigationItems
                          ?.filter((item) => item.group === group)
                          .map((item) => {
                            const active = item.href === activeHref;
                            const NavIcon = navigationIcons[item.icon];

                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                                onClick={onNavigate}
                                aria-current={active ? "page" : undefined}
                                style={active ? { backgroundColor: brandAccent } : undefined}
                                className={cn(
                                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                                  active
                                    ? "text-sidebar-primary-foreground shadow-lg shadow-cyan-900/20"
                                    : "text-sidebar-foreground/75 hover:bg-white/7 hover:text-sidebar-foreground",
                                )}
                              >
                                <NavIcon className="size-4" aria-hidden="true" />
                                <span>{item.label}</span>
                              </Link>
                            );
                          })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </SidebarNavigationViewport>
    </Card>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    allowedNav,
    allowedTenantIds,
    accessContextVerified,
    impersonation,
    currentBranch,
    currentTenant,
    currentUser,
    isBootstrapping,
    session,
    setCurrentBranchId,
    setCurrentTenantId,
    signOut,
    tenantBranches,
    tenants,
    currentRole,
    currentSubscriptionStatus,
    subscriptionGraceEndsAt,
    can,
    hasModule,
    hasFeature,
  } = useAppStore();

  const routePolicy = useMemo(() => getRoutePolicy(pathname), [pathname]);
  const routeAccess = useMemo(() => {
    if (!routePolicy) return { allowed: false, code: "PERMISSION_DENIED" as const, reason: "Esta ruta no está registrada en la política de acceso." };
    const decision = evaluateRouteAccess(routePolicy, {
      sessionValid: accessContextVerified,
      globalContext: currentRole === "admin_saas" && !impersonation?.active,
      tenantAllowed: accessContextVerified && (currentRole === "admin_saas" || allowedTenantIds.includes(currentTenant.id)),
      subscriptionStatus: currentRole === "admin_saas" ? "active" : currentSubscriptionStatus,
      role: currentRole,
      hasModule,
      hasFeature,
      can,
      branchAvailable: Boolean(currentBranch),
    });
    if (decision.code !== "SUBSCRIPTION_BLOCKED" || !subscriptionGraceEndsAt) return decision;
    const graceDate = new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(new Date(subscriptionGraceEndsAt));
    return { ...decision, reason: `${decision.reason} El periodo de gracia finaliza el ${graceDate}.` };
  }, [accessContextVerified, allowedTenantIds, can, currentBranch, currentRole, currentSubscriptionStatus, currentTenant.id, hasFeature, hasModule, impersonation?.active, routePolicy, subscriptionGraceEndsAt]);

  const groups = useMemo(
    () =>
      (["Inicio", "Personas", "Reclutamiento", "Aprendizaje", "Operaciones", "Analítica", "Administración", "Gobierno de plataforma"] as const).filter((group) =>
        allowedNav.some((item) => item.group === group),
      ),
    [allowedNav],
  );
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const userMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const closeMobileSidebar = () => setMobileSidebarOpen(false);
  const [userMenuPosition, setUserMenuPosition] = useState({ top: 0, left: 0 });
  const canUsePortal = typeof document !== "undefined";
  const notificationsSummary = useQuery({
    queryKey: ["notifications", "shell-unread", currentTenant.id, currentUser.id],
    queryFn: () =>
      fetchNotifications({ page: 1, pageSize: 1, unreadOnly: true }),
    enabled: accessContextVerified && can("notifications.view"),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
  const unreadNotifications = notificationsSummary.data?.unread ?? 0;
  const userInitials = useMemo(
    () =>
      currentUser.fullName
        .split(" ")
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase(),
    [currentUser.fullName],
  );

  const isGlobalView = currentRole === "admin_saas";
  const tenantTheme = useMemo(() => createTenantTheme(currentTenant.branding.accent), [currentTenant.branding.accent]);
  const workspaceName = isGlobalView ? "Vista global TalentOS" : currentTenant.name;
  const workspaceBranch = isGlobalView
    ? "Todas las empresas"
    : currentBranch?.name ?? "Sin sucursal asignada";

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--primary", tenantTheme.primary);
    root.style.setProperty("--primary-foreground", tenantTheme.foreground);
    root.style.setProperty("--ring", tenantTheme.primary);
    root.style.setProperty("--accent", tenantTheme.accent);
    root.style.setProperty("--accent-foreground", "222 47% 11%");
    root.style.setProperty("--sidebar-primary", tenantTheme.primary);
    root.style.setProperty("--sidebar-ring", tenantTheme.primary);
  }, [tenantTheme]);

  useEffect(() => {
    if (!isBootstrapping && !session) {
      router.replace("/login");
    }
  }, [isBootstrapping, router, session]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (event.key === "Escape") {
        setSearchOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      const isInsideSelectPortal =
        target instanceof Element && Boolean(target.closest("[data-select-content]"));
      if (
        !isInsideSelectPortal &&
        !userMenuRef.current?.contains(target) &&
        !userMenuButtonRef.current?.contains(target)
      ) {
        setUserMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    function updateUserMenuPosition() {
      if (!userMenuButtonRef.current) return;

      const rect = userMenuButtonRef.current.getBoundingClientRect();
      const menuWidth = 340;
      const margin = 16;
      const computedLeft = Math.min(
        rect.right - menuWidth,
        window.innerWidth - menuWidth - margin,
      );

      setUserMenuPosition({
        top: rect.bottom + 12,
        left: Math.max(margin, computedLeft),
      });
    }

    if (userMenuOpen) {
      updateUserMenuPosition();
      window.addEventListener("resize", updateUserMenuPosition);
      window.addEventListener("scroll", updateUserMenuPosition, true);
    }

    return () => {
      window.removeEventListener("resize", updateUserMenuPosition);
      window.removeEventListener("scroll", updateUserMenuPosition, true);
    };
  }, [userMenuOpen]);

  if (isBootstrapping) {
    return <AccessLoading />;
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-md rounded-2xl border-border/70 bg-card/90 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Cerrando sesión y redirigiendo al acceso principal...
          </p>
        </Card>
      </div>
    );
  }

  if (!routeAccess.allowed) {
    return <AccessDenied reason={routeAccess.reason} code={routeAccess.code === "ALLOWED" ? "PERMISSION_DENIED" : routeAccess.code} requestId={routeAccess.requestId} />;
  }

  return (
    <div className="operational-shell min-h-screen bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[999999] focus:rounded-xl focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-primary-foreground focus:shadow-lg"
      >
        Saltar al contenido
      </a>
      <AccessibleCommandPalette open={searchOpen} onOpenChange={setSearchOpen} items={allowedNav.map((route) => ({ id: route.href.replaceAll("/", "-") || "inicio", label: route.label, group: route.group, href: route.href }))} onNavigate={(href) => router.push(href)} />

      <div className="mx-auto grid min-h-screen max-w-[1600px] gap-4 p-4 xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="order-2 xl:order-1 xl:sticky xl:top-4 xl:h-[calc(100vh-2rem)]">
          <div className="hidden xl:block">
            <SidebarContent
              key={pathname}
              currentBranch={workspaceBranch}
              brandName={isGlobalView ? "TalentOS" : currentTenant.branding.productName ?? currentTenant.name}
              brandAccent={tenantTheme.hex}
              currentRoleLabel={roleLabels[currentRole]}
              currentTenantName={workspaceName}
              currentTenantPlan={isGlobalView ? "global" : currentTenant.plan}
              currentUserName={currentUser.fullName}
              navigationGroups={groups}
              navigationItems={allowedNav}
              navigationLoading={isBootstrapping}
              pathname={pathname}
              supportEmail={currentTenant.branding.supportEmail}
            />
          </div>
        </aside>

        <div className="order-1 min-w-0 space-y-8 overflow-visible xl:order-2 xl:space-y-10">
          {impersonation?.active ? <ImpersonationBanner tenantName={currentTenant.name} /> : null}
          <Card className="overflow-visible border-border/70 bg-card/80 px-4 py-4 backdrop-blur md:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ShieldCheck className="size-4 text-primary" />
                  {currentRole === "admin_saas"
                    ? "Espacio de trabajo de superadministrador"
                    : "Espacio de trabajo de la empresa"}
                </div>
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight">{workspaceName}</h1>
                  <p className="text-sm text-muted-foreground">
                    {currentUser.fullName} · {roleLabels[currentRole]}
                    {!isGlobalView && currentBranch ? ` · ${currentBranch.city}` : ""}
                  </p>
                </div>
                <AppBreadcrumb pathname={pathname} />
              </div>
              <div className="flex w-full flex-col gap-3 lg:w-auto lg:min-w-[640px]">
                <div className="flex items-center gap-3 xl:hidden">
                  <Tooltip content="Abrir menu">
                    <Button
                      ref={mobileMenuButtonRef}
                      variant="secondary"
                      size="icon"
                      onClick={() => setMobileSidebarOpen(true)}
                      aria-label="Abrir navegación"
                    >
                      <Menu className="size-4" />
                    </Button>
                  </Tooltip>
                  <div className="min-w-0 flex-1 rounded-xl border border-border/60 bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
                    {isGlobalView ? "Contexto global" : currentBranch ? `${currentBranch.name} · ${currentBranch.city}` : currentTenant.name}
                  </div>
                </div>
                <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end lg:flex-nowrap">
                    <Tooltip content="Buscar (Ctrl+K)">
                      <div className="relative min-w-0 flex-1 sm:min-w-[240px] lg:max-w-[420px]">
                        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Buscar... (Ctrl+K)"
                          className="h-12 cursor-pointer pl-9 pr-4"
                          readOnly
                          onClick={() => setSearchOpen(true)}
                        />
                      </div>
                    </Tooltip>
                    <div className="flex items-center justify-end gap-3">
                      <ThemeToggle />
                      <Tooltip content="Notificaciones">
                        <Button variant="secondary" size="icon" className="relative shrink-0" asChild>
                          <Link
                            href="/notifications"
                            aria-label={`Abrir notificaciones${unreadNotifications ? `, ${unreadNotifications} sin leer` : ""}`}
                          >
                            <Bell className="size-4" />
                            {unreadNotifications > 0 ? (
                              <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                                {unreadNotifications > 99 ? "99+" : unreadNotifications}
                              </span>
                            ) : null}
                          </Link>
                        </Button>
                      </Tooltip>
                    <button
                      ref={userMenuButtonRef}
                      type="button"
                      onClick={() => setUserMenuOpen((open) => !open)}
                      className="flex min-w-0 items-center gap-2 rounded-full border border-border/70 bg-background/90 px-2 py-2 shadow-sm transition hover:bg-secondary/70 sm:gap-3"
                    >
                      <div className="relative">
                        <div className="flex size-11 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 text-sm font-semibold text-white">
                          {userInitials}
                        </div>
                        <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-background bg-emerald-500" />
                      </div>
                      <div className="hidden min-w-0 text-left sm:block">
                        <p className="text-sm font-semibold leading-none">{currentUser.fullName}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{roleLabels[currentRole]}</p>
                      </div>
                      <ChevronDown className={cn("size-4 text-muted-foreground transition", userMenuOpen && "rotate-180")} />
                    </button>
                  </div>

                  {canUsePortal && userMenuOpen
                    ? createPortal(
                        <div
                          ref={userMenuRef}
                          role="dialog"
                          aria-label="Menú de usuario"
                          className="fixed z-[99999] w-[min(340px,calc(100vw-2rem))] touch-pan-y overflow-x-hidden overflow-y-auto overscroll-contain rounded-2xl border border-border/70 bg-background/95 shadow-[0_24px_80px_rgba(15,23,42,0.18)] backdrop-blur [-webkit-overflow-scrolling:touch]"
                          style={{
                            top: `${userMenuPosition.top}px`,
                            left: `${userMenuPosition.left}px`,
                            maxHeight: `calc(100dvh - ${userMenuPosition.top}px - 16px)`,
                          }}
                        >
                          <div className="border-b border-border/70 p-5">
                            <div className="flex items-center gap-4">
                              <div className="relative">
                                <div className="flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 text-lg font-semibold text-white">
                                  {userInitials}
                                </div>
                                <span className="absolute bottom-1 right-1 size-4 rounded-full border-2 border-background bg-emerald-500" />
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-2xl font-semibold text-foreground">{currentUser.fullName}</p>
                                <p className="text-base text-muted-foreground">{roleLabels[currentRole]}</p>
                              </div>
                            </div>

                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                              <div className="rounded-xl bg-secondary/70 p-3">
                                <p className="text-xs text-muted-foreground">Empresa conectada</p>
                                <p className="mt-1 text-sm font-medium">{workspaceName}</p>
                              </div>
                              <div className="rounded-xl bg-secondary/70 p-3">
                                <p className="text-xs text-muted-foreground">Sucursal activa</p>
                                <p className="mt-1 text-sm font-medium">
                                  {isGlobalView ? "No aplica" : currentBranch ? currentBranch.name : "Sin sucursal"}
                                </p>
                              </div>
                            </div>

                            <div className="mt-3 flex items-center justify-between rounded-xl bg-secondary/50 px-3 py-2">
                              <p className="text-sm text-muted-foreground">Conexion actual</p>
                              <Badge variant="secondary" className="rounded-full px-3">
                                {currentTenant.enabledModules.length} módulos
                              </Badge>
                            </div>
                          </div>

                          <div className="border-b border-border/70 p-3">
                            <Link href="/profile" className="flex items-center gap-3 rounded-xl px-3 py-3 text-base text-foreground transition hover:bg-secondary/70">
                              <UserRound className="size-5 text-muted-foreground" />
                              Mi perfil
                            </Link>
                            {can("admin.company") && hasModule("admin") ? (
                              <Link href="/admin/company" className="flex items-center gap-3 rounded-xl px-3 py-3 text-base text-foreground transition hover:bg-secondary/70">
                                <Settings className="size-5 text-muted-foreground" />
                                Configuración
                              </Link>
                            ) : null}
                          </div>

                          <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                            {currentRole === "admin_saas" ? (
                              <div className="rounded-xl border border-border/70 bg-secondary/35 p-4">
                                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                                  Vista global
                                </p>
                                <p className="mt-2 text-sm text-foreground">
                                  Acceso general a la plataforma sin selección de empresa o sucursal.
                                </p>
                              </div>
                            ) : accessContextVerified && currentRole === "admin_plataforma" && can("platform.tenant.switch") && allowedTenantIds.length > 1 ? (
                              <div className="space-y-3 rounded-xl border border-border/70 bg-secondary/35 p-4">
                                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                                  Contexto de plataforma
                                </p>
                                <div className="space-y-2">
                                  <label className="text-xs font-medium text-muted-foreground">Empresa</label>
                                  <Select
                                    value={currentTenant.id}
                                    onValueChange={(value) => {
                                      void setCurrentTenantId(value);
                                      setUserMenuOpen(false);
                                    }}
                                  >
                                    <SelectTrigger className="h-11">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {tenants.filter((tenant) => allowedTenantIds.includes(tenant.id)).map((tenant) => (
                                        <SelectItem key={tenant.id} value={tenant.id}>
                                          {tenant.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <label className="text-xs font-medium text-muted-foreground">Sucursal</label>
                                  <Select
                                    value={currentBranch?.id ?? ""}
                                    onValueChange={(value) => {
                                      void setCurrentBranchId(value);
                                      setUserMenuOpen(false);
                                    }}
                                    disabled={tenantBranches.length === 0}
                                  >
                                    <SelectTrigger className="h-11" disabled={tenantBranches.length === 0}>
                                      <SelectValue placeholder="Sin sucursales" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {tenantBranches.map((branch) => (
                                        <SelectItem key={branch.id} value={branch.id}>
                                          {branch.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            ) : currentRole === "admin_empresa" ? (
                              <div className="space-y-3 rounded-xl border border-border/70 bg-secondary/35 p-4">
                                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                                  Contexto de empresa
                                </p>
                                <p className="text-sm text-muted-foreground">{currentTenant.name}</p>
                                <div className="space-y-2">
                                  <label className="text-xs font-medium text-muted-foreground">Sucursal</label>
                                  <Select
                                    value={currentBranch?.id ?? ""}
                                    onValueChange={(value) => {
                                      void setCurrentBranchId(value);
                                      setUserMenuOpen(false);
                                    }}
                                    disabled={tenantBranches.length === 0}
                                  >
                                    <SelectTrigger className="h-11" disabled={tenantBranches.length === 0}>
                                      <SelectValue placeholder="Sin sucursales" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {tenantBranches.map((branch) => (
                                        <SelectItem key={branch.id} value={branch.id}>
                                          {branch.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            ) : (
                              <div className="rounded-xl border border-dashed border-border/70 px-3 py-3 text-sm text-muted-foreground">
                                El contexto de empresa y sucursal está determinado por tus asignaciones.
                              </div>
                            )}

                            <Button
                              variant="destructive"
                              className="mt-4 h-12 w-full rounded-xl"
                              onClick={signOut}
                            >
                              Cerrar sesión
                              <LogOut className="size-4" />
                            </Button>
                          </div>
                        </div>,
                        document.body,
                      )
                    : null}
                </div>
              </div>
            </div>
          </Card>

          <main id="main-content" className="space-y-10 xl:space-y-12">{children}</main>
        </div>
      </div>
      <MobileDrawer open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen} title="Menú principal">
        <SidebarContent
              key={pathname}
              currentBranch={workspaceBranch}
              brandName={isGlobalView ? "TalentOS" : currentTenant.branding.productName ?? currentTenant.name}
              brandAccent={tenantTheme.hex}
              currentRoleLabel={roleLabels[currentRole]}
              currentTenantName={workspaceName}
              currentTenantPlan={isGlobalView ? "global" : currentTenant.plan}
              currentUserName={currentUser.fullName}
              navigationGroups={groups}
              navigationItems={allowedNav}
              navigationLoading={isBootstrapping}
              onNavigate={closeMobileSidebar}
              mobile
              pathname={pathname}
              supportEmail={currentTenant.branding.supportEmail}
        />
      </MobileDrawer>
    </div>
  );
}
