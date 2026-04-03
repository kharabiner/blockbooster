"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const STATUSES = ["DRAFT", "PUBLISHED", "ONGOING", "ENDED"] as const;
type Status = typeof STATUSES[number];

const STATUS_LABEL: Record<Status, string> = {
  DRAFT: "준비중",
  PUBLISHED: "모집중",
  ONGOING: "진행중",
  ENDED: "종료",
};

const NEXT_STATUS: Partial<Record<Status, Status>> = {
  DRAFT: "PUBLISHED",
  PUBLISHED: "ONGOING",
  ONGOING: "ENDED",
};

const NEXT_LABEL: Partial<Record<Status, string>> = {
  DRAFT: "모집 시작",
  PUBLISHED: "행사 시작",
  ONGOING: "행사 종료",
};

type Props = { eventId: string; currentStatus: string };

export function EventStatusControl({ eventId, currentStatus }: Props) {
  const [status, setStatus] = useState<Status>(currentStatus as Status);
  const [loading, setLoading] = useState(false);

  const next = NEXT_STATUS[status];

  async function handleTransition() {
    if (!next) return;
    setLoading(true);
    const res = await fetch(`/api/events/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setLoading(false);

    if (!res.ok) { toast.error("상태 변경에 실패했습니다."); return; }
    setStatus(next);
    toast.success(`이벤트가 "${STATUS_LABEL[next]}" 상태로 변경되었습니다.`);
  }

  return (
    <div className="flex items-center gap-4">
      <Badge
        variant={status === "ENDED" ? "outline" : status === "DRAFT" ? "secondary" : "default"}
        className="text-sm px-3 py-1"
      >
        {STATUS_LABEL[status]}
      </Badge>
      {next && (
        <Button size="sm" onClick={handleTransition} disabled={loading}>
          {loading && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
          {NEXT_LABEL[status]}
        </Button>
      )}
    </div>
  );
}
