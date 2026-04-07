"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import type { ModulePanelProps } from "./ModulePanel";

type ReactionCounts = Record<string, number>;
type MyData = { reaction: string };

export function ReactionPanel({ slotId, moduleId, config }: ModulePanelProps) {
  const { data: session } = useSession();
  const options = (config.options as string[]) ?? ["👍", "🔥", "💡"];

  const [counts, setCounts]  = useState<ReactionCounts>({});
  const [mine,   setMine]    = useState<string | null>(null);
  const [saving, setSaving]  = useState(false);

  useEffect(() => {
    // 내 반응
    fetch(`/api/slots/${slotId}/modules/${moduleId}`)
      .then((r) => r.json())
      .then((d: { data?: MyData } | null) => {
        if (d?.data?.reaction) setMine(d.data.reaction);
      });

    // 전체 집계
    fetch(`/api/slots/${slotId}/modules/${moduleId}?aggregate=true`)
      .then((r) => r.json())
      .then(({ items }: { items: { data: MyData }[] }) => {
        const c: ReactionCounts = {};
        for (const item of items) {
          const r = item.data?.reaction;
          if (r) c[r] = (c[r] ?? 0) + 1;
        }
        setCounts(c);
      });
  }, [slotId, moduleId]);

  async function handleReact(emoji: string) {
    if (!session) { toast.error("로그인 후 반응을 남길 수 있습니다."); return; }
    const next = mine === emoji ? null : emoji; // 같은 거 누르면 취소
    setSaving(true);

    const res = await fetch(`/api/slots/${slotId}/modules/${moduleId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reaction: next }),
    });

    setSaving(false);
    if (res.ok) {
      setCounts((prev) => {
        const updated = { ...prev };
        if (mine)  updated[mine]  = Math.max(0, (updated[mine]  ?? 1) - 1);
        if (next)  updated[next]  = (updated[next] ?? 0) + 1;
        return updated;
      });
      setMine(next);
    }
  }

  return (
    <div className="rounded-xl border-2 border-foreground/10 bg-card px-4 py-3">
      <div className="flex items-center gap-2 flex-wrap">
        {options.map((emoji) => {
          const selected = mine === emoji;
          const c = counts[emoji] ?? 0;
          return (
            <button
              key={emoji}
              onClick={() => handleReact(emoji)}
              disabled={saving}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full border-2 text-sm font-bold transition-all
                ${selected
                  ? "border-indigo-400 bg-indigo-100 text-indigo-800 scale-105"
                  : "border-foreground/15 bg-background hover:border-indigo-300 hover:bg-indigo-50"
                } disabled:opacity-50`}
            >
              <span>{emoji}</span>
              {c > 0 && <span className="text-xs tabular-nums">{c}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
