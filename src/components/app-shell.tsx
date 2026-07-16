"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Building2,
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  LogOut,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { roleLabels } from "@/lib/ui-labels";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

type NavGroup = "General" | "RRHH" | "Operacion" | "Gobierno SaaS" | "Empresa";

const searchableRoutes: Array<{ label: string; href: string; group: string }> = [
  { label: "Panel principal", href: "/dashboard", group: "General" },
  { label: "Vacantes", href: "/ats/vacancies", group: "ATS" },
  { label: "Postulantes", href: "/ats/candidates", group: "ATS" },
  { label: "Entrevistas", href: "/ats/interviews", group: "ATS" },
  { label: "Documentos", href: "/onboarding/documents", group: "Incorporacion" },
  { label: "Firmas", href: "/onboarding/signatures", group: "Incorporacion" },
  { label: "Capacitacion", href: "/training", group: "Capacitacion" },
  { label: "Evaluaciones", href: "/training/evaluations", group: "Capacitacion" },
  { label: "Productividad", href: "/productivity", group: "Operacion" },
  { label: "Reportes", href: "/reports", group: "Operacion" },
  { label: "Inventario", href: "/inventory", group: "Operacion" },
  { label: "Notificaciones", href: "/notifications", group: "General" },
  { label: "Perfil", href: "/profile", group: "General" },
  { label: "Configuracion empresa", href: "/admin/company", group: "Empresa" },
  { label: "Empresas", href: "/admin/tenants", group: "Gobierno SaaS" },
  { label: "Usuarios", href: "/admin/users", group: "Empresa" },
  { label: "Sucursales", href: "/admin/branches", group: "Empresa" },
  { label: "Roles", href: "/admin/roles", group: "Empresa" },
  { label: "Planes y suscripciones", href: "/admin/subscription", group: "Gobierno SaaS" },
  { label: "Modulos", href: "/admin/modules", group: "Gobierno SaaS" },
  { label: "Empleos publicos", href: "/jobs", group: "Publico" },
  { label: "Portal de aplicacion", href: "/apply", group: "Publico" },
];

type SidebarContentProps = {
  currentBranch: string;
  currentRoleLabel: string;
  currentTenantName: string;
  currentTenantPlan: string;
  currentUserName: string;
  navigationGroups: readonly NavGroup[];
  navigationLoading: boolean;
  navigationItems:
    | Array<{ href: string; label: string; group: NavGroup }>
    | undefined;
  pathname: string;
  supportEmail: string;
  onNavigate?: () => void;
};

