"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/lib/button-variants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, LayoutGrid } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";

function NewEventForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get("templateId") ?? undefined;
  const templateName = searchParams.get("templateName") ?? undefined;

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    startAt: "",
    endAt: "",
    gridRows: 10,
    gridCols: 10,
  });

  function set(field: string, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.startAt || !form.endAt) {
      toast.error("날짜를 입력해주세요.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        startAt: new Date(form.startAt).toISOString(),
        endAt: new Date(form.endAt).toISOString(),
        ...(templateId ? { templateId } : {}),
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      toast.error("이벤트 생성에 실패했습니다. 로그인이 필요합니다.");
      return;
    }

    toast.success("이벤트가 생성되었습니다!");
    router.push(`/dashboard/events/${data.id}/builder`);
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Link href="/dashboard" className={cn(buttonVariants({ variant: "ghost" }), "mb-6 -ml-2 inline-flex")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        내 이벤트
      </Link>

      {templateId && (
        <div className="mb-4 flex items-center gap-2 text-sm text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2">
          <LayoutGrid className="h-4 w-4" />
          <span>템플릿 적용 중: <strong>{templateName ?? templateId}</strong></span>
          <Link href="/dashboard/events/new" className="ml-auto text-xs underline opacity-70 hover:opacity-100">
            제거
          </Link>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>새 이벤트 만들기</CardTitle>
          <CardDescription>기본 정보를 입력한 후 부스 빌더에서 슬롯을 배치하세요</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">이벤트 이름 *</Label>
              <Input
                id="title"
                placeholder="예: 2025 한성대 캡스톤 전시회"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">소개</Label>
              <Textarea
                id="description"
                placeholder="이벤트에 대해 간단히 소개해주세요"
                rows={3}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">장소</Label>
              <Input
                id="location"
                placeholder="예: 한성대학교 상상관 5층"
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startAt">시작 일시 *</Label>
                <Input id="startAt" type="datetime-local" value={form.startAt} onChange={(e) => set("startAt", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endAt">종료 일시 *</Label>
                <Input id="endAt" type="datetime-local" value={form.endAt} onChange={(e) => set("endAt", e.target.value)} required />
              </div>
            </div>
            {!templateId && (
              <div>
                <Label className="mb-2 block">그리드 크기</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gridCols" className="text-sm text-muted-foreground">가로 칸 수</Label>
                    <Input id="gridCols" type="number" min={5} max={30} value={form.gridCols} onChange={(e) => set("gridCols", Number(e.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gridRows" className="text-sm text-muted-foreground">세로 칸 수</Label>
                    <Input id="gridRows" type="number" min={5} max={30} value={form.gridRows} onChange={(e) => set("gridRows", Number(e.target.value))} />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">{form.gridCols}×{form.gridRows} 그리드</p>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              이벤트 만들고 부스 배치하기 →
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}

export default function NewEventPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8"><Loader2 className="animate-spin" /></div>}>
      <NewEventForm />
    </Suspense>
  );
}
