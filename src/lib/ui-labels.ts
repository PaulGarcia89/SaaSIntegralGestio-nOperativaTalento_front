import type { ModuleKey, RoleKey, TenantDto, UserDto } from "@/lib/contracts";

export const roleLabels: Record<RoleKey, string> = {
  admin_saas: "Superadministrador",
  admin_plataforma: "Administrador de plataforma",
  admin_empresa: "Administrador de empresa",
  rrhh: "Gerente de RRHH",
  reclutador: "Reclutador",
  entrevistador: "Entrevistador",
  instructor: "Instructor",
  supervisor: "Supervisor",
  encargado_inventario: "Encargado de inventario",
  empleado: "Empleado",
  candidato: "Candidato",
};

export const moduleLabels: Record<ModuleKey, string> = {
  dashboard: "Panel principal",
  ats: "Reclutamiento ATS",
  onboarding: "Incorporación",
  training: "Capacitación",
  productivity: "Productividad asistida",
  inventory: "Inventario",
  admin: "Administración",
  reports: "Reportes",
  notifications: "Notificaciones",
  profile: "Perfil",
};

export const tenantStatusLabels = {
  active: "Activo",
  trial: "Prueba",
  suspended: "Suspendido",
} as const;

export const userStatusLabels = {
  active: "Activo",
  invited: "Invitado",
  suspended: "Suspendido",
} as const;

export const branchStatusLabels = {
  active: "Activa",
  inactive: "Inactiva",
} as const;

export const scopeLabels = {
  global: "General",
  tenant: "Empresa",
  module: "Módulo",
} as const;

export const moduleSourceLabels = {
  plan: "Plan",
  manual: "Manual",
} as const;

