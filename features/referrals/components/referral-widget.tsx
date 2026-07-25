"use client";

import { useState } from "react";
import { Gift, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ReferralWidgetProps {
  referralUrl: string;
  referralCount: number;
}

/** Renders on both the buyer and seller dashboards (either role can refer
 *  either role — the bonus in services/referrals/grant-bonus.ts doesn't
 *  care what role the referred account signs up as). Copying is the whole
 *  interaction, so this is a thin client component rather than a full
 *  feature module. */
export function ReferralWidget({ referralUrl, referralCount }: ReferralWidgetProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      toast.success("Referral link copied.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — select and copy the link manually.");
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-premium">
      <div className="mb-3 flex items-center gap-2">
        <Gift className="size-5 text-brand" />
        <div>
          <p className="font-display text-sm font-semibold">Invite friends, earn points</p>
          <p className="text-xs text-muted-foreground">
            You and your friend each get a bonus once they unlock their first photo.
            {referralCount > 0 && ` ${referralCount} friend${referralCount === 1 ? "" : "s"} joined so far.`}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <Input readOnly value={referralUrl} className="font-mono text-xs" onFocus={(e) => e.currentTarget.select()} />
        <Button type="button" variant="outline" size="icon" onClick={handleCopy} aria-label="Copy referral link">
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        </Button>
      </div>
    </div>
  );
}
