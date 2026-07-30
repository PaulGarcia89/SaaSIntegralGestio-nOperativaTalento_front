"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  Bell,
  CheckCheck,
  ExternalLink,
  Mail,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { AsyncState } from "@/components/async-state";
import { DomainTable, StateCard } from "@/components/domain";
import { PageHeader } from "@/components/design-system";
import { MetricCard, SectionCard } from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/form-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ApiError,
  archiveNotification,
  deleteNotification,
  fetchNotificationDeliveries,
  fetchNotificationPreferences,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  retryNotificationDelivery,
  updateNotificationPreference,
} from "@/lib/backend";
import type {
  NotificationCategory,
  NotificationDeliveryDto,
  NotificationDto,
  NotificationPreferenceDto,
} from "@/lib/contracts";
import { useAppStore } from "@/store/app-store";

const categoryLabels: Record<NotificationCategory, string> = {
  GENERAL: "General",
  ATS: "Reclutamiento",
  ONBOARDING: "Incorporación",
  TRAINING: "Capacitación",
  INVENTORY: "Inventario",
  AUTOMATION: "Automatizaciones",
  SECURITY: "Seguridad",
  BILLING: "Facturación",
};

const frequencyOptions = [
  { label: "Inmediata", value: "IMMEDIATE" },
  { label: "Resumen diario", value: "DAILY" },
  { label: "Resumen semanal", value: "WEEKLY" },
  { label: "Desactivada", value: "DISABLED" },
];

