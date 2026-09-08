"use client";

import { restaurantSectionForPath } from "@/lib/restaurant-navigation";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  BookOpenCheck,
  Boxes,
  Briefcase,
  BriefcaseBusiness,
  Building,
  Building2,
  ChartNoAxesCombined,
  ChevronDown,
  Cctv,
  ChevronRight,
  ClipboardCheck,
  Command,
  Compass,
  Eye,
  FileSignature,
  FileText,
  Gauge,
  GraduationCap,
  Landmark,
  LogOut,
  Menu,
  Network,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  UserCog,
  UserRound,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { roleLabels } from "@/lib/ui-labels";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { AccessibleCommandPalette, MobileDrawer } from "@/components/design-system";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DensityToggle, ThemeToggle } from "@/components/theme-toggle";
import { AppBreadcrumb } from "@/components/breadcrumb";
import { AccessDenied, AccessLoading } from "@/components/access-state";
import {
  evaluateRouteAccess,
  getRoutePolicy,
  itemsBySection,
  navSections,
  sectionForPath,
  visibleSections,
} from "@/lib/navigation";
import type { NavGroup, NavItem, NavSection } from "@/lib/navigation";
import { createTenantTheme } from "@/lib/tenant-branding";
import { ImpersonationBanner } from "@/components/design-system";
import { fetchNotifications } from "@/lib/backend";
import { LanguageSelector } from "@/components/language-selector";
import { useLocale } from "@/components/locale-provider";

/* ==========================================================================
   ARMAZÓN DE LA APLICACIÓN
   ==========================================================================
   Qué cambió respecto de la versión anterior y por qué:

   1. SE ELIMINA LA DOBLE CABECERA. El armazón pintaba una tarjeta con el
      nombre de la empresa como `h1`, el rol, las migas, el buscador y las
      acciones; encima, cada página pintaba su propio `PageHeader` con otro
      `h1` y otra fila de acciones. Dos titulares de nivel 1 por pantalla es un
      fallo de accesibilidad y, sobre todo, hacía imposible saber de un vistazo
      dónde estabas. Ahora el armazón aporta CONTEXTO (empresa, sucursal, rol,
      migas) en una franja fina y no titula; el único `h1` es el de la página.

   2. NAVEGACIÓN POR INTENCIÓN. Las 90 entradas se agrupan primero por sección
      —operación diaria, supervisión, reportes, administración, plataforma— y
      dentro de cada sección por área. Solo la sección activa aparece abierta.
      Antes las 10 áreas se listaban a la vez y el submenú de restaurante, con
      sus ~20 entradas, se desplegaba siempre.

   3. Z-INDEX TOKENIZADO. Convivían `z-30`, `z-40`, `z-[99999]` y `z-[999999]`
      decididos pantalla a pantalla. Ahora salen de la escala de `globals.css`.

   4. Se retira el degradado violeta-índigo del avatar, que era además el único
      «purple on white» del producto.
   ========================================================================== */

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
  productivity: Cctv,
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

/** Icono por sección. Refuerza la intención, no decora. */
const sectionIcons: Record<NavSection, LucideIcon> = {
  inicio: Gauge,
  ats: Briefcase,
  onboarding: FileSignature,
  training: GraduationCap,
  people: Users,
  // Una cámara, no personas: lo que se vigila son zonas y equipos. El icono
  // de personas era la razón por la que las dos secciones parecían la misma.
  productivity: Cctv,
  asset_inventory: Boxes,
  restaurant_inventory: UtensilsCrossed,
  reportes: ChartNoAxesCombined,
  administracion: Settings,
  plataforma: ShieldCheck,
};

type SidebarNavigationItem = Pick<NavItem, "href" | "label" | "group" | "section" | "icon" | "module" | "showInNavigation">;

type SidebarContentProps = {
  currentBranch: string;
  currentRoleLabel: string;
  currentTenantName: string;
  currentTenantPlan: string;
  currentUserName: string;
  brandName: string;
  brandAccent: string;
  navigationLoading: boolean;
  navigationItems: SidebarNavigationItem[] | undefined;
  pathname: string;
  supportEmail: string;
  onNavigate?: () => void;
  mobile?: boolean;
};

function localizedNavLabel(label: string, t: (key: string) => string) {
  const translated = t(`nav.${label}`);
  return translated === `nav.${label}` ? label : translated;
}

