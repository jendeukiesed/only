"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { resolveReportAction } from "@/actions/admin/reports";

export function ReportRowActions({ reportId }: { reportId: string }) {
  const [isPending, startTransition] = useTransition();

  function resolve(status: "ACTION_TAKEN" | "DISMISSED") {
    startTransition(async () => {
      const result = await resolveReportAction({ reportId, status });
      if (result.success) toast.success(status === "ACTION_TAKEN" ? "Marked as actioned." : "Dismissed.");
    });
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" variant="brand" disabled={isPending} onClick={() => resolve("ACTION_TAKEN")}>
        Take action
      </Button>
      <Button size="sm" variant="outline" disabled={isPending} onClick={() => resolve("DISMISSED")}>
        Dismiss
      </Button>
    </div>
  );
}
