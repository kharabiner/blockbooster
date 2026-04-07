"use client";

import { useState, useEffect } from "react";
import { Pencil, Check, X, Info, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import type { ModulePanelProps } from "./ModulePanel";

type FieldEntry = { field: string; value: string };

function isUrl(str: string) {
  try { return /^https?:\/\//.test(str); } catch { return false; }
}

export function InfoBoardPanel({ slotId, moduleId, config, isOperator }: ModulePanelProps) {
  const title      = (config.title      as string)   ?? "부스 정보";
  const fields     = (config.fields     as string[]) ?? ["소개", "링크"];
  const allowEmbed = (config.allowEmbed as boolean)  ?? false;

  const [entries,  setEntries]  = useState<FieldEntry[]>([]);
  const [draft,    setDraft]    = useState<FieldEntry[]>([]);
  const [editing,  setEditing]  = useState(false);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    fetch(`/api/slots/${slotId}/modules/${moduleId}`)
      .then((r) => r.json())
      .then((d) => {
        const stored: FieldEntry[] = d?.data?.entries ?? [];
        // fields 기준으로 정렬/채움
        const merged = fields.map((f) => ({
          field: f,
          value: stored.find((e) => e.field === f)?.value ?? "",
        }));
        setEntries(merged);
        setDraft(merged);
        setLoading(false);
      })
      .catch(() => {
        const empty = fields.map((f) => ({ field: f, value: "" }));
        setEntries(empty);
        setDraft(empty);
        setLoading(false);
      });
  }, [slotId, moduleId, fields.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  async function save() {
    const res = await fetch(`/api/slots/${slotId}/modules/${moduleId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries: draft }),
    });
    if (res.ok) {
      setEntries(draft);
      setEditing(false);
      toast.success("정보가 저장되었습니다.");
    } else {
      toast.error("저장에 실패했습니다.");
    }
  }

  function cancelEdit() {
    setDraft(entries);
    setEditing(false);
  }

  if (loading) {
    return (
      <div className="rounded-xl border-2 border-foreground/10 bg-card p-4">
        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  const isEmpty = entries.every((e) => !e.value);

  return (
    <div className="rounded-xl border-2 border-foreground/10 bg-card overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-foreground/5">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-indigo-500" />
          <span className="text-sm font-black">{title}</span>
        </div>
        {isOperator && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-bold"
          >
            <Pencil className="h-3 w-3" />
            편집
          </button>
        )}
        {editing && (
          <div className="flex gap-1">
            <button onClick={cancelEdit} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5">
              <X className="h-3 w-3" />취소
            </button>
            <button onClick={save} className="text-xs text-indigo-600 hover:text-indigo-800 font-black flex items-center gap-0.5 ml-2">
              <Check className="h-3 w-3" />저장
            </button>
          </div>
        )}
      </div>

      {/* 내용 */}
      <div className="px-4 py-3 space-y-3">
        {editing ? (
          draft.map((entry, i) => (
            <div key={entry.field} className="space-y-1">
              <label className="text-xs font-bold text-indigo-700">{entry.field}</label>
              <textarea
                value={entry.value}
                onChange={(e) =>
                  setDraft((prev) =>
                    prev.map((d, j) => (j === i ? { ...d, value: e.target.value } : d))
                  )
                }
                rows={2}
                placeholder={`${entry.field} 내용을 입력하세요`}
                className="w-full border-2 border-indigo-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>
          ))
        ) : isEmpty ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {isOperator ? "편집 버튼으로 정보를 입력해보세요." : "아직 등록된 정보가 없습니다."}
          </p>
        ) : (
          entries.map((entry) =>
            entry.value ? (
              <div key={entry.field} className="space-y-0.5">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                  {entry.field}
                </p>
                {allowEmbed && isUrl(entry.value) ? (
                  <a
                    href={entry.value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    {entry.value}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <p className="text-sm whitespace-pre-wrap break-words">{entry.value}</p>
                )}
              </div>
            ) : null
          )
        )}
      </div>
    </div>
  );
}
