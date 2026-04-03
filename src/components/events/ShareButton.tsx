"use client";

import { Button } from "@/components/ui/button";
import { Share2, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function ShareButton({ shortCode, title }: { shortCode: string; title: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = `${window.location.origin}/e/${shortCode}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("링크가 복사되었습니다!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("링크 복사에 실패했습니다.");
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleShare}>
      {copied ? <Check className="h-4 w-4 mr-1.5 text-green-500" /> : <Share2 className="h-4 w-4 mr-1.5" />}
      {copied ? "복사됨!" : "공유"}
    </Button>
  );
}
