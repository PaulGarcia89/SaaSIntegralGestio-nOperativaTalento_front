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
import { useLocale } from "@/components/locale-provider";

function formatDate(value: string | null | undefined, locale: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat(locale, {
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
  const { locale, t } = useLocale();
  const categoryLabel = (category: NotificationCategory) => t(`notifications.category.${category}`);
  const frequencyOptions = [
    { label: t("notifications.immediate"), value: "IMMEDIATE" },
    { label: t("notifications.daily"), value: "DAILY" },
    { label: t("notifications.weekly"), value: "WEEKLY" },
    { label: t("notifications.disabled"), value: "DISABLED" },
  ];
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
    return <AsyncState state="loading" title={t("notifications.loading")} />;
  }
  if (notifications.isError || !notifications.data) {
    const statusCode =
      notifications.error instanceof ApiError ? notifications.error.status : 500;
    return (
      <AsyncState
        state="error"
        title={t("notifications.inboxError")}
        description={
          statusCode === 401
            ? t("notifications.sessionExpired")
            : statusCode === 403
              ? t("notifications.forbidden")
              : t("notifications.retryDescription")
        }
        onRetry={() => void notifications.refetch()}
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("notifications.eyebrow")}
        title={t("notifications.title")}
        description={t("notifications.description")}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => void notifications.refetch()}
            >
              <RefreshCw className="size-4" aria-hidden="true" />
              {t("notifications.refresh")}
            </Button>
            <Button
              type="button"
              onClick={() => markAll.mutate()}
              disabled={notifications.data.unread === 0 || markAll.isPending}
            >
              <CheckCheck className="size-4" aria-hidden="true" />
              {t("notifications.markAll")}
            </Button>
          </div>
        }
      />

      <div className="grid gap-5 md:grid-cols-3">
        <MetricCard
          label={t("notifications.unread")}
          value={String(notifications.data.unread)}
          detail={t("notifications.reviewRequired")}
          period={t("notifications.now")}
        />
        <MetricCard
          label={t("notifications.inView")}
          value={String(notifications.data.total)}
          detail={status === "archived" ? t("notifications.archived") : t("notifications.active")}
          period={t("notifications.persistentHistory")}
        />
        <MetricCard
          label={t("notifications.deliveryIssues")}
          value={canOperateDeliveries ? String(deliverySummary.failed) : "—"}
          detail={canOperateDeliveries ? t("notifications.failedOrDead") : t("notifications.adminOnly")}
          period={t("notifications.last100")}
        />
      </div>

      <Tabs defaultValue="inbox">
        <TabsList aria-label={t("notifications.inboxSections")}>
          <TabsTrigger value="inbox">{t("notifications.inbox")}</TabsTrigger>
          <TabsTrigger value="preferences">{t("notifications.preferences")}</TabsTrigger>
          {canOperateDeliveries ? (
            <TabsTrigger value="deliveries">{t("notifications.deliveries")}</TabsTrigger>
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
                {t("notifications.activeFilter")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant={status === "archived" ? "default" : "secondary"}
                onClick={() => setStatus("archived")}
              >
                {t("notifications.archivedFilter")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant={unreadOnly ? "default" : "secondary"}
                aria-pressed={unreadOnly}
                onClick={() => setUnreadOnly((current) => !current)}
              >
                {t("notifications.unreadFilter")}
              </Button>
            </div>
            <FormSelect
              aria-label={t("notifications.categoryFilter")}
              className="min-w-52"
              value={category}
              onValueChange={(value) => setCategory(value as NotificationCategory | "ALL")}
              options={[
                { label: t("notifications.allCategories"), value: "ALL" },
                ...Object.keys({ GENERAL: true, ATS: true, ONBOARDING: true, TRAINING: true, INVENTORY: true, AUTOMATION: true, SECURITY: true, BILLING: true }).map((value) => ({
                  value,
                  label: categoryLabel(value as NotificationCategory),
                })),
              ]}
            />
          </div>

          {notifications.data.items.length === 0 ? (
            <StateCard
              tone="empty"
              title={t("notifications.empty")}
              description={t("notifications.emptyDescription")}
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
                  locale={locale}
                  t={t}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="preferences" className="pt-5">
          <SectionCard
            title={t("notifications.receive")}
            subtitle={t("notifications.personalPreferences")}
          >
            {preferences.isLoading ? (
              <AsyncState state="loading" title={t("notifications.preferenceLoading")} />
            ) : preferences.isError || !preferences.data ? (
              <AsyncState
                state="error"
                title={t("notifications.preferenceError")}
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
                    categoryLabel={categoryLabel}
                    frequencyOptions={frequencyOptions}
                    t={t}
                  />
                ))}
              </div>
            )}
          </SectionCard>
        </TabsContent>

        {canOperateDeliveries ? (
          <TabsContent value="deliveries" className="space-y-5 pt-5">
            <div className="grid gap-4 md:grid-cols-3">
              <MetricCard label={t("notifications.delivered")} value={String(deliverySummary.delivered)} detail={t("notifications.confirmedByChannel")} period={t("notifications.last100")} />
              <MetricCard label={t("notifications.pending")} value={String(deliverySummary.pending)} detail={t("notifications.queued")} period={t("notifications.last100")} />
              <MetricCard label={t("notifications.failed")} value={String(deliverySummary.failed)} detail={t("notifications.needsReview")} period={t("notifications.last100")} />
            </div>
            {deliveries.isLoading ? (
              <AsyncState state="loading" title={t("notifications.deliveryLoading")} />
            ) : deliveries.isError || !deliveries.data ? (
              <AsyncState
                state="error"
                title={t("notifications.deliveryError")}
                onRetry={() => void deliveries.refetch()}
              />
            ) : deliveries.data.items.length === 0 ? (
              <StateCard tone="empty" title={t("notifications.noDeliveries")} description={t("notifications.deliveryDescription")} />
            ) : (
              <DomainTable
                data={deliveries.data.items}
                getKey={(item) => item.id}
                columns={[
                  { key: "title", header: t("notifications.notification"), render: (item) => item.notification?.title ?? t("notifications.notification") },
                  { key: "channel", header: t("notifications.channel"), render: (item) => item.channel === "EMAIL" ? t("notifications.email") : t("notifications.internal") },
                  { key: "status", header: t("notifications.status"), render: (item) => <Badge variant={statusTone(item.status)}>{item.status}</Badge>, exportValue: (item) => item.status },
                  { key: "attempts", header: t("notifications.attempts"), sortable: true, render: (item) => `${item.attempts}/${item.maxAttempts}`, sortValue: (item) => item.attempts },
                  { key: "date", header: t("notifications.created"), render: (item) => formatDate(item.createdAt, locale), sortValue: (item) => item.createdAt },
                  { key: "error", header: t("notifications.detail"), render: (item) => item.lastError ?? t("notifications.noErrors") },
                  {
                    key: "actions",
                    header: t("notifications.actions"),
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
                          {t("notifications.retry")}
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">{t("notifications.noActions")}</span>
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
  locale,
  t,
}: {
  notification: NotificationDto;
  pending: boolean;
  onAction: (action: "read" | "archive" | "delete") => void;
  locale: string;
  t: (key: string) => string;
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
              <Badge variant="secondary">{t(`notifications.category.${notification.category}`)}</Badge>
              {!notification.readAt ? <Badge variant="default">{t("notifications.new")}</Badge> : null}
            </div>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              {notification.message}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDate(notification.createdAt, locale)}
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
                {t("notifications.open")}
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
              {t("notifications.read")}
            </Button>
          ) : null}
          {!notification.archivedAt ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={pending}
              onClick={() => onAction("archive")}
              aria-label={`${t("notifications.archive")} ${notification.title}`}
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
            aria-label={`${t("notifications.delete")} ${notification.title}`}
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
  categoryLabel,
  frequencyOptions,
  t,
}: {
  preference: NotificationPreferenceDto;
  pending: boolean;
  onSave: (value: NotificationPreferenceDto) => void;
  categoryLabel: (category: NotificationCategory) => string;
  frequencyOptions: Array<{ label: string; value: string }>;
  t: (key: string) => string;
}) {
  const protectedCategory =
    preference.category === "SECURITY" || preference.category === "BILLING";
  return (
    <div className="grid gap-4 rounded-xl border border-border/70 p-4 lg:grid-cols-[1fr_auto_auto_220px] lg:items-center">
      <div>
        <p className="font-medium">{categoryLabel(preference.category)}</p>
        <p className="text-sm text-muted-foreground">
          {protectedCategory
            ? t("notifications.mandatory")
            : t("notifications.configureChannels")}
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
        {t("notifications.internalChannel")}
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
        {t("notifications.email")}
      </label>
      <FormSelect
        aria-label={`${t("notifications.frequency")} ${categoryLabel(preference.category)}`}
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
