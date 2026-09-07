import type { Tone } from "@/components/system";

/**
 * Vocabulario de la administración de la plataforma.
 *
 * Las pantallas de gobierno (empresas, planes, suscripción, facturación,
 * colas) estaban imprimiendo códigos del backend directamente en la interfaz:
 * `starter`, `past_due`, `TENANT_ADMIN`, `monthly`. Quien administra el
 * producto puede que reconozca «starter»; quien administra *su empresa*
 * —que también entra a varias de estas pantallas— no tiene por qué.
 *
 * Tres reglas, iguales que en el resto de diccionarios del proyecto:
 *
 * 1. El rótulo sale del diccionario. Un código que no esté descrito se
 *    humaniza (`past_due` → «Past due»), nunca se deja en mayúsculas ni se
 *    oculta: ocultarlo haría desaparecer un estado real de la pantalla.
 * 2. El tono lo decide el significado, no la marca. «Suspendido» es de aviso
 *    porque corta accesos, no porque el tenant use rojo.
 * 3. Un estado desconocido es NEUTRO, nunca rojo. Pintar de rojo lo que no
 *    entendemos entrena a la gente a ignorar el rojo.
 */

export type PlanTierCode = "starter" | "growth" | "enterprise";
export type TenantStatusCode = "active" | "trial" | "suspended";
export type SubscriptionStatusCode = "active" | "trial" | "past_due";
export type BillingCycleCode = "monthly" | "annual";

type Described = { label: string; detail: string; tone: Tone };

const PLAN_TIERS: Record<PlanTierCode, Described> = {
  starter: {
    label: "Inicial",
    detail: "Los módulos básicos y un tope bajo de personas, sucursales y almacenamiento.",
    tone: "neutral",
  },
  growth: {
    label: "Crecimiento",
    detail: "Suma los módulos operativos y amplía los topes de personas y sucursales.",
    tone: "info",
  },
  enterprise: {
    label: "Empresarial",
    detail: "Todos los módulos disponibles, sin los topes de los planes menores.",
    tone: "success",
  },
};

const TENANT_STATUS: Record<TenantStatusCode, Described> = {
  active: {
    label: "Activa",
    detail: "Su gente entra con normalidad y la facturación corre.",
    tone: "success",
  },
  trial: {
    label: "En prueba",
    detail: "Entra con normalidad, pero el acceso termina cuando vence la prueba.",
    tone: "info",
  },
  suspended: {
    label: "Suspendida",
    detail: "Nadie de esa empresa puede entrar. Los datos se conservan intactos.",
    tone: "warning",
  },
};

const SUBSCRIPTION_STATUS: Record<SubscriptionStatusCode, Described> = {
  active: { label: "Al día", detail: "La suscripción está pagada y vigente.", tone: "success" },
  trial: { label: "En prueba", detail: "Periodo de prueba en curso, todavía sin cobro.", tone: "info" },
  past_due: {
    label: "Pago vencido",
    detail: "El cobro no se completó. El acceso sigue abierto hasta que alguien lo suspenda.",
    tone: "danger",
  },
};

const BILLING_CYCLE: Record<BillingCycleCode, Described> = {
  monthly: { label: "Mensual", detail: "Se cobra cada mes.", tone: "neutral" },
  annual: { label: "Anual", detail: "Se cobra una vez al año.", tone: "neutral" },
};

/**
 * Convierte un código desconocido en algo legible: `past_due` → «Past due».
 * Se prefiere esto a mostrar la clave cruda porque el estado existe de verdad
 * y alguien tiene que poder leerlo.
 */
export function humanizeCode(code: string): string {
  const clean = code.trim().replace(/[_.-]+/g, " ").toLocaleLowerCase("es");
  if (!clean) return "Sin dato";
  return clean.charAt(0).toLocaleUpperCase("es") + clean.slice(1);
}

function describe(table: Record<string, Described>, code: unknown, fallbackDetail: string): Described {
  if (typeof code !== "string" || code.trim() === "") {
    return { label: "Sin dato", detail: "El servidor no informó este valor.", tone: "neutral" };
  }
  return table[code] ?? { label: humanizeCode(code), detail: fallbackDetail, tone: "neutral" };
}

export const planTierInfo = (code: unknown) =>
  describe(PLAN_TIERS, code, "Plan que este panel todavía no describe. Consulta el catálogo de planes.");
export const planTierLabel = (code: unknown) => planTierInfo(code).label;

export const tenantStatusInfo = (code: unknown) =>
  describe(TENANT_STATUS, code, "Estado de empresa que este panel todavía no describe.");
export const tenantStatusLabel = (code: unknown) => tenantStatusInfo(code).label;

export const subscriptionStatusInfo = (code: unknown) =>
  describe(SUBSCRIPTION_STATUS, code, "Estado de suscripción que este panel todavía no describe.");
export const subscriptionStatusLabel = (code: unknown) => subscriptionStatusInfo(code).label;

export const billingCycleInfo = (code: unknown) =>
  describe(BILLING_CYCLE, code, "Periodicidad de cobro que este panel todavía no describe.");
export const billingCycleLabel = (code: unknown) => billingCycleInfo(code).label;

/** Opciones listas para un desplegable, con el rótulo en español. */
export const PLAN_TIER_OPTIONS = (Object.keys(PLAN_TIERS) as PlanTierCode[]).map((value) => ({
  value,
  label: PLAN_TIERS[value].label,
}));