function localizedNavGroup(group: NavGroup, t: (key: string) => string) {
  const translated = t(`nav.group.${group}`);
  return translated === `nav.group.${group}` ? group : translated;
}

function localizedSection(section: NavSection, label: string, t: (key: string) => string) {
  const translated = t(`nav.section.${section}`);
  return translated === `nav.section.${section}` ? label : translated;
}

function localizedRoleLabel(role: string, t: (key: string) => string) {
  const key = `role.${role}`;
  const translated = t(key);
  return translated === key ? roleLabels[role as keyof typeof roleLabels] ?? role : translated;
}

function localizedPlanLabel(plan: string, t: (key: string) => string) {
  const key = `plan.${plan.toLowerCase()}`;
  const translated = t(key);
  return translated === key ? plan : translated;
}

function isActivePath(itemHref: string, pathname: string) {
  if (itemHref === pathname) return true;
  if (itemHref === "/dashboard") return pathname === itemHref;
  if (itemHref === "/admin") return pathname === itemHref;
  return pathname.startsWith(`${itemHref}/`);
}

/**
 * Las tres entradas de la navegación inferior de móvil.
 *
 * Se priorizan las del área en la que ya estás: cambiar de pantalla dentro de
 * la misma tarea es lo que se hace decenas de veces al día; saltar de área,
 * unas pocas, y para eso está el menú completo en la cuarta ranura.
 */
function getMobileQuickNavigation(items: readonly NavItem[], pathname: string) {
  const visible = items.filter((item) => item.showInNavigation !== false);
  const activeGroup = visible.find((item) => isActivePath(item.href, pathname))?.group;
  const priority = [
    ...visible.filter((item) => item.group === activeGroup),
    visible.find((item) => item.href === "/dashboard"),
    visible.find((item) => item.href === "/notifications"),
    ...visible,
  ].filter((item): item is NavItem => Boolean(item));

  return priority
    .filter((item, index) => priority.findIndex((candidate) => candidate.href === item.href) === index)
    .slice(0, 3);
}

/**
 * Raíces de inventario. Sus subpantallas cuelgan de ellas en vez de ocupar
 * ~28 sitios en el primer nivel del menú.
 */

/* --------------------------------------------------------------------------
   BARRA LATERAL
   -------------------------------------------------------------------------- */

