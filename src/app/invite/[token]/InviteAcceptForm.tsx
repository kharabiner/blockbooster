"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { buttonVariants } from "@/lib/button-variants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Store } from "lucide-react";
import { cn } from "@/lib/utils";

type Booth = { id: string; name: string };

type Props = {
  token: string;
  existingBooths: Booth[];
  eventId: string;
};

export function InviteAcceptForm({ token, existingBooths, eventId }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<"new" | "existing">(existingBooths.length > 0 ? "existing" : "new");
  const [boothName, setBoothName] = useState("");
  const [selectedBoothId, setSelectedBoothId] = useState(existingBooths[0]?.id ?? "");
  const [loading, setLoading] = useState(false);

  async function handleAccept() {
    setLoading(true);
    try {
      const body = mode === "existing"
        ? { boothId: selectedBoothId }
        : { boothName: boothName.trim() };

      const res = await fetch(`/api/invite/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "오류가 발생했습니다.");
        return;
      }

      toast.success("초대를 수락했습니다! 이벤트 페이지로 이동합니다.");
      router.push(`/events/${eventId}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {existingBooths.length > 0 && (
        <div className="flex gap-2 border-2 border-foreground/15 rounded-xl p-1">
          <button
            onClick={() => setMode("existing")}
            className={cn(
              "flex-1 py-2 text-sm font-black rounded-lg transition-colors",
              mode === "existing" ? "bg-foreground text-background" : "text-foreground/50 hover:text-foreground"
            )}
          >
            기존 부스 사용
          </button>
          <button
            onClick={() => setMode("new")}
            className={cn(
              "flex-1 py-2 text-sm font-black rounded-lg transition-colors",
              mode === "new" ? "bg-foreground text-background" : "text-foreground/50 hover:text-foreground"
            )}
          >
            새 부스 만들기
          </button>
        </div>
      )}

      {mode === "existing" ? (
        <div className="space-y-2">
          <Label className="font-black text-sm">내 부스 선택</Label>
          <div className="space-y-2">
            {existingBooths.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelectedBoothId(b.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-colors",
                  selectedBoothId === b.id
                    ? "border-primary bg-primary/5"
                    : "border-foreground/15 hover:border-foreground/30"
                )}
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <Store className="h-4 w-4 text-indigo-600" />
                </div>
                <span className="font-semibold text-sm">{b.name}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="boothName" className="font-black text-sm">부스 이름</Label>
          <Input
            id="boothName"
            value={boothName}
            onChange={(e) => setBoothName(e.target.value)}
            placeholder="예: 스마트 홈 IoT 프로젝트"
            className="border-2 border-foreground/30 font-semibold"
            onKeyDown={(e) => e.key === "Enter" && handleAccept()}
          />
        </div>
      )}

      <button
        onClick={handleAccept}
        disabled={loading || (mode === "new" && !boothName.trim()) || (mode === "existing" && !selectedBoothId)}
        className={cn(
          buttonVariants(),
          "w-full font-black text-base py-3 disabled:opacity-50"
        )}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        초대 수락하기
      </button>
    </div>
  );
}
