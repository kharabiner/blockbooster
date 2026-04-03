"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import type { ModulePanelProps } from "./ModulePanel";

export function StampRallyPanel({ slotId, moduleId, config }: ModulePanelProps) {
  const { data: session } = useSession();
  const icon = (config.stampIcon as string) ?? "⭐";

  const [hasStamp, setHasStamp] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/slots/${slotId}/modules/${moduleId}`)
      .then((r) => r.json())
      .then((d) => { if (d?.data?.collected) setHasStamp(true); });
  }, [slotId, moduleId]);

  async function handleCollect() {
    if (!session) { toast.error("로그인 후 스탬프를 받을 수 있습니다."); return; }
    setLoading(true);
    await fetch(`/api/slots/${slotId}/modules/${moduleId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collected: true, collectedAt: new Date().toISOString() }),
    });
    setLoading(false);
    setHasStamp(true);
    toast.success(`${icon} 스탬프를 획득했습니다!`);
  }

  return (
    <div className="rounded-xl border p-4 bg-card flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-3xl">{hasStamp ? icon : "○"}</span>
        <div>
          <p className="text-sm font-medium">스탬프 랠리</p>
          <p className="text-xs text-muted-foreground">
            {hasStamp ? "스탬프를 획득했습니다!" : "이 부스를 방문하면 스탬프를 받을 수 있어요"}
          </p>
        </div>
      </div>
      {!hasStamp && (
        <Button size="sm" onClick={handleCollect} disabled={loading}>
          스탬프 받기
        </Button>
      )}
    </div>
  );
}
