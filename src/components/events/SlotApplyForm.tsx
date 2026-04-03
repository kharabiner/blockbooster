"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Store, Check } from "lucide-react";
import { toast } from "sonner";

type Booth = { id: string; name: string; category: string | null; description: string | null; shortCode: string };

interface Props {
  slotId: string;
  eventId: string;
  booths: Booth[];
}

export function SlotApplyForm({ slotId, eventId, booths }: Props) {
  const router = useRouter();
  const [selectedBoothId, setSelectedBoothId] = useState<string>(booths[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleApply() {
    if (!selectedBoothId) { toast.error("부스를 선택해주세요."); return; }
    setLoading(true);
    const res = await fetch(`/api/slots/${slotId}/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ boothId: selectedBoothId, message }),
    });
    setLoading(false);

    if (res.ok) {
      setDone(true);
      toast.success("신청이 완료되었습니다! 주최자의 승인을 기다려주세요.");
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data?.error ?? "신청에 실패했습니다.");
    }
  }

  if (done) {
    return (
      <div className="border rounded-xl p-10 text-center space-y-4">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <Check className="h-7 w-7 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold">신청 완료!</h2>
        <p className="text-muted-foreground text-sm">
          주최자가 신청을 검토 후 승인하면 이메일로 알려드립니다.
        </p>
        <Button variant="outline" onClick={() => router.push(`/events/${eventId}`)}>
          이벤트로 돌아가기
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label className="text-base font-medium">신청할 부스 선택</Label>
        <div className="grid gap-2">
          {booths.map((booth) => (
            <button
              key={booth.id}
              type="button"
              onClick={() => setSelectedBoothId(booth.id)}
              className={`w-full text-left border rounded-xl p-4 transition-colors ${
                selectedBoothId === booth.id
                  ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500"
                  : "hover:bg-muted/50"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <Store className="h-4 w-4 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{booth.name}</p>
                  {booth.category && (
                    <Badge variant="secondary" className="text-xs mt-0.5">{booth.category}</Badge>
                  )}
                  {booth.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{booth.description}</p>
                  )}
                </div>
                {selectedBoothId === booth.id && (
                  <Check className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">신청 메시지 (선택)</Label>
        <Textarea
          id="message"
          placeholder="주최자에게 전달할 내용을 입력해주세요 (예: 부스 소개, 특이사항 등)"
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>

      <Card className="bg-muted/30">
        <CardContent className="py-3 text-xs text-muted-foreground">
          신청 후 주최자가 승인해야 부스가 활성화됩니다.
          한 슬롯에 여러 부스가 신청할 수 있으며, 주최자가 하나를 선택합니다.
        </CardContent>
      </Card>

      <Button onClick={handleApply} disabled={loading || !selectedBoothId} className="w-full" size="lg">
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        신청하기
      </Button>
    </div>
  );
}