function formatDate(value?: string | null) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusTone(status: NotificationDeliveryDto["status"]) {
  if (status === "DELIVERED") return "success" as const;
  if (status === "FAILED" || status === "DEAD_LETTER") return "destructive" as const;
  if (status === "SKIPPED") return "secondary" as const;
  return "warning" as const;
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { currentRole } = useAppStore();
  const [category, setCategory] = useState<NotificationCategory | "ALL">("ALL");
  const [status, setStatus] = useState<"active" | "archived">("active");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const canOperateDeliveries = currentRole === "admin_saas" || currentRole === "admin_empresa";

  const notifications = useQuery({
    queryKey: ["notifications", category, status, unreadOnly],
    queryFn: () =>
      fetchNotifications({
        category: category === "ALL" ? undefined : category,
        status,
        unreadOnly,
      }),
  });
  const preferences = useQuery({
    queryKey: ["notification-preferences"],
    queryFn: fetchNotificationPreferences,
  });
  const deliveries = useQuery({
    queryKey: ["notification-deliveries"],
    queryFn: () => fetchNotificationDeliveries(),
    enabled: canOperateDeliveries,
  });

  const refreshInbox = () =>
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  const mutateItem = useMutation({
    mutationFn: async ({
      action,
      id,
    }: {
      action: "read" | "archive" | "delete";
      id: string;
    }) => {
      if (action === "read") return markNotificationRead(id);
      if (action === "archive") return archiveNotification(id);
      return deleteNotification(id);
    },
    onSuccess: refreshInbox,
  });
  const markAll = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: refreshInbox,
  });
  const savePreference = useMutation({
    mutationFn: updateNotificationPreference,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["notification-preferences"] }),
  });
  const retryDelivery = useMutation({
    mutationFn: retryNotificationDelivery,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["notification-deliveries"] }),
  });

  const deliverySummary = useMemo(() => {
    const items = deliveries.data?.items ?? [];
    return {
      delivered: items.filter((item) => item.status === "DELIVERED").length,
      pending: items.filter((item) =>
        ["PENDING", "PROCESSING"].includes(item.status),
      ).length,
      failed: items.filter((item) =>
        ["FAILED", "DEAD_LETTER"].includes(item.status),
      ).length,
    };
  }, [deliveries.data]);

  if (notifications.isLoading) {
    return <AsyncState state="loading" title="Cargando tus notificaciones" />;
  }
  if (notifications.isError || !notifications.data) {
    const statusCode =
      notifications.error instanceof ApiError ? notifications.error.status : 500;
    return (
      <AsyncState
        state="error"
        title="No fue posible cargar la bandeja"
        description={
          statusCode === 401
            ? "Tu sesión expiró. Inicia sesión nuevamente."
            : statusCode === 403
              ? "Tu cuenta no tiene permiso para consultar notificaciones."
              : "Conservamos tus filtros. Reintenta la consulta para continuar."
        }
        onRetry={() => void notifications.refetch()}
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Centro de actividad"
        title="Notificaciones y automatizaciones"
        description="Consulta eventos importantes, configura cómo deseas recibirlos y supervisa entregas con trazabilidad."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => void notifications.refetch()}
            >
              <RefreshCw className="size-4" aria-hidden="true" />
              Actualizar
            </Button>
            <Button
              type="button"
              onClick={() => markAll.mutate()}
              disabled={notifications.data.unread === 0 || markAll.isPending}
            >
              <CheckCheck className="size-4" aria-hidden="true" />
              Marcar todas como leídas
            </Button>
          </div>
        }
      />

      <div className="grid gap-5 md:grid-cols-3">
        <MetricCard
          label="Sin leer"
          value={String(notifications.data.unread)}
          detail="Requieren tu revisión"
          period="Ahora"
        />
        <MetricCard
          label="En la vista"
          value={String(notifications.data.total)}
          detail={status === "archived" ? "Notificaciones archivadas" : "Notificaciones activas"}
          period="Histórico persistente"
        />
        <MetricCard
          label="Entregas con incidencia"
          value={canOperateDeliveries ? String(deliverySummary.failed) : "—"}
          detail={canOperateDeliveries ? "Fallidas o en dead letter" : "Visible para administradores"}
          period="Últimas 100 entregas"
        />
      </div>

      <Tabs defaultValue="inbox">
        <TabsList aria-label="Secciones del centro de notificaciones">
          <TabsTrigger value="inbox">Bandeja</TabsTrigger>
          <TabsTrigger value="preferences">Preferencias</TabsTrigger>
          {canOperateDeliveries ? (
            <TabsTrigger value="deliveries">Entregas</TabsTrigger>
          ) : null}
        </TabsList>

        <TabsContent value="inbox" className="space-y-5 pt-5">
          <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card/85 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={status === "active" ? "default" : "secondary"}
                onClick={() => setStatus("active")}
              >
                Activas
              </Button>
              <Button
                type="button"
                size="sm"
                variant={status === "archived" ? "default" : "secondary"}
                onClick={() => setStatus("archived")}
              >
                Archivadas
              </Button>
              <Button
                type="button"
                size="sm"
                variant={unreadOnly ? "default" : "secondary"}
                aria-pressed={unreadOnly}
                onClick={() => setUnreadOnly((current) => !current)}
              >
                Solo sin leer
              </Button>
            </div>
            <FormSelect
              aria-label="Filtrar por categoría"
              className="min-w-52"
              value={category}
              onValueChange={(value) => setCategory(value as NotificationCategory | "ALL")}
              options={[
                { label: "Todas las categorías", value: "ALL" },
                ...Object.entries(categoryLabels).map(([value, label]) => ({
                  value,
                  label,
                })),
              ]}
            />
          </div>

          {notifications.data.items.length === 0 ? (
            <StateCard
              tone="empty"
              title="No hay notificaciones en esta vista"
              description="Cuando un evento coincida con estos filtros aparecerá aquí."
            />
          ) : (
            <div className="space-y-3">
              {notifications.data.items.map((notification) => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  pending={mutateItem.isPending}
                  onAction={(action) =>
                    mutateItem.mutate({ action, id: notification.id })
                  }
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="preferences" className="pt-5">
          <SectionCard
            title="Cómo quieres recibir avisos"
            subtitle="Preferencias personales"
          >
            {preferences.isLoading ? (
              <AsyncState state="loading" title="Cargando preferencias" />
            ) : preferences.isError || !preferences.data ? (
              <AsyncState
                state="error"
                title="No fue posible cargar las preferencias"
                onRetry={() => void preferences.refetch()}
              />
            ) : (
              <div className="space-y-3">
                {preferences.data.map((preference) => (
                  <PreferenceRow
                    key={preference.category}
                    preference={preference}
                    pending={savePreference.isPending}
                    onSave={(next) => savePreference.mutate(next)}
                  />
                ))}
              </div>
            )}
          </SectionCard>
        </TabsContent>

        {canOperateDeliveries ? (
          <TabsContent value="deliveries" className="space-y-5 pt-5">
            <div className="grid gap-4 md:grid-cols-3">
              <MetricCard label="Entregadas" value={String(deliverySummary.delivered)} detail="Confirmadas por canal" period="Últimas 100" />
              <MetricCard label="Pendientes" value={String(deliverySummary.pending)} detail="En cola o procesamiento" period="Últimas 100" />
              <MetricCard label="Fallidas" value={String(deliverySummary.failed)} detail="Requieren revisión" period="Últimas 100" />
            </div>
            {deliveries.isLoading ? (
              <AsyncState state="loading" title="Consultando entregas" />
            ) : deliveries.isError || !deliveries.data ? (
              <AsyncState
                state="error"
                title="No fue posible cargar las entregas"
                onRetry={() => void deliveries.refetch()}
              />
            ) : deliveries.data.items.length === 0 ? (
              <StateCard tone="empty" title="Sin entregas registradas" description="Las entregas aparecerán cuando se generen nuevas notificaciones." />
            ) : (
              <DomainTable
                data={deliveries.data.items}
                getKey={(item) => item.id}
                columns={[
                  { key: "title", header: "Notificación", render: (item) => item.notification?.title ?? "Notificación" },
                  { key: "channel", header: "Canal", render: (item) => item.channel === "EMAIL" ? "Correo" : "Interna" },
                  { key: "status", header: "Estado", render: (item) => <Badge variant={statusTone(item.status)}>{item.status}</Badge>, exportValue: (item) => item.status },
                  { key: "attempts", header: "Intentos", sortable: true, render: (item) => `${item.attempts}/${item.maxAttempts}`, sortValue: (item) => item.attempts },
                  { key: "date", header: "Creada", render: (item) => formatDate(item.createdAt), sortValue: (item) => item.createdAt },
                  { key: "error", header: "Detalle", render: (item) => item.lastError ?? "Sin errores" },
                  {
                    key: "actions",
                    header: "Acciones",
                    excludeFromExport: true,
                    render: (item) =>
                      ["FAILED", "DEAD_LETTER"].includes(item.status) ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={retryDelivery.isPending}
                          onClick={() => retryDelivery.mutate(item.id)}
                        >
                          Reintentar
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">Sin acciones</span>
                      ),
                  },
                ]}
              />
            )}
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  );
}

function NotificationRow({
  notification,
  pending,
  onAction,
}: {
  notification: NotificationDto;
  pending: boolean;
  onAction: (action: "read" | "archive" | "delete") => void;
}) {
  return (
    <article
      className={`rounded-2xl border p-5 ${
        notification.readAt
          ? "border-border/70 bg-card/80"
          : "border-primary/30 bg-primary/5"
      }`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary">
            {notification.deliveries.some((item) => item.channel === "EMAIL") ? (
              <Mail className="size-5" aria-hidden="true" />
            ) : (
              <Bell className="size-5" aria-hidden="true" />
            )}
          </span>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold">{notification.title}</h2>
              <Badge variant="secondary">{categoryLabels[notification.category]}</Badge>
              {!notification.readAt ? <Badge variant="default">Nueva</Badge> : null}
            </div>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              {notification.message}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDate(notification.createdAt)}
              {notification.correlationId
                ? ` · ID ${notification.correlationId}`
                : ""}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {notification.actionUrl ? (
            <Button asChild size="sm" variant="secondary">
              <Link href={notification.actionUrl}>
                Abrir
                <ExternalLink className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          ) : null}
          {!notification.readAt ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={pending}
              onClick={() => onAction("read")}
            >
              Leída
            </Button>
          ) : null}
          {!notification.archivedAt ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={pending}
              onClick={() => onAction("archive")}
              aria-label={`Archivar ${notification.title}`}
            >
              <Archive className="size-4" aria-hidden="true" />
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={pending}
            onClick={() => onAction("delete")}
            aria-label={`Eliminar ${notification.title}`}
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </article>
  );
}

function PreferenceRow({
  preference,
  pending,
  onSave,
}: {
  preference: NotificationPreferenceDto;
  pending: boolean;
  onSave: (value: NotificationPreferenceDto) => void;
}) {
  const protectedCategory =
    preference.category === "SECURITY" || preference.category === "BILLING";
  return (
    <div className="grid gap-4 rounded-xl border border-border/70 p-4 lg:grid-cols-[1fr_auto_auto_220px] lg:items-center">
      <div>
        <p className="font-medium">{categoryLabels[preference.category]}</p>
        <p className="text-sm text-muted-foreground">
          {protectedCategory
            ? "Avisos críticos obligatorios para proteger tu cuenta y servicio."
            : "Configura los canales para esta categoría."}
        </p>
      </div>
      <label className="flex min-h-11 items-center gap-2">
        <input
          type="checkbox"
          checked={preference.internalEnabled}
          disabled={pending || protectedCategory}
          onChange={(event) =>
            onSave({ ...preference, internalEnabled: event.target.checked })
          }
        />
        Interna
      </label>
      <label className="flex min-h-11 items-center gap-2">
        <input
          type="checkbox"
          checked={preference.emailEnabled}
          disabled={pending || protectedCategory}
          onChange={(event) =>
            onSave({ ...preference, emailEnabled: event.target.checked })
          }
        />
        Correo
      </label>
      <FormSelect
        aria-label={`Frecuencia para ${categoryLabels[preference.category]}`}
        value={preference.frequency}
        disabled={pending || protectedCategory}
        onValueChange={(value) =>
          onSave({
            ...preference,
            frequency: value as NotificationPreferenceDto["frequency"],
          })
        }
        options={frequencyOptions}
      />
    </div>
  );
}
