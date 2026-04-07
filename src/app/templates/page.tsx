export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/lib/button-variants";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Plus, Users, Zap, LayoutGrid } from "lucide-react";

export const revalidate = 60;

const MODULE_NAMES: Record<string, { label: string; color: string }> = {
  "visitor-rating":  { label: "방문객 별점",  color: "bg-yellow-100 text-yellow-800 border-yellow-400" },
  "judge-scoring":   { label: "심사 채점",    color: "bg-orange-100 text-orange-800 border-orange-400" },
  "stamp-rally":     { label: "스탬프 랠리",  color: "bg-violet-100 text-violet-800 border-violet-400" },
  "product-showcase":{ label: "상품 진열",    color: "bg-blue-100 text-blue-800 border-blue-400" },
  "live-chat":       { label: "실시간 채팅",  color: "bg-emerald-100 text-emerald-800 border-emerald-400" },
  announcement:      { label: "공지사항",     color: "bg-red-100 text-red-800 border-red-400" },
};

// 템플릿별 썸네일 레고 블록 컬러
const THUMB_COLORS = [
  ["#fbbf24","#f97316","#ef4444","#8b5cf6"],
  ["#3b82f6","#06b6d4","#22c55e","#a3e635"],
  ["#ec4899","#f43f5e","#f97316","#fbbf24"],
  ["#6366f1","#8b5cf6","#a855f7","#ec4899"],
];

export default async function TemplatesPage() {
  const session = await auth();

  const templates = await prisma.template.findMany({
    where: { isPublic: true },
    orderBy: { createdAt: "desc" },
    include: {
      owner: { select: { id: true, name: true } },
      modules: { include: { module: true } },
      _count: { select: { events: true } },
    },
  });

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <LayoutGrid className="h-6 w-6 text-primary" />
            템플릿 갤러리
          </h1>
          <p className="text-sm text-muted-foreground font-semibold mt-1">
            원하는 기능 모듈 조합을 골라 이벤트를 빠르게 시작하세요
          </p>
        </div>
        {session && (
          <Link href="/templates/new" className={cn(buttonVariants())}>
            <Plus className="h-4 w-4" />
            템플릿 만들기
          </Link>
        )}
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-foreground/30 rounded-2xl bg-muted/30">
          <LayoutGrid className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
          <p className="font-black text-lg">공개 템플릿이 없습니다</p>
          <p className="text-sm text-muted-foreground font-semibold mt-1">첫 번째 템플릿을 만들어 공유해보세요!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {templates.map((template, idx) => {
            const colors = THUMB_COLORS[idx % THUMB_COLORS.length];
            return (
              <Link
                key={template.id}
                href={`/templates/${template.id}`}
                className="group block rounded-xl overflow-hidden border-2 border-foreground bg-card shadow-[4px_4px_0px_rgba(0,0,0,0.85)] hover:shadow-[6px_6px_0px_rgba(0,0,0,0.85)] hover:-translate-y-0.5 hover:-translate-x-0.5 transition-all"
              >
                {/* 레고 블록 썸네일 */}
                <div className="h-28 bg-muted/50 flex items-center justify-center border-b-2 border-foreground p-4">
                  <div className="grid grid-cols-4 gap-1.5 w-full max-w-[140px]">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-7 rounded-md border-2 border-black/30 shadow-[1px_1px_0px_rgba(0,0,0,0.5)] group-hover:scale-105 transition-transform"
                        style={{
                          backgroundColor: colors[i % colors.length],
                          transitionDelay: `${i * 20}ms`,
                          gridColumn: i === 0 ? "span 2" : undefined,
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-black text-base group-hover:text-primary transition-colors leading-snug">
                      {template.name}
                    </h3>
                    {template.description && (
                      <p className="text-xs text-muted-foreground font-semibold line-clamp-2 mt-1">
                        {template.description}
                      </p>
                    )}
                  </div>

                  {template.modules.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {template.modules.map((tm) => {
                        const m = MODULE_NAMES[tm.moduleId];
                        return (
                          <span
                            key={tm.moduleId}
                            className={cn(
                              "inline-flex items-center gap-0.5 text-[10px] font-black px-1.5 py-0.5 rounded-md border",
                              m?.color ?? "bg-muted text-foreground border-foreground/30"
                            )}
                          >
                            {m?.label ?? tm.moduleId}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 font-semibold">
                    <span>by {template.owner.name}</span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {template._count.events}회 사용
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
