import { requireAdmin } from "@/lib/auth/rbac";
import { db } from "@/lib/db/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EconomySettingsForm } from "@/features/admin/components/economy-settings-form";

export const metadata = { title: "Point economy" };

export default async function EconomyPage() {
  await requireAdmin();

  const [commissionSetting, startingPointsSetting] = await Promise.all([
    db.platformSetting.findUnique({ where: { key: "platform_commission_percent" } }),
    db.platformSetting.findUnique({ where: { key: "starting_buyer_points" } }),
  ]);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Point economy</h1>
        <p className="mt-1 text-sm text-muted-foreground">Configure platform-wide economics.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>Changes apply to new transactions only — past unlocks aren't recalculated.</CardDescription>
        </CardHeader>
        <CardContent>
          <EconomySettingsForm
            initialCommission={Number(commissionSetting?.value ?? 20)}
            initialStartingPoints={Number(startingPointsSetting?.value ?? 100)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
