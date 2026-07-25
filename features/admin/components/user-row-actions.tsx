"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/shared/modals/confirm-dialog";
import { suspendUserAction, banUserAction, reinstateUserAction, adjustPointsAction } from "@/actions/admin/users";
import type { AccountStatus } from "@prisma/client";

export function UserRowActions({ userId, status }: { userId: string; status: AccountStatus }) {
  const [, startTransition] = useTransition();
  const [suspendReason, setSuspendReason] = useState("");
  const [banReason, setBanReason] = useState("");
  const [pointsAmount, setPointsAmount] = useState("");
  const [pointsReason, setPointsReason] = useState("");

  return (
    <div className="flex items-center gap-2">
      <ConfirmDialog
        trigger={
          <Button variant="outline" size="sm">
            Adjust points
          </Button>
        }
        title="Adjust points"
        description="Positive to add, negative to deduct. This creates an audit-logged transaction."
        confirmLabel="Apply"
        onConfirm={async () => {
          const amount = Number(pointsAmount);
          if (!amount || !pointsReason.trim()) {
            toast.error("Enter an amount and a reason.");
            throw new Error("invalid");
          }
          const result = await adjustPointsAction({ userId, amount, reason: pointsReason });
          if (!result.success) throw new Error(result.message);
          toast.success("Points adjusted.");
        }}
      >
        <div className="space-y-2">
          <Input
            type="number"
            placeholder="Amount (e.g. -50 or 100)"
            value={pointsAmount}
            onChange={(e) => setPointsAmount(e.target.value)}
          />
          <Input placeholder="Reason" value={pointsReason} onChange={(e) => setPointsReason(e.target.value)} />
        </div>
      </ConfirmDialog>

      {status !== "ACTIVE" ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            startTransition(async () => {
              const result = await reinstateUserAction(userId);
              if (result.success) toast.success("User reinstated.");
            })
          }
        >
          Reinstate
        </Button>
      ) : (
        <>
          <ConfirmDialog
            trigger={
              <Button variant="outline" size="sm">
                Suspend
              </Button>
            }
            title="Suspend this account?"
            description="The user will be signed out on next request and unable to sign back in until reinstated."
            confirmLabel="Suspend"
            variant="destructive"
            onConfirm={async () => {
              if (!suspendReason.trim()) {
                toast.error("Give a reason.");
                throw new Error("invalid");
              }
              const result = await suspendUserAction({ userId, reason: suspendReason });
              if (!result.success) throw new Error(result.message);
              toast.success("User suspended.");
            }}
          >
            <Textarea placeholder="Reason" value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} rows={2} />
          </ConfirmDialog>

          <ConfirmDialog
            trigger={
              <Button variant="destructive" size="sm">
                Ban
              </Button>
            }
            title="Ban this account?"
            description="This is more severe than a suspension and should be reserved for serious/repeat violations."
            confirmLabel="Ban"
            variant="destructive"
            onConfirm={async () => {
              if (!banReason.trim()) {
                toast.error("Give a reason.");
                throw new Error("invalid");
              }
              const result = await banUserAction({ userId, reason: banReason });
              if (!result.success) throw new Error(result.message);
              toast.success("User banned.");
            }}
          >
            <Textarea placeholder="Reason" value={banReason} onChange={(e) => setBanReason(e.target.value)} rows={2} />
          </ConfirmDialog>
        </>
      )}
    </div>
  );
}