function SidebarContent({
  currentBranch,
  currentRoleLabel,
  currentTenantName,
  currentTenantPlan,
  currentUserName,
  brandName,
  brandAccent,
  navigationItems,
  navigationLoading,
  onNavigate,
  mobile = false,
  pathname,
  supportEmail,
}: SidebarContentProps) {
  const { t } = useLocale();

  const items = navigationItems ?? [];
  const activeHref = items
    .filter((item) => isActivePath(item.href, pathname))
    .sort((left, right) => right.href.length - left.href.length)[0]?.href;

  const activeSection = sectionForPath(items as NavItem[], pathname);
  const sections = visibleSections(items as NavItem[]);

  // Abierta solo la sección donde estás. Es la diferencia entre un menú que se
  // lee de un vistazo y una lista de 90 enlaces.
  //
  // El usuario puede abrir otra sección a mano para curiosear sin salir de la
  // pantalla actual; eso es `pinnedSection`. Al navegar de verdad, la elección
  // manual caduca y la barra vuelve a seguir a la ruta.
  //
  // El ajuste se hace DURANTE el render y no en un efecto: es el patrón que
  // React documenta para «corregir estado cuando cambia una prop», y evita el
  // render en cascada que provoca llamar a setState dentro de useEffect.
  const [pinnedSection, setPinnedSection] = useState<NavSection | null>(null);
  const [trackedSection, setTrackedSection] = useState<NavSection>(activeSection);
  if (trackedSection !== activeSection) {
    setTrackedSection(activeSection);
    setPinnedSection(null);
  }
  const openSection = pinnedSection ?? activeSection;

  // En escritorio la barra vive en un contenedor de alto fijo (100svh): con
  // `h-full` el bloque de navegación (`flex-1 min-h-0 overflow-y-auto`) recibe
  // un alto real y se desplaza. Con solo `min-h-full` crecía por debajo del
  // borde, `overflow-hidden` lo recortaba y las últimas entradas del menú
  // quedaban inalcanzables. En el cajón móvil (< xl) desplaza el cajón
  // entero, así que ahí se mantiene `min-h-full`.
  return (
    <div className="flex min-h-full flex-col overflow-hidden rounded-xl border border-sidebar-border bg-sidebar text-sidebar-foreground xl:h-full">
      {/* ---- Marca y contexto ------------------------------------------- */}
      <div className="shrink-0 space-y-3 border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex size-9 shrink-0 items-center justify-center rounded-lg font-display text-sm font-bold text-surface-dark-ink"
            style={{ backgroundColor: brandAccent }}
          >
            {brandName.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-semibold">{brandName}</p>
            <p className="truncate text-2xs text-sidebar-foreground/60">
              {currentTenantPlan === "global"
                ? t("plan.global")
                : localizedPlanLabel(currentTenantPlan, t)}
            </p>
          </div>
        </div>

        {/* Contexto permanente: empresa, sucursal y quién eres. Es lo que el
            encargo pedía tener siempre a la vista, y ahora vive SOLO aquí. */}
        <dl className="space-y-1.5 rounded-lg border border-sidebar-border bg-sidebar-accent/60 p-3 text-xs">
          <div className="flex items-baseline justify-between gap-2">
            <dt className="shrink-0 text-sidebar-foreground/55">{t("branches.company")}</dt>
            <dd className="min-w-0 truncate text-right font-medium">{currentTenantName}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <dt className="shrink-0 text-sidebar-foreground/55">{t("branches.active")}</dt>
            <dd className="min-w-0 truncate text-right font-medium">{currentBranch}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-2 border-t border-sidebar-border pt-1.5">
            <dt className="shrink-0 text-sidebar-foreground/55">{currentRoleLabel}</dt>
            <dd className="min-w-0 truncate text-right font-medium">{currentUserName}</dd>
          </div>
        </dl>
      </div>

      {/* ---- Navegación --------------------------------------------------
          `flex-1` con desplazamiento propio: en escritorio la barra es fija y
          solo desplaza su lista, no la página entera. */}
      <nav
        aria-label={t("workspace.mainAccess")}
        className={cn(
          "min-h-0 flex-1 overflow-y-auto p-3",
          mobile && "pb-[calc(4rem+env(safe-area-inset-bottom))]",
        )}
      >
        {navigationLoading ? (
          <div className="space-y-2" aria-busy="true">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-9 animate-pulse rounded-md bg-sidebar-accent" />
            ))}
          </div>
        ) : (
          <ul className="space-y-1">
            {sections.map((sectionId) => {
              const meta = navSections.find((candidate) => candidate.id === sectionId)!;
              const SectionIcon = sectionIcons[sectionId];
              const groups = itemsBySection(items as NavItem[], sectionId);
              const open = openSection === sectionId;
              const containsActive = groups.some((group) =>
                group.items.some((item) => (item.href === activeHref || (sectionId === "restaurant_inventory" && restaurantSectionForPath(item.href)?.key === restaurantSectionForPath(pathname)?.key))),
              );
              const panelId = `nav-section-${sectionId}`;

              return (
                <li key={sectionId}>
                  <button
                    type="button"
                    onClick={() => setPinnedSection(open && sectionId !== activeSection ? null : open ? "inicio" : sectionId)}
                    aria-expanded={open}
                    aria-controls={panelId}
                    className={cn(
                      // Misma altura mínima que los enlaces: el título de sección es
                      // el control que se pulsa para abrirla, y en móvil medía 32px.
                      "flex min-h-[var(--control-h-base)] w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-xs font-semibold transition-colors",
                      containsActive
                        ? "text-sidebar-primary"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                    )}
                  >
                    <SectionIcon className="size-4 shrink-0" aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate uppercase tracking-[0.1em]">
                      {localizedSection(sectionId, meta.label, t)}
                    </span>
                    <ChevronRight
                      className={cn("size-3.5 shrink-0 transition-transform motion-reduce:transition-none", open && "rotate-90")}
                      aria-hidden="true"
                    />
                  </button>

                  {open ? (
                    <div id={panelId} className="mt-1 space-y-3 pb-2 pl-2">
                      {/* Un área sin elementos no se rotula: el encabezado
                          salía de `group.items` y la lista de una versión
                          filtrada, así que un área cuyos elementos se filtraban
                          enteros dejaba el rótulo solo. */}
                      {groups
                        .filter((group) => group.items.length > 0)
                        .map((group, _index, visibleGroups) => (
                        <div key={group.group}>
                          {/* El área solo se rotula si la sección tiene más de
                              una: con una sola, el rótulo repite la sección. */}
                          {visibleGroups.length > 1 ? (
                            <p className="px-2.5 pb-1 text-2xs font-medium uppercase tracking-[0.12em] text-sidebar-foreground/45">
                              {localizedNavGroup(group.group, t)}
                            </p>
                          ) : null}
                          <ul className="space-y-0.5">
                            {/* Sin submenú: cada módulo ya es una sección
                                plegable, y plegar dentro de lo plegado
                                escondía el módulo de quien lo contrató. Las 34
                                pantallas de restaurante se leen porque el área
                                las separa en operación, análisis y ajustes. */}
                            {group.items.map((item) => (
                              <li key={item.href}>
                                <SidebarLink
                                  href={item.href}
                                  label={localizedNavLabel(item.label, t)}
                                  icon={navigationIcons[item.icon]}
                                  active={(item.href === activeHref || (sectionId === "restaurant_inventory" && restaurantSectionForPath(item.href)?.key === restaurantSectionForPath(pathname)?.key))}
                                  onNavigate={onNavigate}
                                />
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </nav>

      {supportEmail ? (
        <p className="shrink-0 truncate border-t border-sidebar-border px-4 py-3 text-2xs text-sidebar-foreground/50">
          {supportEmail}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Enlace de la barra lateral.
 *
 * El estado activo se marca con un FILO ámbar a la izquierda además del fondo:
 * antes se pintaba con el color del tenant como fondo, así que en una empresa
 * con marca clara el enlace activo y el inactivo se distinguían poco, y quien
 * no percibe ese contraste no los distinguía en absoluto.
 */
function SidebarLink({
  href,
  label,
  icon: Icon,
  active,
  onNavigate,
  dense = false,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  onNavigate?: () => void;
  dense?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex items-center gap-2.5 rounded-md pl-3 pr-2.5 text-sm transition-colors",
        dense ? "py-1.5" : "py-2",
        active
          ? "bg-sidebar-accent font-medium text-sidebar-foreground"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
      )}
      style={{ minHeight: dense ? undefined : "var(--control-h-base)" }}
    >
      {active ? (
        <span aria-hidden="true" className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-sidebar-primary" />
      ) : null}
      <Icon className={cn("shrink-0", dense ? "size-3.5" : "size-4")} aria-hidden="true" />
      <span className="min-w-0 truncate">{label}</span>
    </Link>
  );
}

/**
 * Franja inferior que ocupa la navegación flotante de móvil: 3.75rem de alto
 * (48px de destino táctil + 2×6px de relleno del contenedor) más la separación
 * que la despega del borde, que ya absorbe el área segura del iPhone.
 *
 * `MobileActionBar` se apoya en esta variable para apilarse ENCIMA de la
 * navegación. Antes se dibujaba en `bottom-0` con `z-30` contra el `z-40` de la
 * navegación, de modo que en un iPhone la barra de navegación tapaba el botón
 * principal de las pantallas que la usan.
 *
 * Va aquí y no en `globals.css` porque solo es cierta mientras esa navegación
 * está en el árbol, y solo lo está dentro de este armazón: fuera de él,
 * `MobileActionBar` usa su valor de reserva.
 */
const MOBILE_NAV_SPACE_STYLE = {
  "--mobile-nav-space": "calc(3.75rem + max(0.75rem, env(safe-area-inset-bottom)))",
} as CSSProperties;

/* --------------------------------------------------------------------------
   ARMAZÓN
   -------------------------------------------------------------------------- */

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLocale();
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
    canAccessGlobalGovernance,
    can,
    hasModule,
    hasFeature,
  } = useAppStore();

  const routePolicy = useMemo(() => getRoutePolicy(pathname), [pathname]);
  const routeAccess = useMemo(() => {
    if (!routePolicy) return { allowed: false, code: "PERMISSION_DENIED" as const, reason: "Esta ruta no está registrada en la política de acceso." };
    const decision = evaluateRouteAccess(routePolicy, {
      sessionValid: accessContextVerified,
      globalContext: canAccessGlobalGovernance && !impersonation?.active,
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
  }, [accessContextVerified, allowedTenantIds, can, canAccessGlobalGovernance, currentBranch, currentRole, currentSubscriptionStatus, currentTenant.id, hasFeature, hasModule, impersonation?.active, routePolicy, subscriptionGraceEndsAt]);

  // Keep both inventory modules visible when the tenant has access to both.
  // RBAC and enabled-module checks have already been applied in allowedNav.
  const navigationForContext = allowedNav;
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
    queryFn: () => fetchNotifications({ page: 1, pageSize: 1, unreadOnly: true }),
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
  const workspaceBranch = isGlobalView ? "Todas las empresas" : currentBranch?.name ?? t("workspace.noBranch");
  const mobileQuickNavigation = useMemo(() => getMobileQuickNavigation(navigationForContext, pathname), [navigationForContext, pathname]);

  useEffect(() => {
    const root = document.documentElement;
    // La marca del tenant SIGUE pintando distintivos, chips y su propio texto.
    // Lo que ya NO repinta es `--ring` ni `--accent`:
    //  · `--ring` es el foco, y el foco es del sistema: su valor está validado
    //    a 3:1 contra cada superficie, cosa que un acento de tenant cualquiera
    //    no garantiza.
    //  · `--accent` es ahora el fondo de estado suspendido. Se le inyectaba un
    //    color al 93 % de luminosidad, que en tema oscuro dejaba el hover casi
    //    blanco. Era un defecto real del tema oscuro, no una decisión.
    root.style.setProperty("--primary", tenantTheme.primary);
    root.style.setProperty("--primary-foreground", tenantTheme.foreground);
    // Variantes de marca para TEXTO, con contraste ya validado a 4,5:1 contra
    // cada superficie. `globals.css` elige cuál aplica según el tema activo.
    root.style.setProperty("--brand-text-light", tenantTheme.textOnLight);
    root.style.setProperty("--brand-text-dark", tenantTheme.textOnDark);
    root.style.setProperty("--brand-text-sidebar", tenantTheme.textOnSidebar);
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
      const computedLeft = Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - margin);

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
      <div className="flex min-h-svh items-center justify-center p-6">
        <div className="w-full max-w-md rounded-xl border border-line bg-surface-1 p-8 text-center shadow-e2">
          <p className="text-sm text-ink-2">Cerrando sesión y redirigiendo al acceso principal…</p>
        </div>
      </div>
    );
  }

  if (!routeAccess.allowed) {
    return <AccessDenied reason={routeAccess.reason} code={routeAccess.code === "ALLOWED" ? "PERMISSION_DENIED" : routeAccess.code} requestId={routeAccess.requestId} />;
  }

  return (
    <div className="operational-shell min-h-svh" style={MOBILE_NAV_SPACE_STYLE}>
      <a
        href="#main-content"
        className="sr-only rounded-md focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[var(--z-skip-link)] focus:bg-action focus:px-4 focus:py-2 focus:text-sm focus:text-on-action focus:shadow-e3"
      >
        {t("workspace.skipContent")}
      </a>

      <AccessibleCommandPalette
        open={searchOpen}
        onOpenChange={setSearchOpen}
        items={navigationForContext.map((route) => ({
          id: route.href.replaceAll("/", "-") || "inicio",
          label: route.label,
          group: route.group,
          href: route.href,
        }))}
        onNavigate={(href) => router.push(href)}
      />

      <div className="mx-auto flex min-h-svh max-w-[1680px] gap-4 p-3 sm:p-4 xl:p-5">
        {/* ---- Barra lateral de escritorio -------------------------------- */}
        <aside className="hidden w-[264px] shrink-0 xl:block">
          <div className="sticky top-5 h-[calc(100svh-2.5rem)]">
            <SidebarContent
              currentBranch={workspaceBranch}
              brandName={isGlobalView ? "TalentOS" : currentTenant.branding.productName ?? currentTenant.name}
              brandAccent={tenantTheme.hex}
              currentRoleLabel={localizedRoleLabel(currentRole, t)}
              currentTenantName={workspaceName}
              currentTenantPlan={isGlobalView ? "global" : currentTenant.plan}
              currentUserName={currentUser.fullName}
              navigationItems={navigationForContext}
              navigationLoading={isBootstrapping}
              pathname={pathname}
              supportEmail={currentTenant.branding.supportEmail}
            />
          </div>
        </aside>

        {/* ---- Columna de contenido --------------------------------------- */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Franja de contexto. NO titula: aporta ubicación y accesos
              globales en una sola línea de 3rem. El `h1` es de la página. */}
          <header className="sticky top-0 z-[var(--z-sticky)] -mx-3 mb-4 border-b border-line bg-canvas/85 px-3 py-2 backdrop-blur sm:-mx-4 sm:px-4 xl:-mx-5 xl:px-5">
            <div className="flex items-center gap-2">
              <Button
                ref={mobileMenuButtonRef}
                variant="ghost"
                size="icon"
                onClick={() => setMobileSidebarOpen(true)}
                aria-label={t("workspace.openMenu")}
                className="shrink-0 xl:hidden"
              >
                <Menu className="size-4" aria-hidden="true" />
              </Button>

              <div className="min-w-0 flex-1">
                <AppBreadcrumb pathname={pathname} />
                {/* En móvil no hay migas útiles ni barra lateral a la vista, así
                    que el contexto de empresa y sucursal se muestra aquí. */}
                <p className="truncate text-2xs text-ink-3 xl:hidden">
                  {isGlobalView ? t("workspace.globalContext") : `${workspaceName} · ${workspaceBranch}`}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="hidden min-w-0 items-center gap-2 rounded-md border border-line bg-surface-1 px-3 py-1.5 text-sm text-ink-3 transition-colors hover:border-line-strong md:flex md:w-56 lg:w-72"
              >
                <Search className="size-4 shrink-0" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate text-left">{t("workspace.search")}</span>
                <kbd className="hidden shrink-0 items-center gap-0.5 rounded-xs border border-line px-1 font-mono text-2xs text-ink-3 lg:flex">
                  <Command className="size-2.5" aria-hidden="true" />K
                </kbd>
              </button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchOpen(true)}
                aria-label={t("workspace.search")}
                className="shrink-0 md:hidden"
              >
                <Search className="size-4" aria-hidden="true" />
              </Button>

              {/* Idioma y tema se cambian una vez cada mucho: en un teléfono
                  ocupaban ancho fijo que le hacía falta al contexto, y viven
                  en el menú de usuario. */}
              <div className="hidden shrink-0 items-center gap-2 sm:flex">
                <LanguageSelector compact />
                <DensityToggle />
                <ThemeToggle />
              </div>

              <Button variant="ghost" size="icon" className="relative shrink-0" asChild>
                <Link
                  href="/notifications"
                  aria-label={`${t("workspace.notifications")}${unreadNotifications ? `, ${unreadNotifications} sin leer` : ""}`}
                >
                  <Bell className="size-4" aria-hidden="true" />
                  {unreadNotifications > 0 ? (
                    <span className="absolute -right-0.5 -top-0.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-status-danger px-1 font-mono text-2xs font-semibold text-surface-dark-ink tabular-figures">
                      {unreadNotifications > 99 ? "99+" : unreadNotifications}
                    </span>
                  ) : null}
                </Link>
              </Button>

              <button
                ref={userMenuButtonRef}
                type="button"
                onClick={() => setUserMenuOpen((open) => !open)}
                aria-expanded={userMenuOpen}
                aria-haspopup="dialog"
                aria-label={t("workspace.userMenu")}
                className="flex shrink-0 items-center gap-2 rounded-full border border-line bg-surface-1 py-1 pl-1 pr-2 transition-colors hover:border-line-strong"
              >
                {/* Grafito con filo ámbar. El degradado violeta-índigo anterior
                    era el único «purple on white» del producto. */}
                <span
                  aria-hidden="true"
                  className="flex size-7 items-center justify-center rounded-full bg-action font-display text-2xs font-semibold text-on-action ring-1 ring-accent-fill/50"
                >
                  {userInitials}
                </span>
                <ChevronDown
                  className={cn("size-3.5 text-ink-3 transition-transform motion-reduce:transition-none", userMenuOpen && "rotate-180")}
                  aria-hidden="true"
                />
              </button>
            </div>
          </header>

          {impersonation?.active ? (
            <div className="mb-4">
              <ImpersonationBanner tenantName={currentTenant.name} />
            </div>
          ) : null}

          <main
            id="main-content"
            className="min-w-0 flex-1 space-y-6 pb-[calc(5rem+env(safe-area-inset-bottom))] xl:space-y-8 xl:pb-8"
          >
            {children}
          </main>
        </div>
      </div>

      {/* ---- Menú de usuario --------------------------------------------- */}
      {canUsePortal && userMenuOpen
        ? createPortal(
            <div
              ref={userMenuRef}
              role="dialog"
              aria-label={t("workspace.userMenu")}
              className="fixed z-[var(--z-popover)] w-[min(340px,calc(100vw-2rem))] touch-pan-y overflow-y-auto overflow-x-hidden overscroll-contain rounded-xl border border-line bg-surface-1 shadow-e4 [-webkit-overflow-scrolling:touch]"
              style={{
                top: `${userMenuPosition.top}px`,
                left: `${userMenuPosition.left}px`,
                maxHeight: `calc(100dvh - ${userMenuPosition.top}px - 16px)`,
              }}
            >
              <div className="border-b border-line p-4">
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="flex size-11 shrink-0 items-center justify-center rounded-full bg-action font-display text-sm font-semibold text-on-action ring-1 ring-accent-fill/50"
                  >
                    {userInitials}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-display text-base font-semibold text-ink-1">{currentUser.fullName}</p>
                    <p className="truncate text-sm text-ink-2">{localizedRoleLabel(currentRole, t)}</p>
                  </div>
                </div>

                <dl className="mt-3 space-y-1 rounded-lg bg-surface-2 p-3 text-sm">
                  <div className="flex items-baseline justify-between gap-2">
                    <dt className="text-ink-2">Empresa</dt>
                    <dd className="min-w-0 truncate text-right font-medium text-ink-1">{workspaceName}</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-2">
                    <dt className="text-ink-2">Sucursal</dt>
                    <dd className="min-w-0 truncate text-right font-medium text-ink-1">
                      {isGlobalView ? "No aplica" : currentBranch ? currentBranch.name : "Sin sucursal"}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-2">
                    <dt className="text-ink-2">Módulos activos</dt>
                    <dd className="font-mono text-right font-medium text-ink-1 tabular-figures">
                      {currentTenant.enabledModules.length}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="border-b border-line p-2">
                <Link
                  href="/profile"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-ink-1 transition-colors hover:bg-surface-2"
                >
                  <UserRound className="size-4 text-ink-3" aria-hidden="true" />
                  Mi perfil
                </Link>
                {can("admin.company") && hasModule("admin") ? (
                  <Link
                    href="/admin/company"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-ink-1 transition-colors hover:bg-surface-2"
                  >
                    <Settings className="size-4 text-ink-3" aria-hidden="true" />
                    Configuración
                  </Link>
                ) : null}
                {/* En móvil estos tres salen de la cabecera para dejarle ancho
                    al contexto de empresa, así que tienen que estar aquí: no
                    se pierde ninguna función, cambia dónde se toca. */}
                <div className="flex flex-wrap items-center gap-2 px-3 py-2 sm:hidden">
                  <LanguageSelector compact />
                  <DensityToggle />
                  <ThemeToggle />
                </div>
              </div>

              <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                {currentRole === "admin_saas" ? (
                  <div className="rounded-lg border border-line bg-surface-2 p-3">
                    <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-ink-3">Vista global</p>
                    <p className="mt-1.5 text-sm text-ink-2">
                      Acceso general a la plataforma sin selección de empresa o sucursal.
                    </p>
                  </div>
                ) : accessContextVerified && currentRole === "admin_plataforma" && can("platform.tenant.switch") && allowedTenantIds.length > 1 ? (
                  <div className="space-y-3 rounded-lg border border-line bg-surface-2 p-3">
                    <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-ink-3">Contexto de plataforma</p>
                    <label className="block space-y-1.5">
                      <span className="text-xs font-medium text-ink-2">Empresa</span>
                      <Select
                        value={currentTenant.id}
                        onValueChange={(value) => {
                          void setCurrentTenantId(value);
                          setUserMenuOpen(false);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {tenants
                            .filter((tenant) => allowedTenantIds.includes(tenant.id))
                            .map((tenant) => (
                              <SelectItem key={tenant.id} value={tenant.id}>
                                {tenant.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </label>
                    <label className="block space-y-1.5">
                      <span className="text-xs font-medium text-ink-2">Sucursal</span>
                      <Select
                        value={currentBranch?.id ?? ""}
                        onValueChange={(value) => {
                          void setCurrentBranchId(value);
                          setUserMenuOpen(false);
                        }}
                        disabled={tenantBranches.length === 0}
                      >
                        <SelectTrigger disabled={tenantBranches.length === 0}>
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
                    </label>
                  </div>
                ) : currentRole === "admin_empresa" ? (
                  <div className="space-y-3 rounded-lg border border-line bg-surface-2 p-3">
                    <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-ink-3">Contexto de empresa</p>
                    <p className="text-sm text-ink-2">{currentTenant.name}</p>
                    <label className="block space-y-1.5">
                      <span className="text-xs font-medium text-ink-2">Sucursal</span>
                      <Select
                        value={currentBranch?.id ?? ""}
                        onValueChange={(value) => {
                          void setCurrentBranchId(value);
                          setUserMenuOpen(false);
                        }}
                        disabled={tenantBranches.length === 0}
                      >
                        <SelectTrigger disabled={tenantBranches.length === 0}>
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
                    </label>
                  </div>
                ) : (
                  <p className="rounded-lg border border-dashed border-line px-3 py-3 text-sm text-ink-2">
                    El contexto de empresa y sucursal está determinado por tus asignaciones.
                  </p>
                )}

                <Button variant="destructive" className="mt-3 w-full" onClick={signOut}>
                  {t("workspace.signOut")}
                  <LogOut className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </div>,
            document.body,
          )
        : null}

      {/* ---- Navegación inferior de móvil --------------------------------
          Cuatro ranuras: tres destinos del área activa y el menú completo.
          `bg-surface-1` opaco y no translúcido: sobre una tabla con datos, un
          fondo con desenfoque deja el rótulo ilegible. */}
      <nav
        aria-label={t("workspace.mainAccess")}
        className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-[var(--z-mobile-nav)] grid grid-cols-4 gap-1 rounded-xl border border-line bg-surface-1 p-1.5 shadow-e3 xl:hidden"
      >
        {mobileQuickNavigation.map((item) => {
          const Icon = navigationIcons[item.icon];
          const isNotifications = item.href === "/notifications";
          const active = isActivePath(item.href, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              aria-label={
                isNotifications && unreadNotifications
                  ? `${item.label}, ${unreadNotifications} sin leer`
                  : item.label
              }
              className={cn(
                "relative flex min-h-12 min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-2xs font-medium transition-colors",
                active ? "bg-surface-3 text-ink-1" : "text-ink-2",
              )}
            >
              {/* El estado activo lleva filo ámbar además del fondo: en un
                  teléfono al sol, el fondo solo no se distingue. */}
              {active ? (
                <span aria-hidden="true" className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-accent-fill" />
              ) : null}
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              <span className="max-w-full truncate">{localizedNavLabel(item.label, t)}</span>
              {isNotifications && unreadNotifications ? (
                <span className="absolute right-1.5 top-1 min-w-3.5 rounded-full bg-status-danger px-1 text-center font-mono text-[9px] font-bold text-surface-dark-ink tabular-figures">
                  {unreadNotifications > 9 ? "9+" : unreadNotifications}
                </span>
              ) : null}
            </Link>
          );
        })}
        {Array.from({ length: Math.max(0, 3 - mobileQuickNavigation.length) }).map((_, index) => (
          <span key={`mobile-nav-placeholder-${index}`} aria-hidden="true" />
        ))}
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(true)}
          className="flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-2xs font-medium text-ink-2"
          aria-label={t("workspace.openMenu")}
        >
          <Menu className="size-4" aria-hidden="true" />
          {t("workspace.menu")}
        </button>
      </nav>

      <MobileDrawer open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen} title={t("workspace.openMenu")}>
        <SidebarContent
          currentBranch={workspaceBranch}
          brandName={isGlobalView ? "TalentOS" : currentTenant.branding.productName ?? currentTenant.name}
          brandAccent={tenantTheme.hex}
          currentRoleLabel={localizedRoleLabel(currentRole, t)}
          currentTenantName={workspaceName}
          currentTenantPlan={isGlobalView ? "global" : currentTenant.plan}
          currentUserName={currentUser.fullName}
          navigationItems={navigationForContext}
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
