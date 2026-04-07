"use client";

import { useState, useEffect, useCallback } from "react";
import { getAllModules } from "@/lib/modules/registry";
import { toast } from "sonner";
import { Plus, Trash2, Settings2, ChevronDown, ChevronUp, Loader2, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ActiveModule = {
  id: string;
  moduleId: string;
  config: Record<string, unknown>;
  module: { id: string; name: string; description: string; configSchema: string };
};

export function EventModuleManager({ eventId }: { eventId: string }) {
  const allModules = getAllModules();
  const [active, setActive] = useState<ActiveModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedConfig, setExpandedConfig] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/events/${eventId}/modules`);
    if (res.ok) setActive(await res.json());
    setLoading(false);
  }, [eventId]);

  useEffect(() => { load(); }, [load]);

  const isActive = (moduleId: string) => active.some((a) => a.moduleId === moduleId);

  async function toggle(moduleId: string) {
    setPending(moduleId);
    if (isActive(moduleId)) {
      const res = await fetch(`/api/events/${eventId}/modules?moduleId=${moduleId}`, { method: "DELETE" });
      if (res.ok) {
        setActive((prev) => prev.filter((a) => a.moduleId !== moduleId));
        toast.success("모듈이 비활성화되었습니다.");
      } else {
        toast.error("비활성화에 실패했습니다.");
      }
    } else {
      const def = allModules.find((m) => m.id === moduleId);
      const defaults: Record<string, unknown> = {};
      if (def) {
        for (const [key, schema] of Object.entries(def.configSchema)) {
          defaults[key] = (schema as { default?: unknown }).default;
        }
      }
      const res = await fetch(`/api/events/${eventId}/modules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId, config: defaults }),
      });
      if (res.ok) {
        const created = await res.json();
        setActive((prev) => [...prev, created]);
        toast.success("모듈이 활성화되었습니다.");
      } else {
        toast.error("활성화에 실패했습니다.");
      }
    }
    setPending(null);
  }

  async function saveConfig(moduleId: string, config: Record<string, unknown>) {
    setPending(moduleId);
    const res = await fetch(`/api/events/${eventId}/modules`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moduleId, config }),
    });
    if (res.ok) {
      const updated = await res.json();
      setActive((prev) => prev.map((a) => a.moduleId === moduleId ? { ...a, config: updated.config } : a));
      toast.success("설정이 저장되었습니다.");
      setExpandedConfig(null);
    } else {
      toast.error("저장에 실패했습니다.");
    }
    setPending(null);
  }

  if (loading) return (
    <div className="flex items-center justify-center py-8 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin mr-2" />로딩 중…
    </div>
  );

  return (
    <div className="space-y-3">
      {allModules.map((mod) => {
        const on = isActive(mod.id);
        const activeMod = active.find((a) => a.moduleId === mod.id);
        const configKeys = Object.keys(mod.configSchema);
        const isExpanded = expandedConfig === mod.id;
        const isPending = pending === mod.id;

        return (
          <div
            key={mod.id}
            className={cn(
              "border-2 rounded-xl overflow-hidden transition-all",
              on ? "border-indigo-400 bg-indigo-50/50" : "border-foreground/10 bg-background"
            )}
          >
            <div className="flex items-center gap-3 p-3">
              {/* 상태 표시 */}
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border-2",
                on ? "border-indigo-400 bg-indigo-500" : "border-foreground/20 bg-muted"
              )}>
                {on ? <CheckCircle className="h-4 w-4 text-white" /> : <Plus className="h-4 w-4 text-muted-foreground" />}
              </div>

              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-black", on ? "text-indigo-800" : "text-foreground")}>{mod.name}</p>
                <p className="text-xs text-muted-foreground truncate">{mod.description}</p>
              </div>

              {/* 설정 버튼 (활성화 + configSchema 있을 때만) */}
              {on && configKeys.length > 0 && (
                <button
                  onClick={() => setExpandedConfig(isExpanded ? null : mod.id)}
                  className="text-indigo-600 hover:text-indigo-800 transition-colors p-1"
                >
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <Settings2 className="h-4 w-4" />}
                </button>
              )}

              {/* 토글 버튼 */}
              <button
                onClick={() => toggle(mod.id)}
                disabled={isPending}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-black border-2 transition-all shrink-0",
                  on
                    ? "border-red-300 text-red-600 bg-red-50 hover:bg-red-100"
                    : "border-indigo-300 text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                )}
              >
                {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : on ? "비활성화" : "활성화"}
              </button>
            </div>

            {/* 설정 패널 */}
            {on && isExpanded && activeMod && configKeys.length > 0 && (
              <ConfigPanel
                moduleId={mod.id}
                schema={mod.configSchema}
                config={activeMod.config}
                onSave={saveConfig}
                saving={isPending}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ConfigPanel({
  moduleId,
  schema,
  config,
  onSave,
  saving,
}: {
  moduleId: string;
  schema: Record<string, unknown>;
  config: Record<string, unknown>;
  onSave: (moduleId: string, config: Record<string, unknown>) => Promise<void>;
  saving: boolean;
}) {
  const [draft, setDraft] = useState<Record<string, unknown>>({ ...config });

  return (
    <div className="border-t-2 border-indigo-200 bg-white px-4 py-3 space-y-3">
      {Object.entries(schema).map(([key, rawSchema]) => {
        const s = rawSchema as { type: string; label?: string; default?: unknown };
        const label = s.label ?? key;
        const value = draft[key];

        return (
          <div key={key} className="space-y-1">
            <label className="text-xs font-bold text-indigo-700">{label}</label>
            {s.type === "boolean" ? (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={Boolean(value)}
                  onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.checked }))}
                  className="w-4 h-4 accent-indigo-600"
                />
                <span className="text-xs text-muted-foreground">{Boolean(value) ? "활성화됨" : "비활성화됨"}</span>
              </div>
            ) : s.type === "number" ? (
              <input
                type="number"
                value={Number(value ?? s.default ?? 0)}
                onChange={(e) => setDraft((d) => ({ ...d, [key]: Number(e.target.value) }))}
                className="w-full border-2 border-indigo-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500"
              />
            ) : s.type === "array" ? (
              <textarea
                value={(Array.isArray(value) ? value : (s.default as string[])).join("\n")}
                onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value.split("\n").filter(Boolean) }))}
                rows={3}
                placeholder="한 줄에 하나씩 입력"
                className="w-full border-2 border-indigo-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500 resize-none"
              />
            ) : (
              <input
                type="text"
                value={String(value ?? s.default ?? "")}
                onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
                className="w-full border-2 border-indigo-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500"
              />
            )}
          </div>
        );
      })}

      <button
        onClick={() => onSave(moduleId, draft)}
        disabled={saving}
        className="w-full py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-black hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin inline" /> : "설정 저장"}
      </button>
    </div>
  );
}