const technicalLabels: Record<string, string> = {
  ACTIVE: "Activo", INACTIVE: "Inactivo", ENABLED: "Habilitado", DISABLED: "Deshabilitado",
  PENDING: "Pendiente", PROCESSING: "Procesando", APPROVED: "Aprobado", REJECTED: "Rechazado",
  COMPLETED: "Completado", CANCELLED: "Cancelado", CANCELED: "Cancelado", FAILED: "Fallido",
  DELIVERED: "Entregado", SENT: "Enviado", OPENED: "Abierto", CLICKED: "Con clic",
  BOUNCED: "Rebotado", COMPLAINED: "Con queja", UNSUBSCRIBED: "Dado de baja",
  DRAFT: "Borrador", PUBLISHED: "Publicado", ARCHIVED: "Archivado", PAUSED: "Pausado",
  RETIRED: "Retirado", SCHEDULED: "Programado", CONFIRMED: "Confirmado", EXPIRED: "Vencido",
  OPEN: "Abierto", CLOSED: "Cerrado", READY: "Listo", IN_PROGRESS: "En curso",
  SUBMITTED: "Recibida", REVIEWING: "En revisión", INTERVIEW: "Entrevista", HIRED: "Contratada",
  WITHDRAWN: "Retirada", TRAINING: "Capacitación", OVERDUE: "Vencido",
  FULL_TIME: "Tiempo completo", PART_TIME: "Tiempo parcial", CONTRACT: "Contrato",
  TEMPORARY: "Temporal", INTERNSHIP: "Prácticas", ON_SITE: "Presencial", HYBRID: "Híbrido", REMOTE: "Remoto",
  INBOUND: "Recibido", OUTBOUND: "Enviado", CANDIDATE: "Candidato", RESPONSIBLE: "Responsable",
  MANUAL: "Manual", SYSTEM: "Sistema", USER: "Usuario", EMAIL: "Correo electrónico",
  PRESENTIAL: "Presencial", VIRTUAL: "Virtual", PHONE: "Teléfono", NO_SHOW: "No se presentó",
  LEAD: "Principal", PANELIST: "Panelista", SHADOW: "Observador", ACCEPTED: "Aceptado",
  DECLINED: "Rechazado", SUBSTITUTED: "Sustituido", ROOM: "Sala", VIDEO_ROOM: "Sala de video",
  EQUIPMENT: "Equipo", ACCESSIBILITY: "Accesibilidad", BOOKED: "Reservado",
  NONE: "Ninguno", GOOGLE_MEET: "Google Meet", MICROSOFT_TEAMS: "Microsoft Teams", ZOOM: "Zoom",
  GOOGLE: "Google Calendar", MICROSOFT: "Microsoft Outlook", SYNCED: "Sincronizado", DEAD_LETTER: "Envío agotado",
  STRONG_YES: "Sí rotundo", YES: "Sí", MIXED: "Mixto", NO: "No",
  RATING: "Calificación", TEXT: "Texto", BOOLEAN: "Sí o no", SIGNED: "Firmado",
  IMMEDIATE: "Inmediata", AFTER_OWN_SUBMISSION: "Después del envío propio",
  AFTER_ALL_SUBMITTED: "Después de todos los envíos", HIRING_MANAGER_ONLY: "Solo gerente de contratación",
  CRITICAL: "Crítica", HIGH: "Alta", MEDIUM: "Media", LOW: "Baja",
  EXPORT: "Exportación", ANONYMIZE: "Anonimización", DELETE: "Eliminación",
  CLEAN: "Limpio", SKIPPED: "Omitido", INFECTED: "Infectado", QUARANTINED: "En cuarentena",
  SUPERSEDED: "Reemplazado", APPLICATION_CONFIRMATION: "Confirmación de postulación",
  STAGE_UPDATE: "Actualización de etapa", INTERVIEW_SCHEDULED: "Entrevista programada",
  INTERVIEW_REMINDER: "Recordatorio de entrevista", INTERVIEW_RESCHEDULED: "Entrevista reprogramada",
  INTERVIEW_CANCELLED: "Entrevista cancelada", OFFER: "Oferta", APPROVAL_REQUEST: "Solicitud de aprobación",
  TENANT_ADMIN: "Administrador de empresa", HR_MANAGER: "Gerente de recursos humanos",
  SUPERVISOR: "Supervisor", INVENTORY_MANAGER: "Encargado de inventario", PLATFORM_ADMIN: "Administrador de plataforma",
  GLOBAL: "General", TENANT: "Empresa", BRANCH: "Sucursal",
  HOURLY: "Por hora", WEEKLY: "Semanal", BIWEEKLY: "Quincenal", MONTHLY: "Mensual", ANNUAL: "Anual",
  PENDING_APPROVAL: "Pendiente de aprobación", COUNTERED: "Con contrapropuesta",
  FINANCIAL: "Financiera", MANAGERIAL: "Gerencial", EMPLOYER: "Empresa",
  CHAIR: "Presidencia", OBSERVER: "Observador", APPROVE: "Aprobar", REJECT: "Rechazar",
  STRONG_APPROVE: "Aprobación firme", STRONG_REJECT: "Rechazo firme", DECIDED: "Decidido",
};

export function technicalLabel(value?: string | null) {
  if (!value) return "Sin definir";
  return technicalLabels[value] ?? value.replaceAll("_", " ").toLocaleLowerCase("es").replace(/^./, (letter) => letter.toLocaleUpperCase("es"));
}

export function getPreferredUserForTenant(
  users: UserDto[],
  tenantId: string,
  preserveSuperadmin: boolean,
) {
  const preferredRole = preserveSuperadmin ? "admin_saas" : "admin_empresa";

  return (
    users.find((user) => user.tenantId === tenantId && user.role === preferredRole) ??
    users.find((user) => user.tenantId === tenantId && user.role !== "admin_saas") ??
    users.find((user) => user.tenantId === tenantId) ??
    users[0] ??
    null
  );
}

export function getFallbackTenant(tenants: TenantDto[]) {
  return tenants[0] ?? null;
}
