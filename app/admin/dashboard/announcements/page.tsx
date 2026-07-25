import { requireAdmin } from "@/lib/auth/rbac";
import { db } from "@/lib/db/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { AnnouncementForm } from "@/features/admin/components/announcement-form";
import { AnnouncementToggle } from "@/features/admin/components/announcement-toggle";
import { formatRelativeTime } from "@/utils/format";

export const metadata = { title: "Announcements" };

export default async function AnnouncementsPage() {
  await requireAdmin();
  const announcements = await db.announcement.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Announcements</h1>
        <p className="mt-1 text-sm text-muted-foreground">Platform-wide notices.</p>
      </div>

      <Card>
        <CardContent className="p-5">
          <AnnouncementForm />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="divide-y divide-border p-0">
          {announcements.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-4 p-4">
              <div>
                <p className="text-sm font-medium">{a.title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{a.body}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatRelativeTime(a.createdAt)}</p>
              </div>
              <AnnouncementToggle id={a.id} isActive={a.isActive} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
