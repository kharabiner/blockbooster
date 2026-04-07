"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { getAllModules, type FeatureModuleDef } from "@/lib/modules/registry";
import { toast } from "sonner";
import Link from "next/link";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Loader2,
  Zap,
  Settings2,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

// ─── 타입 ───────────────────────────────────────────────────────────────────

type ModuleInstance = {
  /** 캔버스 내 고유 ID (같은 moduleId가 복수 추가되는 미래 대비) */
  key: string;
  moduleId: string;
  config: Record<string, unknown>;
};

// ─── 모듈 색상 ───────────────────────────────────────────────────────────────

const MODULE_ACCENT: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  "score-input":  { bg: "bg-orange-50",  border: "border-orange-300", text: "text-orange-700", dot: "bg-orange-400"  },
  "info-board":   { bg: "bg-blue-50",    border: "border-blue-300",   text: "text-blue-700",   dot: "bg-blue-400"    },
  "stamp":        { bg: "bg-violet-50",  border: "border-violet-300", text: "text-violet-700", dot: "bg-violet-400"  },
  "chat":         { bg: "bg-emerald-50", border: "border-emerald-300",text: "text-emerald-700",dot: "bg-emerald-400" },
  "reaction":     { bg: "bg-pink-50",    border: "border-pink-300",   text: "text-pink-700",   dot: "bg-pink-400"    },
  "announcement": { bg: "bg-red-50",     border: "border-red-300",    text: "text-red-700",    dot: "bg-red-400"     },
};
const DEFAULT_ACCENT = { bg: "bg-muted", border: "border-foreground/20", text: "text-foreground", dot: "bg-foreground/40" };

// ─── 개별 Config 필드 ────────────────────────────────────────────────────────

function ConfigField({
  fieldKey,
  schema,
  value,
  onChange,
}: {
  fieldKey: string;
  schema: { type: string; label?: string; default?: unknown };
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const label = schema.label ?? fieldKey;

  if (schema.type === "boolean") {
    return (
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={fieldKey}
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="w-4 h-4 accent-indigo-600 rounded"
        />
        <label htmlFor={fieldKey} className="text-xs text-foreground/80 font-medium cursor-pointer">
          {label}
        </label>
      </div>
    );
  }

  if (schema.type === "number") {
    return (
      <div className="space-y-1">
        <label className="text-xs font-semibold text-foreground/70">{label}</label>
        <input
          type="number"
          value={Number(value ?? schema.default ?? 0)}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full border-2 border-foreground/15 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-400 bg-background"
        />
      </div>
    );
  }

  if (schema.type === "array") {
    const arr = Array.isArray(value) ? value : (Array.isArray(schema.default) ? schema.default : []);
    return (
      <div className="space-y-1">
        <label className="text-xs font-semibold text-foreground/70">{label}</label>
        <textarea
          value={(arr as string[]).join("\n")}
          onChange={(e) => onChange(e.target.value.split("\n"))}
          rows={3}
          placeholder="한 줄에 하나씩 입력"
          className="w-full border-2 border-foreground/15 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-400 resize-none bg-background"
        />
        <p className="text-[10px] text-muted-foreground">한 줄 = 한 항목</p>
      </div>
    );
  }

  // string (default)
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-foreground/70">{label}</label>
      <input
        type="text"
        value={String(value ?? schema.default ?? "")}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border-2 border-foreground/15 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-400 bg-background"
      />
    </div>
  );
}

// ─── 드래그 가능한 모듈 카드 ─────────────────────────────────────────────────