function SidebarContent({
  currentBranch,
  currentRoleLabel,
  currentTenantName,
  currentTenantPlan,
  currentUserName,
  navigationGroups,
  navigationItems,
  navigationLoading,
  onNavigate,
  pathname,
  supportEmail,
}: SidebarContentProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(() => {
    const groups: NavGroup[] = ["General", "RRHH", "Operacion", "Empresa", "Gobierno SaaS"];
    const initial = new Set<string>();
    const activeGroup = groups.find((group) =>
      navigationItems?.some(
        (item) =>
          item.group === group &&
          (item.href === "/dashboard"
            ? pathname === item.href
            : pathname.startsWith(item.href)),
      ),
    );
    if (activeGroup) {
      groups.filter((g) => g !== activeGroup).forEach((g) => initial.add(g));
    } else {
      groups.forEach((g) => initial.add(g));
    }
    return initial;
  });

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
        (item.href === "/dashboard"
          ? pathname === item.href
          : pathname.startsWith(item.href)),
    );

  return (
    <Card className="flex h-full flex-col overflow-hidden border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="space-y-4 p-6">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 text-base font-bold text-white">
            T
          </div>
          <div>
            <p className="font-semibold">TalentOS</p>
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
            Plan {currentTenantPlan} · {supportEmail}
          </p>
        </div>

        <Separator className="bg-white/10" />

        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-sidebar-foreground/50">
            Sesion actual
          </p>
          <p className="mt-2 text-sm font-semibold">{currentUserName}</p>
          <p className="mt-1 text-sm text-sidebar-foreground/70">{currentRoleLabel}</p>
          <p className="mt-3 text-sm text-sidebar-foreground/70">{currentBranch}</p>
        </div>
      </div>

      <ScrollArea className="flex-1 px-4 pb-4">
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
                            const active =
                              item.href === "/dashboard"
                                ? pathname === item.href
                                : pathname.startsWith(item.href);

                            return (
                              <Link
                                key={item.href}
                                href={item.href}
                                onClick={onNavigate}
                                aria-current={active ? "page" : undefined}
                                className={cn(
                                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                                  active
                                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-cyan-900/20"
                                    : "text-sidebar-foreground/75 hover:bg-white/7 hover:text-sidebar-foreground",
                                )}
                              >
                                <LayoutGrid className="size-4" />
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
      </ScrollArea>
    </Card>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    allowedNav,
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
  } = useAppStore();

  const groups = useMemo(
    () =>
      (["General", "RRHH", "Operacion", "Empresa", "Gobierno SaaS"] as const).filter((group) =>
        allowedNav.some((item) => item.group === group),
      ),
    [allowedNav],
  );
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const userMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const [userMenuPosition, setUserMenuPosition] = useState({ top: 0, left: 0 });
  const canUsePortal = typeof document !== "undefined";
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

  const filteredRoutes = useMemo(() => {
    if (!searchQuery) return [];
    const q = searchQuery.toLowerCase();
    return searchableRoutes.filter((route) =>
      route.label.toLowerCase().includes(q),
    );
  }, [searchQuery]);

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
        setSearchQuery("");
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (searchOpen) {
      searchRef.current?.focus();
    }
  }, [searchOpen]);

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

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-md rounded-2xl border-border/70 bg-card/90 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Cerrando sesion y redirigiendo al acceso principal...
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[999999] focus:rounded-xl focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-primary-foreground focus:shadow-lg"
      >
        Saltar al contenido
      </a>
      {canUsePortal && searchOpen
        ? createPortal(
            <div className="fixed inset-0 z-[99998] flex items-start justify-center pt-[15vh]">
              <button
                type="button"
                className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery("");
                }}
              />
              <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-border/70 bg-background/95 shadow-2xl backdrop-blur">
                <div className="flex items-center gap-3 border-b border-border/70 px-4 py-3">
                  <Search className="size-4 text-muted-foreground" />
                  <input
                    ref={searchRef}
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Buscar paginas..."
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                  <kbd className="rounded-lg border border-border/70 bg-secondary/60 px-2 py-0.5 text-[10px] text-muted-foreground">
                    ESC
                  </kbd>
                </div>
                {filteredRoutes.length > 0 && (
                  <div className="max-h-80 overflow-y-auto p-2">
                    {filteredRoutes.map((route) => (
                      <Link
                        key={route.href}
                        href={route.href}
                        onClick={() => {
                          setSearchOpen(false);
                          setSearchQuery("");
                        }}
                        className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition hover:bg-accent"
                      >
                        <span>{route.label}</span>
                        <span className="text-xs text-muted-foreground">{route.group}</span>
                      </Link>
                    ))}
                  </div>
                )}
                {searchQuery && filteredRoutes.length === 0 && (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    No se encontraron resultados para &quot;{searchQuery}&quot;
                  </div>
                )}
                {!searchQuery && (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    Escribe para buscar entre las paginas disponibles
                  </div>
                )}
              </div>
            </div>,
            document.body,
          )
        : null}

      <div className="mx-auto grid min-h-screen max-w-[1600px] gap-4 p-4 xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="order-2 xl:order-1 xl:sticky xl:top-4 xl:h-[calc(100vh-2rem)]">
          <div className="hidden xl:block">
            <SidebarContent
              currentBranch={currentBranch ? currentBranch.name : "Sin sucursal asignada"}
              currentRoleLabel={roleLabels[currentRole]}
              currentTenantName={currentTenant.name}
              currentTenantPlan={currentTenant.plan}
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
                  <h1 className="text-2xl font-semibold tracking-tight">{currentTenant.name}</h1>
                  <p className="text-sm text-muted-foreground">
                    {currentUser.fullName} · {roleLabels[currentRole]}
                    {currentBranch ? ` · ${currentBranch.city}` : ""}
                  </p>
                </div>
                <AppBreadcrumb pathname={pathname} />
              </div>
              <div className="flex w-full flex-col gap-3 lg:w-auto lg:min-w-[640px]">
                <div className="flex items-center gap-3 xl:hidden">
                  <Tooltip content="Abrir menu">
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() => setMobileSidebarOpen(true)}
                      aria-label="Abrir navegacion"
                    >
                      <Menu className="size-4" />
                    </Button>
                  </Tooltip>
                  <div className="min-w-0 flex-1 rounded-xl border border-border/60 bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
                    {currentBranch ? `${currentBranch.name} · ${currentBranch.city}` : currentTenant.name}
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
                      <Tooltip content="Notificaciones (6 sin leer)">
                        <Button variant="secondary" size="icon" className="relative shrink-0" asChild>
                          <Link href="/notifications" aria-label="Notificaciones (6 sin leer)">
                            <Bell className="size-4" />
                            <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
                              6
                            </span>
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
                          className="fixed z-[99999] w-[340px] overflow-hidden rounded-2xl border border-border/70 bg-background/95 shadow-[0_24px_80px_rgba(15,23,42,0.18)] backdrop-blur"
                          style={{
                            top: `${userMenuPosition.top}px`,
                            left: `${userMenuPosition.left}px`,
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
                                <p className="mt-1 text-sm font-medium">{currentTenant.name}</p>
                              </div>
                              <div className="rounded-xl bg-secondary/70 p-3">
                                <p className="text-xs text-muted-foreground">Sucursal activa</p>
                                <p className="mt-1 text-sm font-medium">
                                  {currentBranch ? currentBranch.name : "Sin sucursal"}
                                </p>
                              </div>
                            </div>

                            <div className="mt-3 flex items-center justify-between rounded-xl bg-secondary/50 px-3 py-2">
                              <p className="text-sm text-muted-foreground">Conexion actual</p>
                              <Badge variant="secondary" className="rounded-full px-3">
                                {currentTenant.enabledModules.length} modulos
                              </Badge>
                            </div>
                          </div>

                          <div className="border-b border-border/70 p-3">
                            <Link href="/profile" className="flex items-center gap-3 rounded-xl px-3 py-3 text-base text-foreground transition hover:bg-secondary/70">
                              <UserRound className="size-5 text-muted-foreground" />
                              Mi perfil
                            </Link>
                            <Link href="/admin/company" className="flex items-center gap-3 rounded-xl px-3 py-3 text-base text-foreground transition hover:bg-secondary/70">
                              <Settings className="size-5 text-muted-foreground" />
                              Configuracion
                            </Link>
                          </div>

                          <div className="p-4">
                            {currentRole === "admin_saas" ? (
                              <div className="space-y-3 rounded-xl border border-border/70 bg-secondary/35 p-4">
                                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                                  Control de superadministrador
                                </p>
                                <div className="space-y-2">
                                  <label className="text-xs font-medium text-muted-foreground">Empresa</label>
                                  <Select
                                    value={currentTenant.id}
                                    onValueChange={(value) => {
                                      setCurrentTenantId(value);
                                      setUserMenuOpen(false);
                                    }}
                                  >
                                    <SelectTrigger className="h-11">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {tenants.map((tenant) => (
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
                                      setCurrentBranchId(value);
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
                                El cambio de empresa y sucursal solo esta disponible para el superadministrador.
                              </div>
                            )}

                            <Button
                              variant="destructive"
                              className="mt-4 h-12 w-full rounded-xl"
                              onClick={signOut}
                            >
                              Cerrar sesion
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
      {mobileSidebarOpen ? (
        <div className="fixed inset-0 z-[99990] xl:hidden">
          <button
            type="button"
            aria-label="Cerrar navegacion"
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div
            className="absolute inset-y-0 left-0 w-[min(88vw,340px)] p-4"
            onTouchStart={(e) => {
              const touch = e.touches[0];
              (e.currentTarget as HTMLElement).dataset.touchStartX = String(touch.clientX);
            }}
            onTouchEnd={(e) => {
              const startX = Number((e.currentTarget as HTMLElement).dataset.touchStartX ?? 0);
              const endX = e.changedTouches[0].clientX;
              if (startX - endX > 60) {
                setMobileSidebarOpen(false);
              }
            }}
          >
            <div className="mb-3 flex justify-end">
              <Button
                variant="secondary"
                size="icon"
                className="rounded-full"
                onClick={() => setMobileSidebarOpen(false)}
                aria-label="Cerrar menu"
              >
                <X className="size-4" />
              </Button>
            </div>
            <SidebarContent
              currentBranch={currentBranch ? currentBranch.name : "Sin sucursal asignada"}
              currentRoleLabel={roleLabels[currentRole]}
              currentTenantName={currentTenant.name}
              currentTenantPlan={currentTenant.plan}
              currentUserName={currentUser.fullName}
              navigationGroups={groups}
              navigationItems={allowedNav}
              navigationLoading={isBootstrapping}
              onNavigate={() => setMobileSidebarOpen(false)}
              pathname={pathname}
              supportEmail={currentTenant.branding.supportEmail}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
