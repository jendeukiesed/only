import { Bell } from "lucide-react";
import { requireBuyer } from "@/lib/auth/rbac";
import { db } from "@/lib/db/prisma";
import { EmptyState } from "@/components/shared/empty-states/empty-state";
import { NotificationRow } from "@/features/notifications/components/notification-row";
import { MarkAllReadButton } from "@/features/notifications/components/mark-all-read-button";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const user = await requireBuyer();

  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">Stay on top of your activity.</p>
        </div>
        <MarkAllReadButton disabled={!hasUnread} />
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications yet" description="We'll let you know when something happens." />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <NotificationRow
              key={n.id}
              id={n.id}
              title={n.title}
              body={n.body}
              link={n.link}
              isRead={n.isRead}
              createdAt={n.createdAt.toISOString()}
            />
          ))}
        </div>
      )}
    </div>
  );
}
