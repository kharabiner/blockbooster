"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import type { ModulePanelProps } from "./ModulePanel";

export function StampPanel({ slotId, moduleId, config }: ModulePanelProps) {
  const { data: session } = useSession();
  const icon  = (config.icon  as string) ?? "⭐";
  const label = (config.label as string) ?? "방문 완료!";

  const [hasStamp, setHasStamp] = useState(false);
  const [loading,  setLoading]  = useState(false);

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
    toast.success(`${icon} ${label}`);
  }

  return (
    <div className="rounded-xl border-2 border-foreground/10 bg-card px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-3xl">{hasStamp ? icon : "○"}</span>
        <div>
          <p className="text-sm font-black">스탬프</p>
          <p className="text-xs text-muted-foreground">
            {hasStamp ? label : "이 부스를 방문하면 스탬프를 받을 수 있어요"}
          </p>
        </div>
      </div>
      {!hasStamp && (
        <button
          onClick={handleCollect}
          disabled={loading}
          className="px-3 py-1.5 bg-amber-500 text-white text-xs font-black rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "받기"}
        </button>
      )}
    </div>
  );
}