export const TENANT_STATUS_OPTIONS = (Object.keys(TENANT_STATUS) as TenantStatusCode[]).map((value) => ({
  value,
  label: TENANT_STATUS[value].label,
}));

/**
 * Suspender una empresa corta el acceso a toda su gente de golpe. Es la única
 * transición de estado del panel que necesita aviso, y hasta ahora se hacía
 * con un desplegable y el botón genérico «Guardar cambios».
 */
export function tenantStatusChangeWarning(
  before: unknown,
  after: unknown,
): { title: string; detail: string } | null {
  if (before === after) return null;
  if (after === "suspended") {
    return {
      title: "Suspender corta el acceso de toda la empresa",
      detail:
        "En cuanto se guarde, ninguna persona de esta empresa podrá entrar, ni siquiera quien la administra. Los datos se conservan y el acceso vuelve al reactivarla.",
    };
  }
  if (before === "suspended") {
    return {
      title: "Reactivar devuelve el acceso a toda la empresa",
      detail: "Su gente vuelve a poder entrar en cuanto se guarde, con los mismos permisos que tenía.",
    };
  }
  if (after === "trial") {
    return {
      title: "Pasar a prueba pone fecha de caducidad al acceso",
      detail: "El acceso seguirá abierto, pero terminará cuando venza el periodo de prueba.",
    };
  }
  return null;
}

/** Importes: sin moneda ni separadores, `$1250.5` no se lee. */
export function formatPrice(value: unknown, currency = "USD"): string {
  const number =
    typeof value === "number" ? value : typeof value === "string" && value.trim() !== "" ? Number(value) : Number.NaN;
  if (!Number.isFinite(number)) return "—";
  try {
    return new Intl.NumberFormat("es", { style: "currency", currency, maximumFractionDigits: 2 }).format(number);
  } catch {
    return `${currency} ${new Intl.NumberFormat("es", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(number)}`;
  }
}

export function formatDate(value: unknown): string {
  if (typeof value !== "string" || value.trim() === "") return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("es", { dateStyle: "medium" });
}

export function formatDateTime(value: unknown): string {
  if (typeof value !== "string" || value.trim() === "") return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("es", { dateStyle: "medium", timeStyle: "short" });
}

/**
 * Un identificador interno no es un nombre. Cuando hay que mostrarlo (para
 * soporte, por ejemplo) se acorta y se marca como lo que es, en vez de soltar
 * un UUID entero en medio de una frase.
 */
export function shortId(value: unknown): string {
  if (typeof value !== "string" || value.trim() === "") return "—";
  return value.length <= 12 ? value : `${value.slice(0, 8)}…`;
}

/**
 * El catálogo del backend nombra los planes con otros códigos que la
 * suscripción (`BASIC` frente a `starter`). La correspondencia estaba escrita
 * a mano dentro de un `find` de tres condiciones en la pantalla de
 * suscripciones; aquí queda en un solo sitio y con prueba.
 */
const PLAN_CATALOG_CODE: Record<PlanTierCode, "BASIC" | "PRO" | "ENTERPRISE"> = {
  starter: "BASIC",
  growth: "PRO",
  enterprise: "ENTERPRISE",
};

export function planCatalogCode(tier: unknown): "BASIC" | "PRO" | "ENTERPRISE" | null {
  return typeof tier === "string" && tier in PLAN_CATALOG_CODE
    ? PLAN_CATALOG_CODE[tier as PlanTierCode]
    : null;
}

/** Topes de un plan. Un `null` significa «sin tope», no «cero». */
export type PlanCaps = {
  maxUsers: number | null;
  maxBranches: number | null;
};

/** Lo que la empresa consume hoy. */
export type TenantUsage = {
  employeeCount?: number;
  branchCount?: number;
};

export type LimitBreach = { label: string; current: number; cap: number };

/**
 * Qué topes del plan elegido ya están superados por lo que la empresa tiene
 * hoy. Bajar de plan sin mirar esto deja a la empresa por encima de su propio
 * límite, y el producto no lo dice en ninguna parte.
 */
export function planLimitBreaches(caps: PlanCaps | null | undefined, usage: TenantUsage): LimitBreach[] {
  if (!caps) return [];
  const breaches: LimitBreach[] = [];
  const users = usage.employeeCount ?? 0;
  const branches = usage.branchCount ?? 0;
  if (typeof caps.maxUsers === "number" && users > caps.maxUsers) {
    breaches.push({ label: "Personas", current: users, cap: caps.maxUsers });
  }
  if (typeof caps.maxBranches === "number" && branches > caps.maxBranches) {
    breaches.push({ label: "Sucursales", current: branches, cap: caps.maxBranches });
  }
  return breaches;
}

/**
 * Fecha de renovación por defecto: un mes o un año desde hoy, según el ciclo.
 *
 * Existía como la cadena fija "2026-08-01" escrita en dos sitios, así que
 * toda suscripción nueva nacía con la misma fecha —correcta solo por
 * casualidad y solo durante unos meses—.
 */
export function defaultRenewalDate(cycle: unknown, from: Date = new Date()): string {
  const date = new Date(from.getTime());
  if (cycle === "annual") date.setFullYear(date.getFullYear() + 1);
  else date.setMonth(date.getMonth() + 1);
  return date.toISOString().slice(0, 10);
}
