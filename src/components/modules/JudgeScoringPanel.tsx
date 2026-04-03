"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { Loader2, Trophy } from "lucide-react";
import type { ModulePanelProps } from "./ModulePanel";

type CriteriaScore = Record<string, number>;
type AggItem = { data: CriteriaScore; userId: string | null };

export function JudgeScoringPanel({ slotId, moduleId, config, isOperator }: ModulePanelProps) {
  const { data: session } = useSession();
  const criteria = (config.criteria as string[]) ?? ["완성도", "창의성", "발표력"];
  const maxScore = (config.maxScore as number) ?? 10;

  const [myScores, setMyScores] = useState<CriteriaScore>(
    Object.fromEntries(criteria.map((c) => [c, 0]))
  );
  const [allScores, setAllScores] = useState<AggItem[]>([]);
  const [saving, setSaving] = useState(false);

  const totalMyScore = criteria.reduce((s, c) => s + (myScores[c] ?? 0), 0);
  const maxTotal = criteria.length * maxScore;

  function avgScore(criterion: string) {
    if (allScores.length === 0) return null;
    const total = allScores.reduce((s, item) => s + (item.data[criterion] ?? 0), 0);
    return Math.round((total / allScores.length) * 10) / 10;
  }

  const grandAvg =
    allScores.length > 0
      ? Math.round(
          (allScores.reduce(
            (s, item) => s + criteria.reduce((cs, c) => cs + (item.data[c] ?? 0), 0),
            0
          ) /
            allScores.length) *
            10
        ) / 10
      : null;

  useEffect(() => {
    fetch(`/api/slots/${slotId}/modules/${moduleId}`)
      .then((r) => r.json())
      .then((d) => { if (d?.data) setMyScores(d.data); });

    fetch(`/api/slots/${slotId}/modules/${moduleId}?aggregate=true`)
      .then((r) => r.json())
      .then(({ items }: { items: AggItem[] }) => setAllScores(items));
  }, [slotId, moduleId]);

  async function handleSave() {
    if (!session) { toast.error("로그인 후 채점할 수 있습니다."); return; }
    setSaving(true);
    await fetch(`/api/slots/${slotId}/modules/${moduleId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(myScores),
    });
    setSaving(false);
    toast.success("채점이 저장되었습니다!");

    // 집계 갱신
    fetch(`/api/slots/${slotId}/modules/${moduleId}?aggregate=true`)
      .then((r) => r.json())
      .then(({ items }: { items: AggItem[] }) => setAllScores(items));
  }

  return (
    <div className="rounded-xl border p-4 bg-card space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-medium">심사 채점</span>
        </div>
        {grandAvg !== null && (
          <span className="text-sm text-muted-foreground">
            평균 총점 {grandAvg}/{maxTotal} ({allScores.length}명)
          </span>
        )}
      </div>

      {/* 채점 입력 */}
      <div className="space-y-3">
        {criteria.map((criterion) => (
          <div key={criterion} className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-sm">{criterion}</Label>
              <div className="flex items-center gap-2">
                {avgScore(criterion) !== null && (
                  <span className="text-xs text-muted-foreground">평균 {avgScore(criterion)}</span>
                )}
                <span className="text-xs text-muted-foreground">/ {maxScore}</span>
              </div>
            </div>
            <Input
              type="number"
              min={0}
              max={maxScore}
              value={myScores[criterion] ?? 0}
              onChange={(e) =>
                setMyScores((prev) => ({
                  ...prev,
                  [criterion]: Math.min(maxScore, Math.max(0, Number(e.target.value))),
                }))
              }
              className="h-8"
            />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className="text-sm font-medium">
          내 총점: {totalMyScore} / {maxTotal}
        </span>
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
          채점 저장
        </Button>
      </div>
    </div>
  );
}
