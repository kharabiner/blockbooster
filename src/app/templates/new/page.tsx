"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Check, Zap } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";

const ALL_MODULES = [
  { id: "visitor-rating", name: "방문객 별점", desc: "방문객이 부스에 별점을 부여합니다" },
  { id: "judge-scoring", name: "심사위원 채점", desc: "심사위원이 기준별 점수를 채점합니다" },
  { id: "stamp-rally", name: "스탬프 랠리", desc: "부스 방문 시 스탬프를 수집합니다" },
  { id: "product-showcase", name: "상품 진열", desc: "상품/서비스 목록을 보여줍니다" },
  { id: "live-chat", name: "실시간 채팅", desc: "방문객과 실시간으로 소통합니다" },
  { id: "announcement", name: "공지사항", desc: "이벤트 전체에 공지를 전달합니다" },
];

export default function NewTemplatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    isPublic: false,
    gridRows: 10,
    gridCols: 10,
  });

  function toggleModule(id: string) {
    setSelectedModules((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        modules: selectedModules.map((id) => ({ moduleId: id, config: {} })),
        slotLayout: [],
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      toast.error("템플릿 생성에 실패했습니다.");
      return;
    }

    toast.success("템플릿이 생성되었습니다!");
    router.push(`/templates/${data.id}`);
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Link href="/templates" className={cn(buttonVariants({ variant: "ghost" }), "mb-6 -ml-2 inline-flex")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        템플릿 갤러리
      </Link>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>새 템플릿 만들기</CardTitle>
            <CardDescription>기능 모듈을 조합해 나만의 이벤트 형식을 만드세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">템플릿 이름 *</Label>
              <Input
                id="name"
                placeholder="예: 캡스톤 전시회"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                placeholder="어떤 이벤트에 적합한 템플릿인지 설명해주세요"
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>가로 칸 수</Label>
                <Input
                  type="number"
                  min={5}
                  max={30}
                  value={form.gridCols}
                  onChange={(e) => setForm({ ...form, gridCols: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>세로 칸 수</Label>
                <Input
                  type="number"
                  min={5}
                  max={30}
                  value={form.gridRows}
                  onChange={(e) => setForm({ ...form, gridRows: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={form.isPublic}
                onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="isPublic">갤러리에 공개</Label>
            </div>
          </CardContent>
        </Card>

        {/* 기능 모듈 선택 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">기능 모듈 선택</CardTitle>
            <CardDescription>이 템플릿으로 만든 이벤트에서 활성화할 기능을 고르세요</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ALL_MODULES.map((module) => {
                const selected = selectedModules.includes(module.id);
                return (
                  <button
                    key={module.id}
                    type="button"
                    onClick={() => toggleModule(module.id)}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border text-left transition-all",
                      selected
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20"
                        : "hover:bg-muted/50"
                    )}
                  >
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border-2 transition-colors",
                        selected ? "border-indigo-500 bg-indigo-500" : "border-muted-foreground"
                      )}
                    >
                      {selected && <Check className="h-3.5 w-3.5 text-white" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Zap className="h-3.5 w-3.5 text-indigo-500" />
                        <span className="text-sm font-medium">{module.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{module.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            {selectedModules.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t">
                {selectedModules.map((id) => (
                  <Badge key={id} variant="secondary" className="text-xs">
                    {ALL_MODULES.find((m) => m.id === id)?.name}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          템플릿 만들기
        </Button>
      </form>
    </div>
  );
}
