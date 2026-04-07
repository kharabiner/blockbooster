"use client";

import { useState, useEffect } from "react";
import { Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import type { ModulePanelProps } from "./ModulePanel";

type AggItem = { data: { score: number } };

export function ScoreInputPanel({ slotId, moduleId, config }: ModulePanelProps) {
  const { data: session } = useSession();

  const label         = (config.label         as string)   ?? "점수 입력";
  const min           = (config.min           as number)   ?? 0;
  const max           = (config.max           as number)   ?? 100;
  const allowedEmails = (config.allowedEmails as string[]) ?? [];

  const isAllowed =
    allowedEmails.length === 0 ||
    (!!session?.user?.email && allowedEmails.includes(session.user.email));

  const [myScore,  setMyScore]  = useState<number | null>(null);
  const [draft,    setDraft]    = useState<number>(min);
  const [avg,      setAvg]      = useState<number | null>(null);
  const [count,    setCount]    = useState(0);
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    // 내 점수
    fetch(`/api/slots/${slotId}/modules/${moduleId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.data?.score != null) {
          setMyScore(d.data.score);
          setDraft(d.data.score);
        }
      });

    // 집계
    fetch(`/api/slots/${slotId}/modules/${moduleId}?aggregate=true`)
      .then((r) => r.json())
      .then(({ items, count: c }: { items: AggItem[]; count: number }) => {
        setCount(c);
        if (c > 0) {
          const sum = items.reduce((s, it) => s + (it.data?.score ?? 0), 0);
          setAvg(Math.round((sum / c) * 10) / 10);
        }
      });
  }, [slotId, moduleId]);

  async function handleSave() {
    if (!session) { toast.error("로그인 후 점수를 입력할 수 있습니다."); return; }
    setSaving(true);
    const res = await fetch(`/api/slots/${slotId}/modules/${moduleId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score: draft }),
    });
    setSaving(false);
    if (res.ok) {
      setMyScore(draft);
      toast.success("점수가 저장되었습니다.");
    } else {
      const d = await res.json().catch(() => ({}));
      toast.error(d?.error ?? "저장에 실패했습니다.");
    }
  }

  return (
    <div className="rounded-xl border-2 border-foreground/10 bg-card p-4 space-y-3">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-black flex items-center gap-1.5">
          {label}
          {!isAllowed && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
        </p>
        {avg !== null && (
          <span className="text-xs text-muted-foreground">
            평균 {avg} ({count}명)
          </span>
        )}
      </div>

      {isAllowed ? (
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={min}
            max={max}
            value={draft}
            onChange={(e) => setDraft(Number(e.target.value))}
            className="flex-1 accent-indigo-600"
          />
          <span className="w-12 text-center font-black text-lg tabular-nums">
            {draft}
          </span>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-black rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shrink-0"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "저장"}
          </button>
        </div>
      ) : (
        <div className="rounded-lg bg-muted/50 border border-dashed px-4 py-4 text-center space-y-1">
          <Lock className="h-4 w-4 mx-auto text-muted-foreground" />
          <p className="text-xs text-muted-foreground font-semibold">
            {session ? "이 항목에 입력 권한이 없습니다." : "로그인 후 이용할 수 있습니다."}
          </p>
        </div>
      )}

      {myScore !== null && (
        <p className="text-xs text-muted-foreground">내 점수: {myScore}</p>
      )}

      {/* 범위 힌트 */}
      <div className="flex justify-between text-[10px] text-muted-foreground/60">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
