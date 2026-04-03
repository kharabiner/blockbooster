"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import type { ModulePanelProps } from "./ModulePanel";

type RatingData = { stars: number };
type AggItem = { data: RatingData };

export function VisitorRatingPanel({ slotId, moduleId, config }: ModulePanelProps) {
  const { data: session } = useSession();
  const maxStars = (config.maxStars as number) ?? 5;
  const label = (config.label as string) ?? "이 부스를 평가해주세요";

  const [myRating, setMyRating] = useState<number>(0);
  const [hover, setHover] = useState<number>(0);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // 내 평점
    fetch(`/api/slots/${slotId}/modules/${moduleId}`)
      .then((r) => r.json())
      .then((d) => { if (d?.data?.stars) setMyRating(d.data.stars); });

    // 집계
    fetch(`/api/slots/${slotId}/modules/${moduleId}?aggregate=true`)
      .then((r) => r.json())
      .then(({ items, count }: { items: AggItem[]; count: number }) => {
        setTotalCount(count);
        if (count > 0) {
          const avg = items.reduce((s, item) => s + (item.data.stars ?? 0), 0) / count;
          setAvgRating(Math.round(avg * 10) / 10);
        }
      });
  }, [slotId, moduleId]);

  async function handleRate(stars: number) {
    if (!session) { toast.error("로그인 후 평가할 수 있습니다."); return; }
    setSaving(true);
    await fetch(`/api/slots/${slotId}/modules/${moduleId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stars }),
    });
    setSaving(false);
    setMyRating(stars);
    toast.success("평가가 저장되었습니다!");
  }

  return (
    <div className="rounded-xl border p-4 bg-card space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{label}</p>
        {avgRating !== null && (
          <span className="text-sm text-muted-foreground">
            평균 {avgRating}점 ({totalCount}명)
          </span>
        )}
      </div>
      <div className="flex gap-1">
        {Array.from({ length: maxStars }, (_, i) => i + 1).map((star) => (
          <button
            key={star}
            disabled={saving}
            onClick={() => handleRate(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="p-0.5 transition-transform hover:scale-110 disabled:opacity-50"
          >
            <Star
              className="h-7 w-7 transition-colors"
              fill={(hover || myRating) >= star ? "#f59e0b" : "transparent"}
              stroke={(hover || myRating) >= star ? "#f59e0b" : "currentColor"}
            />
          </button>
        ))}
      </div>
      {myRating > 0 && (
        <p className="text-xs text-muted-foreground">내 평가: {myRating}점</p>
      )}
    </div>
  );
}
