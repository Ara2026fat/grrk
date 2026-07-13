import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, Badge, Button, Spinner, EmptyState } from "@/design-system/primitives";
import { notificationRepository } from "@/services/data/repositories";
import type { NotificationRecord } from "@/services/notifications/NotificationEngine";

/**
 * Notification Center (Design System doc "Notification Center — Priority
 * levels"). Lists every persisted notification (the Dashboard widget only
 * shows the 5 most recent) with mark-as-read, and a click-through to the
 * affected entity where one exists. Reads through `notificationRepository`
 * only — no new data path.
 */
const categoryTone: Record<NotificationRecord["category"], "danger" | "warning" | "info"> = {
  expired: "danger",
  expiringSoon30: "danger",
  expiringSoon60: "warning",
  expiringSoon90: "info",
  restrictedProfession: "danger",
  missingDocument: "warning",
  duplicateRecord: "warning",
  system: "info",
};

export function NotificationCenterShell() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { items } = await notificationRepository.list({ sortBy: "createdAt", sortDirection: "desc" });
    setNotifications(items);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function markAsRead(notification: NotificationRecord) {
    await notificationRepository.update(notification.id, { read: true });
    setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)));
  }

  function goToEntity(notification: NotificationRecord) {
    if (notification.entityType === "employee") navigate(`/employees/${notification.entityId}`);
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-pageTitle font-bold text-text-primary">{t("nav.notifications")}</h1>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState title={t("common.noActivityYet")} />
      ) : (
        <ul className="flex flex-col gap-2">
          {notifications.map((notification) => (
            <li key={notification.id}>
              <Card className={notification.read ? "opacity-60" : undefined}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Badge tone={categoryTone[notification.category]}>{t(`notifications.category.${notification.category}`)}</Badge>
                      {!notification.read && <span className="h-2 w-2 rounded-full bg-brand-primary-500" aria-hidden />}
                    </div>
                    <button
                      className="text-start text-sm font-medium text-text-primary hover:underline"
                      onClick={() => goToEntity(notification)}
                    >
                      {t(notification.titleKey)}
                    </button>
                    {notification.detail && <p className="text-xs text-text-secondary">{notification.detail}</p>}
                    <time className="text-xs text-text-secondary">{new Date(notification.createdAt).toLocaleString()}</time>
                  </div>
                  {!notification.read && (
                    <Button variant="outline" onClick={() => markAsRead(notification)}>
                      {t("notifications.markAsRead")}
                    </Button>
                  )}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