function SortableModuleCard({
  instance,
  def,
  onRemove,
  onConfigChange,
}: {
  instance: ModuleInstance;
  def: FeatureModuleDef;
  onRemove: () => void;
  onConfigChange: (config: Record<string, unknown>) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const accent = MODULE_ACCENT[instance.moduleId] ?? DEFAULT_ACCENT;
  const hasConfig = Object.keys(def.configSchema).length > 0;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: instance.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-xl border-2 overflow-hidden bg-card shadow-[2px_2px_0px_rgba(0,0,0,0.08)] transition-shadow",
        accent.border,
        isDragging && "shadow-[4px_4px_0px_rgba(0,0,0,0.15)]"
      )}
    >
      {/* 카드 헤더 */}
      <div className={cn("flex items-center gap-2 px-3 py-2.5", accent.bg)}>
        {/* 드래그 핸들 */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-foreground/30 hover:text-foreground/60 transition-colors touch-none"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* 색상 닷 + 이름 */}
        <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", accent.dot)} />
        <span className={cn("text-sm font-black flex-1", accent.text)}>{def.name}</span>

        {/* 설정 토글 (configSchema 있을 때만) */}
        {hasConfig && (
          <button
            onClick={() => setExpanded(!expanded)}
            className={cn("p-1 rounded-md transition-colors hover:bg-black/5", accent.text)}
            title={expanded ? "설정 접기" : "설정 펼치기"}
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <Settings2 className="h-3.5 w-3.5" />}
          </button>
        )}

        {/* 삭제 */}
        <button
          onClick={onRemove}
          className="p-1 rounded-md text-foreground/30 hover:text-red-500 hover:bg-red-50 transition-colors"
          title="제거"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* 설명 (항상 표시) */}
      <div className="px-4 py-2 border-t border-foreground/5">
        <p className="text-xs text-muted-foreground">{def.description}</p>
      </div>

      {/* Config 필드 (토글) */}
      {hasConfig && expanded && (
        <div className="px-4 pb-4 pt-2 space-y-3 border-t border-foreground/5 bg-background/60">
          {Object.entries(def.configSchema).map(([key, schema]) => (
            <ConfigField
              key={key}
              fieldKey={key}
              schema={schema}
              value={instance.config[key]}
              onChange={(v) => onConfigChange({ ...instance.config, [key]: v })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 메인 스튜디오 ────────────────────────────────────────────────────────────

function TemplateStudio() {
  const router = useRouter();
  const allModules = getAllModules();

  const [instances, setInstances] = useState<ModuleInstance[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [gridRows, setGridRows] = useState(10);
  const [gridCols, setGridCols] = useState(12);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // 팔레트에서 모듈 추가
  function addModule(moduleId: string) {
    const def = allModules.find((m) => m.id === moduleId);
    if (!def) return;

    // 기본값으로 config 초기화
    const defaultConfig: Record<string, unknown> = {};
    for (const [key, schema] of Object.entries(def.configSchema)) {
      defaultConfig[key] = schema.default;
    }

    setInstances((prev) => [
      ...prev,
      {
        key: `${moduleId}-${Date.now()}`,
        moduleId,
        config: defaultConfig,
      },
    ]);
  }

  function removeModule(key: string) {
    setInstances((prev) => prev.filter((i) => i.key !== key));
  }

  function updateConfig(key: string, config: Record<string, unknown>) {
    setInstances((prev) =>
      prev.map((i) => (i.key === key ? { ...i, config } : i))
    );
  }

  // DnD 설정
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setInstances((prev) => {
      const oldIdx = prev.findIndex((i) => i.key === active.id);
      const newIdx = prev.findIndex((i) => i.key === over.id);
      return arrayMove(prev, oldIdx, newIdx);
    });
  }

  async function handleSave() {
    if (!name.trim()) {
      toast.error("템플릿 이름을 입력해주세요.");
      return;
    }

    setSaving(true);
    const res = await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        description: description.trim(),
        isPublic,
        gridRows,
        gridCols,
        slotLayout: [],
        modules: instances.map((i) => ({
          moduleId: i.moduleId,
          config: i.config,
        })),
      }),
    });
    setSaving(false);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err?.error ?? "저장에 실패했습니다.");
      return;
    }

    const data = await res.json();
    toast.success("템플릿이 저장되었습니다!");
    router.push(`/templates/${data.id}`);
  }

  return (
    <div className="min-h-screen bg-muted/20">
      {/* 상단 툴바 */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b-2 border-foreground/10">
        <div className="container mx-auto px-4 h-14 flex items-center gap-3">
          <Link
            href="/templates"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2")}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            갤러리
          </Link>

          <div className="flex-1 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-500" />
            <span className="text-sm font-black text-foreground/80">Template Studio</span>
            {name && (
              <>
                <span className="text-foreground/30">/</span>
                <span className="text-sm font-semibold truncate max-w-48">{name}</span>
              </>
            )}
          </div>

          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={cn(
              "flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border-2 transition-all",
              previewMode
                ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                : "border-foreground/20 bg-background text-foreground/60 hover:border-foreground/40"
            )}
          >
            {previewMode ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {previewMode ? "편집" : "미리보기"}
          </button>

          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className={cn(
              "flex items-center gap-1.5 text-sm font-black px-4 py-1.5 rounded-lg border-2 transition-all shadow-[2px_2px_0px_rgba(0,0,0,0.3)] hover:shadow-[3px_3px_0px_rgba(0,0,0,0.3)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5",
              "border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
            )}
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            저장
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {previewMode ? (
          // ── 미리보기 모드 ─────────────────────────────────────────────────
          <PreviewMode
            name={name}
            description={description}
            instances={instances}
            allModules={allModules}
          />
        ) : (
          // ── 편집 모드 ─────────────────────────────────────────────────────
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">

            {/* ── 왼쪽: 팔레트 + 설정 ── */}
            <aside className="space-y-5">
              {/* 모듈 팔레트 */}
              <div className="rounded-xl border-2 border-foreground bg-card shadow-[4px_4px_0px_rgba(0,0,0,0.85)] overflow-hidden">
                <div className="px-4 py-3 border-b-2 border-foreground bg-foreground text-background">
                  <p className="text-sm font-black flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    기능 모듈 팔레트
                  </p>
                  <p className="text-[10px] opacity-60 mt-0.5">클릭하면 캔버스에 추가</p>
                </div>
                <div className="p-3 space-y-2">
                  {allModules.map((mod) => {
                    const accent = MODULE_ACCENT[mod.id] ?? DEFAULT_ACCENT;
                    const alreadyAdded = instances.some((i) => i.moduleId === mod.id);
                    return (
                      <button
                        key={mod.id}
                        onClick={() => addModule(mod.id)}
                        className={cn(
                          "w-full flex items-center gap-2.5 p-2.5 rounded-lg border-2 text-left transition-all group",
                          alreadyAdded
                            ? cn(accent.border, accent.bg, "opacity-60")
                            : "border-foreground/10 hover:border-foreground/40 hover:bg-muted/50"
                        )}
                      >
                        <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", accent.dot)} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black">{mod.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{mod.description}</p>
                        </div>
                        <Plus className={cn(
                          "h-3.5 w-3.5 flex-shrink-0 transition-colors",
                          alreadyAdded ? "opacity-30" : "opacity-0 group-hover:opacity-60"
                        )} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 템플릿 메타 정보 */}
              <div className="rounded-xl border-2 border-foreground bg-card shadow-[4px_4px_0px_rgba(0,0,0,0.85)] overflow-hidden">
                <div className="px-4 py-3 border-b-2 border-foreground bg-foreground text-background">
                  <p className="text-sm font-black">템플릿 정보</p>
                </div>
                <div className="p-4 space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">이름 *</Label>
                    <Input
                      placeholder="예: 캡스톤 전시회"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="text-sm border-2"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">설명</Label>
                    <Textarea
                      placeholder="어떤 이벤트에 적합한지 설명해주세요"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="text-sm border-2 resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">가로 칸</Label>
                      <Input
                        type="number"
                        min={5}
                        max={30}
                        value={gridCols}
                        onChange={(e) => setGridCols(Number(e.target.value))}
                        className="text-sm border-2"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold">세로 칸</Label>
                      <Input
                        type="number"
                        min={5}
                        max={30}
                        value={gridRows}
                        onChange={(e) => setGridRows(Number(e.target.value))}
                        className="text-sm border-2"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="isPublic"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      className="w-4 h-4 accent-indigo-600 rounded"
                    />
                    <label htmlFor="isPublic" className="text-xs font-semibold cursor-pointer">
                      갤러리에 공개
                    </label>
                  </div>
                </div>
              </div>
            </aside>

            {/* ── 오른쪽: 캔버스 ── */}
            <main>
              <div className="rounded-xl border-2 border-foreground bg-card shadow-[4px_4px_0px_rgba(0,0,0,0.85)] overflow-hidden min-h-[500px]">
                <div className="px-4 py-3 border-b-2 border-foreground bg-foreground text-background flex items-center justify-between">
                  <div>
                    <p className="text-sm font-black">기능 캔버스</p>
                    <p className="text-[10px] opacity-60 mt-0.5">드래그로 순서를 바꾸고, ⚙ 아이콘으로 설정을 편집하세요</p>
                  </div>
                  {instances.length > 0 && (
                    <Badge className="bg-white/20 text-white border-white/30 font-black text-xs">
                      {instances.length}개 활성
                    </Badge>
                  )}
                </div>

                <div className="p-4">
                  {instances.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-indigo-100 border-2 border-indigo-200 flex items-center justify-center mb-4">
                        <Zap className="h-8 w-8 text-indigo-400" />
                      </div>
                      <p className="font-black text-lg text-foreground/70">비어있습니다</p>
                      <p className="text-sm text-muted-foreground mt-1 max-w-48">
                        왼쪽 팔레트에서 기능 모듈을 클릭해 추가하세요
                      </p>
                      <div className="flex gap-2 mt-4 flex-wrap justify-center">
                        {allModules.slice(0, 3).map((m) => {
                          const accent = MODULE_ACCENT[m.id] ?? DEFAULT_ACCENT;
                          return (
                            <button
                              key={m.id}
                              onClick={() => addModule(m.id)}
                              className={cn(
                                "text-xs font-bold px-3 py-1 rounded-full border-2 transition-all hover:-translate-y-0.5",
                                accent.border, accent.bg, accent.text
                              )}
                            >
                              + {m.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={instances.map((i) => i.key)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-3">
                          {instances.map((instance) => {
                            const def = allModules.find((m) => m.id === instance.moduleId);
                            if (!def) return null;
                            return (
                              <SortableModuleCard
                                key={instance.key}
                                instance={instance}
                                def={def}
                                onRemove={() => removeModule(instance.key)}
                                onConfigChange={(config) => updateConfig(instance.key, config)}
                              />
                            );
                          })}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}

                  {instances.length > 0 && (
                    <div className="mt-4 pt-4 border-t-2 border-dashed border-foreground/10 flex flex-wrap gap-2">
                      {allModules
                        .filter((m) => !instances.some((i) => i.moduleId === m.id))
                        .map((m) => {
                          const accent = MODULE_ACCENT[m.id] ?? DEFAULT_ACCENT;
                          return (
                            <button
                              key={m.id}
                              onClick={() => addModule(m.id)}
                              className={cn(
                                "text-xs font-bold px-3 py-1.5 rounded-lg border-2 flex items-center gap-1.5 transition-all hover:-translate-y-0.5",
                                accent.border, accent.bg, accent.text
                              )}
                            >
                              <Plus className="h-3 w-3" />
                              {m.name}
                            </button>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
            </main>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 미리보기 모드 ────────────────────────────────────────────────────────────

function PreviewMode({
  name,
  description,
  instances,
  allModules,
}: {
  name: string;
  description: string;
  instances: ModuleInstance[];
  allModules: FeatureModuleDef[];
}) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 이벤트 헤더 (목업) */}
      <div className="rounded-xl border-2 border-foreground bg-card shadow-[4px_4px_0px_rgba(0,0,0,0.85)] p-6">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="secondary">미리보기</Badge>
          <span className="text-xs text-muted-foreground">이 템플릿으로 만들어진 이벤트는 이렇게 보입니다</span>
        </div>
        <h1 className="text-2xl font-bold mb-1">{name || "(템플릿 이름)"}</h1>
        {description && <p className="text-muted-foreground text-sm">{description}</p>}
      </div>

      {/* 모듈 패널 목업 */}
      {instances.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border-2 border-dashed border-foreground/20 rounded-xl">
          <p className="font-semibold">추가된 기능 모듈이 없습니다</p>
          <p className="text-sm mt-1">편집 모드에서 모듈을 추가하세요</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">부스 방문 시 표시될 기능</p>
          {instances.map((inst) => {
            const def = allModules.find((m) => m.id === inst.moduleId);
            if (!def) return null;
            const accent = MODULE_ACCENT[inst.moduleId] ?? DEFAULT_ACCENT;
            return (
              <div
                key={inst.key}
                className={cn(
                  "rounded-xl border-2 p-4",
                  accent.border, accent.bg
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn("w-2.5 h-2.5 rounded-full", accent.dot)} />
                  <p className={cn("text-sm font-black", accent.text)}>{def.name}</p>
                  {/* config에서 label이 있으면 표시 */}
                  {inst.config.label && inst.config.label !== def.configSchema.label?.default && (
                    <span className={cn("text-xs font-semibold opacity-70", accent.text)}>
                      — {String(inst.config.label)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{def.description}</p>

                {/* 주요 config 요약 */}
                <div className="mt-2 flex flex-wrap gap-1">
                  {Object.entries(inst.config).map(([key, val]) => {
                    const schema = def.configSchema[key];
                    if (!schema || !val || (Array.isArray(val) && val.length === 0)) return null;
                    const display = Array.isArray(val)
                      ? `${(val as unknown[]).length}개 항목`
                      : String(val);
                    return (
                      <span
                        key={key}
                        className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                          accent.border, "bg-white/60", accent.text
                        )}
                      >
                        {schema.label ?? key}: {display}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── 페이지 export ────────────────────────────────────────────────────────────

export default function NewTemplatePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    }>
      <TemplateStudio />
    </Suspense>
  );
}
