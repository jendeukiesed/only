import { requireBuyer } from "@/lib/auth/rbac";
import { db } from "@/lib/db/prisma";
import { ProfileSettingsForm } from "@/features/buyer/components/profile-settings-form";
import { TwoFactorSettings } from "@/features/auth/components/two-factor-settings";
import { PushSubscribeToggle } from "@/features/notifications/components/push-subscribe-toggle";

export const metadata = { title: "Settings" };

export default async function BuyerSettingsPage() {
  const sessionUser = await requireBuyer();

  const user = await db.user.findUnique({
    where: { id: sessionUser.id },
    select: { name: true, bio: true, image: true, twoFactorEnabled: true },
  });
  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-display text-2xl font-semibold">Settings</h1>
      <ProfileSettingsForm
        initialName={user.name ?? ""}
        initialBio={user.bio ?? ""}
        initialImage={user.image ?? ""}
      />
      <TwoFactorSettings initialEnabled={user.twoFactorEnabled} />
      <PushSubscribeToggle />
    </div>
  );
}
