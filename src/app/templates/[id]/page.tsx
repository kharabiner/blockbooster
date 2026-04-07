export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { buttonVariants } from "@/lib/button-variants";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { LayoutGrid, Zap, Users, ArrowLeft, Copy } from "lucide-react";
import { TemplateActions } from "@/components/templates/TemplateActions";
import { getModule } from "@/lib/modules/registry";

type Params = { params: Promise<{ id: string }> };

export default async function TemplateDetailPage({ params }: Params) {
  const { id } = await params;
  const session = await auth();

  const template = await prisma.template.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, image: true } },
      modules: { include: { module: true } },
      _count: { select: { events: true } },
    },
  });

  if (!template) notFound();
  if (!template.isPublic && template.ownerId !== session?.user?.id) notFound();

  const isOwner = template.ownerId === session?.user?.id;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Link
        href="/templates"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-6 -ml-2 inline-flex")}
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        갤러리로
      </Link>

      {/* 썸네일 */}
      <div className="aspect-video bg-gradient-to-br from-indigo-50 to-purple-100 rounded-xl flex items-center justify-center mb-6">
        <div className="grid grid-cols-4 grid-rows-3 gap-1.5 p-8 w-full h-full">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="rounded-md opacity-50"
              style={{
                backgroundColor: ["#6366f1", "#8b5cf6", "#ec4899", "#3b82f6", "#22c55e", "#f97316",
                  "#14b8a6", "#eab308", "#ef4444", "#06b6d4", "#64748b", "#a16207"][i % 12],
              }}
            />
          ))}
        </div>
      </div>

      {/* 헤더 */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {template.isPublic && <Badge variant="secondary">공개</Badge>}
            {isOwner && <Badge variant="outline">내 템플릿</Badge>}
          </div>
          <h1 className="text-2xl font-bold">{template.name}</h1>
          {template.description && (
            <p className="text-muted-foreground mt-1">{template.description}</p>
          )}
        </div>
        <TemplateActions templateId={template.id} isOwner={isOwner} />
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
        <div className="flex items-center gap-1.5">
          <Avatar className="h-5 w-5">
            <AvatarImage src={template.owner.image ?? ""} />
            <AvatarFallback className="text-[10px]">
              {template.owner.name?.[0]?.toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>
          <span>{template.owner.name}</span>
        </div>
        <span className="flex items-center gap-1">
          <Users className="h-4 w-4" />
          {template._count.events}회 사용
        </span>
        <span className="flex items-center gap-1">
          <LayoutGrid className="h-4 w-4" />
          {template.gridCols}×{template.gridRows}
        </span>
      </div>

      <Separator className="mb-6" />

      {/* 모듈 목록 */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">
          포함된 기능 모듈 ({template.modules.length})
        </h2>
        {template.modules.length === 0 ? (
          <p className="text-sm text-muted-foreground">기능 모듈 없음 (기본 부스 정보만 표시)</p>
        ) : (
          <div className="space-y-2">
            {template.modules.map((tm) => {
              const def = getModule(tm.moduleId);
              return (
                <div key={tm.moduleId} className="flex items-start gap-3 p-3 rounded-lg border">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <Zap className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{def?.name ?? tm.moduleId}</p>
                    <p className="text-xs text-muted-foreground">{def?.description ?? ""}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 이 템플릿으로 이벤트 생성 */}
      <div className="mt-8 p-4 rounded-xl bg-indigo-50 border border-indigo-100">
        <p className="text-sm font-medium mb-3">이 템플릿으로 이벤트 만들기</p>
        <Link
          href={`/dashboard/events/new?templateId=${template.id}&templateName=${encodeURIComponent(template.name)}`}
          className={cn(buttonVariants(), "w-full justify-center")}
        >
          이벤트 생성하기
        </Link>
      </div>
    </div>
  );
}
