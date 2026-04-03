"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Props = {
  templateId: string;
  isOwner: boolean;
};

export function TemplateActions({ templateId, isOwner }: Props) {
  const router = useRouter();
  const [cloning, setCloning] = useState(false);

  async function handleClone() {
    setCloning(true);
    const res = await fetch(`/api/templates/${templateId}`, { method: "POST" });
    const data = await res.json();
    setCloning(false);

    if (!res.ok) {
      toast.error("복제에 실패했습니다. 로그인이 필요합니다.");
      return;
    }

    toast.success("템플릿이 복제되었습니다!");
    router.push(`/templates/${data.id}`);
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClone} disabled={cloning}>
      {cloning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4 mr-1" />}
      {cloning ? "" : "복제"}
    </Button>
  );
}
