"use client";

import { QRCodeSVG } from "qrcode.react";
import { Copy, Download, Check } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  url: string;
  shortCode: string;
  compact?: boolean;
}

export function QRCodeDisplay({ label, url, shortCode, compact = false }: Props) {
  const [copied, setCopied] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("링크가 복사되었습니다.");
    setTimeout(() => setCopied(false), 2000);
  }

  function download() {
    const svg = svgRef.current;
    if (!svg) return;

    const size = compact ? 200 : 300;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      const a = document.createElement("a");
      a.download = `qr-${shortCode}.png`;
      a.href = canvas.toDataURL();
      a.click();
    };
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgData)}`;
  }

  const qrSize = compact ? 120 : 200;

  return (
    <div
      className={cn(
        "border rounded-xl p-4 bg-white flex flex-col items-center gap-3 text-center",
        compact ? "gap-2" : "gap-4"
      )}
    >
      <QRCodeSVG
        ref={svgRef}
        value={url}
        size={qrSize}
        level="M"
        includeMargin
      />
      <div className="w-full">
        <p className={cn("font-medium leading-snug", compact ? "text-sm" : "text-base")}>{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5 break-all">{url}</p>
      </div>
      <div className={cn("flex gap-1.5 w-full", compact ? "flex-col" : "")}>
        <Button variant="outline" size="sm" onClick={copy} className={cn("flex-1 text-xs", compact ? "h-7" : "")}>
          {copied ? <Check className="h-3 w-3 mr-1 text-green-500" /> : <Copy className="h-3 w-3 mr-1" />}
          복사
        </Button>
        <Button variant="outline" size="sm" onClick={download} className={cn("flex-1 text-xs", compact ? "h-7" : "")}>
          <Download className="h-3 w-3 mr-1" />
          저장
        </Button>
      </div>
    </div>
  );
}
