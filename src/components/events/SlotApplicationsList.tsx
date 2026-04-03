"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, X, Loader2 } from "lucide-react";

type Application = {
  id: string;
  message: string | null;
  slot: { id: string; label: string | null; posX: number; posY: number };
  booth: { name: string; owner: { name: string | null } };
  applicant: { name: string | null };
};

export function SlotApplicationsList({ applications }: { applications: Application[] }) {
  const [items, setItems] = useState(applications);
  const [processing, setProcessing] = useState<string | null>(null);

  async function handleAction(slotId: string, appId: string, action: "ACCEPTED" | "REJECTED") {
    setProcessing(appId);
    const res = await fetch(`/api/slots/${slotId}/applications/${appId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setProcessing(null);

    if (!res.ok) { toast.error("처리에 실패했습니다."); return; }

    setItems((prev) => prev.filter((a) => a.id !== appId));
    toast.success(action === "ACCEPTED" ? "신청이 수락되었습니다!" : "신청이 거절되었습니다.");
  }

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">모든 신청이 처리되었습니다.</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((app) => (
        <div key={app.id} className="flex items-start gap-3 p-3 rounded-lg border">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{app.booth.name}</span>
              <span className="text-xs text-muted-foreground">by {app.booth.owner.name}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              슬롯: {app.slot.label ?? `(${app.slot.posX}, ${app.slot.posY})`}
            </p>
            {app.message && (
              <p className="text-xs mt-1 text-muted-foreground italic">"{app.message}"</p>
            )}
          </div>
          <div className="flex gap-1.5 flex-shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-green-600 border-green-200 hover:bg-green-50"
              onClick={() => handleAction(app.slot.id, app.id, "ACCEPTED")}
              disabled={processing === app.id}
            >
              {processing === app.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => handleAction(app.slot.id, app.id, "REJECTED")}
              disabled={processing === app.id}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
