import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { notificationRepository } from "@/services/data/repositories";
import type { NotificationRecord } from "@/services/notifications/NotificationEngine";

/** Reads real, persisted notifications (Stage 1: InAppNotificationSender
 *  now writes to IndexedDB instead of only logging — Standard 17.7). */
export function RecentNotificationsWidget() {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);

  useEffect(() => {
    notificationRepository
      .list({ page: 1, pageSize: 5, sortBy: "createdAt", sortDirection: "desc" })
      .then(({ items }) => setNotifications(items));
  }, []);

  if (notifications.length === 0) {
    return <p className="text-sm text-text-secondary">{t("dashboard.noNotifications")}</p>;
  }

  return (
    <ul className="flex flex-col gap-2 text-sm">
      {notifications.map((notification) => (
        <li key={notification.id} className={notification.read ? "text-text-secondary" : "font-medium text-text-primary"}>
          {t(notification.titleKey)}
        </li>
      ))}
    </ul>
  );
}
