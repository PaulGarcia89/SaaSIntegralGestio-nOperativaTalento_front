import { translate } from "@/i18n";
import type { SupportedLocale } from "@/i18n/types";
import type { HiringContractBlockerDto } from "@/lib/contracts";
import { explainHiringBlocker } from "@/lib/hiring-ux";
import type { OperationBlocker, OperationImpact } from "@/lib/operation-flow";

/**
 * Puente entre la contratación y el patrón universal de operaciones.
 *
 * Confirmar una contratación es exactamente lo que el patrón describe: una
 * operación con un impacto que se puede enumerar, un responsable, unos
 * bloqueos y una consecuencia irreversible. Hasta ahora se resolvía con un
 * diálogo de «¿Estás seguro?» y un párrafo suelto que enumeraba a mano lo que
 * iba a pasar; ese párrafo y la comprobación de si se podía confirmar vivían en
 * sitios distintos y podían discrepar.
 *
 * Este módulo NO llama al backend ni conoce React: recibe lo que ya se sabe de
 * la pantalla y devuelve el impacto. Por eso se puede probar.
 */

/**
 * Cómo se resuelve cada bloqueo, en imperativo.
 *
 * `explainHiringBlocker` ya dice qué falta (`what`), por qué (`why`), quién
 * (`who`) y qué se desbloquea (`unlocks`), pero ninguno de los cuatro dice qué
 * hacer AHORA. Sin esa frase, el usuario sabe que está bloqueado y no sabe
 * hacia dónde ir.
 */
const RESOLUTION_KEYS: Record<string, string> = {
  REQUIRED_DOCUMENTS_MISSING: "hiring.blocker.docs.fix",
  SIGNATURES_PENDING: "hiring.blocker.signatures.fix",
  WAITING_CANDIDATE: "hiring.blocker.waiting.fix",
  OFFER_NOT_CONFIGURED: "hiring.blocker.offer.fix",
};

export function hiringBlockerToOperationBlocker(
  blocker: HiringContractBlockerDto,
  candidateName: string,
  locale: SupportedLocale = "es",
): OperationBlocker {
  const explained = explainHiringBlocker(blocker, candidateName, locale);
  const key = RESOLUTION_KEYS[explained.code] ?? "hiring.blocker.default.fix";
  return {
    code: explained.code,
    cause: explained.what,
    owner: explained.who,
    resolution: translate(locale, key),
    fieldId: blocker.field ?? undefined,
  };
}

export type HiringConfirmationInput = {
  candidateName: string;
  roleTitle: string;
  branchName: string;
  /** Salario ya formateado por la pantalla, o `null` si la oferta no lo fija. */
  salaryText: string | null;
  /** Fecha de inicio ya formateada, o `null`. */
  startDateText: string | null;
  documentsTotal: number;
  documentsApproved: number;
  pendingDocuments: number;
  hasOnboardingFlow: boolean;
  /** Quién queda registrado en la auditoría. */
  responsible: string;
  blockers: readonly HiringContractBlockerDto[];
  locale?: SupportedLocale;
};

/**
 * Impacto de confirmar una contratación.
 *
 * `irreversible` es SIEMPRE cierto y no una opción: confirmar crea el
 * expediente del empleado, vincula sus documentos y prepara su acceso, y el
 * producto no ofrece deshacer nada de eso. Presentarlo como reversible sería
 * mentir sobre la consecuencia más importante de la pantalla.
 */
export function hiringConfirmationImpact(input: HiringConfirmationInput): OperationImpact {
  const locale = input.locale ?? "es";
  const t = (key: string, params?: Record<string, string | number>) => translate(locale, key, params);

  const lines: OperationImpact["lines"] = [
    {
      label: t("hiring.impact.employeeProfile"),
      before: t("hiring.impact.doesNotExist"),
      after: t("hiring.impact.created"),
    },
    {
      label: t("hiring.impact.documents"),
      before: t("hiring.impact.inHiringFile", { count: input.documentsTotal }),
      after: t("hiring.impact.inEmployeeFile", { count: input.documentsApproved }),
    },
    {
      label: t("hiring.impact.platformAccess"),
      before: t("hiring.impact.noAccount"),
      after: t("hiring.impact.accountPrepared"),
    },
  ];

  if (input.hasOnboardingFlow) {
    lines.push({
      label: t("hiring.impact.welcomePlan"),
      before: t("hiring.impact.notStarted"),
      after: t("hiring.impact.opens"),
    });
  }

  if (input.startDateText) {
    lines.push({
      label: t("hiring.impact.startDate"),
      before: t("hiring.impact.undefined"),
      after: input.startDateText,
    });
  }

  const warnings: OperationImpact["warnings"] = [];

  // Un documento sin aprobar que no llega a bloquear sigue mereciendo un aviso:
  // el expediente del empleado nacerá incompleto.
  if (input.pendingDocuments > 0 && input.blockers.length === 0) {
    warnings.push({
      code: "DOCS_PENDING_NON_BLOCKING",
      message: t("hiring.impact.warnPendingDocs", { count: input.pendingDocuments }),
    });
  }

  if (!input.salaryText) {
    warnings.push({ code: "NO_SALARY", message: t("hiring.impact.warnNoSalary") });
  }

  return {
    headline: t("hiring.impact.headline", {
      name: input.candidateName,
      role: input.roleTitle,
      branch: input.branchName,
    }),
    affectedCount: 1,
    affectedLabel: t("hiring.impact.affectedLabel"),
    lines,
    cost: input.salaryText
      ? { label: t("hiring.impact.agreedSalary"), amount: input.salaryText }
      : undefined,
    warnings,
    blockers: input.blockers.map((blocker) =>
      hiringBlockerToOperationBlocker(blocker, input.candidateName, locale),
    ),
    responsible: input.responsible,
    irreversible: true,
  };
}
