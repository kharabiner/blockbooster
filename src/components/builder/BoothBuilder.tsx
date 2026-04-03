"use client";

import { useState, useCallback, useRef } from "react";
import { buttonVariants } from "@/lib/button-variants";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Save, Trash2, ArrowLeft, ExternalLink, Loader2, Move, SquarePlus } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Slot = {
  id?: string;
  posX: number;
  posY: number;
  width: number;
  height: number;
  color: string;
  label?: string | null;
  booth?: { id: string; name: string } | null;
};

type BoothBuilderProps = {
  eventId: string;
  eventTitle: string;
  gridRows: number;
  gridCols: number;
  initialSlots: Slot[];
};

const CELL = 48;

const COLORS = [
  "#6366f1","#8b5cf6","#ec4899","#ef4444",
  "#f97316","#eab308","#22c55e","#14b8a6",
  "#3b82f6","#06b6d4","#f43f5e","#a16207",
];

// 충돌 감지 (excludeIdx 제외)
function hasOverlap(slots: Slot[], candidate: Slot, excludeIdx = -1) {
  return slots.some((s, i) => {
    if (i === excludeIdx) return false;
    return (
      candidate.posX < s.posX + s.width &&
      candidate.posX + candidate.width > s.posX &&
      candidate.posY < s.posY + s.height &&
      candidate.posY + candidate.height > s.posY
    );
  });
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export function BoothBuilder({ eventId, eventTitle, gridRows, gridCols, initialSlots }: BoothBuilderProps) {
  const [slots, setSlots] = useState<Slot[]>(initialSlots);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [slotLabel, setSlotLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  // ─── 새 슬롯 그리기 드래그 ───────────────────────────────────
  type DrawState = { startX: number; startY: number; endX: number; endY: number } | null;
  const [drawing, setDrawing] = useState<DrawState>(null);

  // ─── 기존 슬롯 이동 드래그 ───────────────────────────────────
  type MoveState = {
    slotIdx: number;
    offsetCellX: number; // 슬롯 내 클릭 위치 (셀 단위)
    offsetCellY: number;
    curX: number;
    curY: number;
  } | null;
  const [moving, setMoving] = useState<MoveState>(null);

  const gridRef = useRef<HTMLDivElement>(null);

  // 그리드 기준 셀 좌표 계산
  const cellFromMouse = useCallback((e: React.MouseEvent | MouseEvent) => {
    const rect = gridRef.current!.getBoundingClientRect();
    return {
      x: clamp(Math.floor((e.clientX - rect.left) / CELL), 0, gridCols - 1),
      y: clamp(Math.floor((e.clientY - rect.top)  / CELL), 0, gridRows - 1),
    };
  }, [gridCols, gridRows]);

  // ── 슬롯 클릭 → 이동 모드 시작 ───────────────────────────────
  function onSlotMouseDown(e: React.MouseEvent, idx: number) {
    e.stopPropagation();
    const { x, y } = cellFromMouse(e);
    const slot = slots[idx];
    setSelectedIdx(idx);
    setMoving({
      slotIdx: idx,
      offsetCellX: x - slot.posX,
      offsetCellY: y - slot.posY,
      curX: slot.posX,
      curY: slot.posY,
    });
  }

  // ── 그리드 빈 곳 mousedown → 그리기 모드 ─────────────────────
  function onGridMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if (e.button !== 0 || moving) return;
    const { x, y } = cellFromMouse(e);
    setSelectedIdx(null);
    setDrawing({ startX: x, startY: y, endX: x, endY: y });
  }

  // ── 마우스 이동 ───────────────────────────────────────────────
  function onGridMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const { x, y } = cellFromMouse(e);

    if (moving) {
      const newX = clamp(x - moving.offsetCellX, 0, gridCols - slots[moving.slotIdx].width);
      const newY = clamp(y - moving.offsetCellY, 0, gridRows - slots[moving.slotIdx].height);
      setMoving((m) => m && { ...m, curX: newX, curY: newY });
      return;
    }

    if (drawing) {
      setDrawing((d) => d && { ...d, endX: x, endY: y });
    }
  }

  // ── 마우스 업 ─────────────────────────────────────────────────
  function onGridMouseUp() {
    if (moving) {
      const { slotIdx, curX, curY } = moving;
      const slot = slots[slotIdx];
      const candidate = { ...slot, posX: curX, posY: curY };

      if (hasOverlap(slots, candidate, slotIdx)) {
        toast.warning("다른 슬롯과 겹칩니다. 원래 위치로 돌아갑니다.");
      } else {
        setSlots((prev) =>
          prev.map((s, i) => (i === slotIdx ? { ...s, posX: curX, posY: curY } : s))
        );
      }
      setMoving(null);
      return;
    }

    if (drawing) {
      const posX = Math.min(drawing.startX, drawing.endX);
      const posY = Math.min(drawing.startY, drawing.endY);
      const width = Math.abs(drawing.endX - drawing.startX) + 1;
      const height = Math.abs(drawing.endY - drawing.startY) + 1;

      const candidate = { posX, posY, width, height, color: selectedColor };
      if (hasOverlap(slots, candidate)) {
        toast.warning("다른 슬롯과 겹칩니다.");
      } else {
        const newSlot: Slot = { posX, posY, width, height, color: selectedColor, label: slotLabel || undefined };
        setSlots((prev) => {
          const next = [...prev, newSlot];
          setSelectedIdx(next.length - 1);
          return next;
        });
      }
      setDrawing(null);
    }
  }

  function removeSlot(idx: number) {
    if (slots[idx].booth) { toast.error("부스가 연결된 슬롯은 삭제할 수 없습니다."); return; }
    setSlots((prev) => prev.filter((_, i) => i !== idx));
    setSelectedIdx(null);
  }

  function updateSlotColor(idx: number, color: string) {
    setSlots((prev) => prev.map((s, i) => (i === idx ? { ...s, color } : s)));
  }

  function updateSlotLabel(idx: number, label: string) {
    setSlots((prev) => prev.map((s, i) => (i === idx ? { ...s, label } : s)));
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/events/${eventId}/slots`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slots: slots.map(({ posX, posY, width, height, color, label }) => ({
          posX, posY, width, height, color, label,
        })),
      }),
    });
    setSaving(false);
    if (!res.ok) { toast.error("저장에 실패했습니다."); return; }
    const data = await res.json();
    setSlots(data.slots);
    toast.success("저장되었습니다! 💾");
  }

  // ─── 미리보기 박스 ────────────────────────────────────────────
  const preview = drawing
    ? {
        posX: Math.min(drawing.startX, drawing.endX),
        posY: Math.min(drawing.startY, drawing.endY),
        width: Math.abs(drawing.endX - drawing.startX) + 1,
        height: Math.abs(drawing.endY - drawing.startY) + 1,
      }
    : null;

  // 이동 중인 슬롯의 ghost 박스
  const movingGhost = moving ? { ...slots[moving.slotIdx], posX: moving.curX, posY: moving.curY } : null;

  const selSlot = selectedIdx !== null ? slots[selectedIdx] : null;

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      {/* 상단 툴바 */}
      <div className="border-b-2 border-foreground bg-background px-4 py-2.5 flex items-center gap-3 flex-wrap shadow-[0_2px_0px_rgba(0,0,0,0.6)]">
        <Link href="/dashboard" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
          <ArrowLeft className="h-4 w-4" />대시보드
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-black text-sm truncate">{eventTitle}</h1>
          <p className="text-xs text-muted-foreground font-semibold">
            빈 곳 드래그 → 새 슬롯 · 슬롯 드래그 → 이동
          </p>
        </div>
        <Link href={`/events/${eventId}`} target="_blank" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          <ExternalLink className="h-4 w-4" />미리보기
        </Link>
        <Button size="sm" onClick={handleSave} disabled={saving} className="font-black">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          저장
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* 좌측 패널 */}
        <div className="w-56 border-r-2 border-foreground bg-background p-4 space-y-5 overflow-y-auto flex-shrink-0">

          {selSlot ? (
            /* 선택된 슬롯 편집 패널 */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-wide">슬롯 편집</p>
                <button
                  onClick={() => setSelectedIdx(null)}
                  className="text-xs text-muted-foreground hover:text-foreground font-semibold"
                >
                  취소
                </button>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">라벨</Label>
                <Input
                  value={selSlot.label ?? ""}
                  onChange={(e) => updateSlotLabel(selectedIdx!, e.target.value)}
                  placeholder="예: A-1, 식품존..."
                  className="h-8 text-sm"
                />
              </div>

              <div>
                <Label className="text-xs font-bold mb-2 block">색상</Label>
                <div className="grid grid-cols-4 gap-1.5">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      className="w-8 h-8 rounded-md border-2 transition-transform hover:scale-110"
                      style={{ backgroundColor: c, borderColor: selSlot.color === c ? "black" : "transparent" }}
                      onClick={() => updateSlotColor(selectedIdx!, c)}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-1 text-xs text-muted-foreground font-semibold space-y-1">
                <p>크기: {selSlot.width}×{selSlot.height} 칸</p>
                <p>위치: ({selSlot.posX}, {selSlot.posY})</p>
              </div>

              {!selSlot.booth && (
                <button
                  onClick={() => removeSlot(selectedIdx!)}
                  className="flex items-center gap-2 text-xs font-bold text-red-600 hover:text-red-800 border border-red-200 hover:border-red-400 rounded-lg px-3 py-2 w-full transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" /> 슬롯 삭제
                </button>
              )}
            </div>
          ) : (
            /* 새 슬롯 생성 패널 */
            <div className="space-y-4">
              <p className="text-xs font-black uppercase tracking-wide flex items-center gap-1.5">
                <SquarePlus className="h-3.5 w-3.5" /> 새 슬롯
              </p>

              <div>
                <Label className="text-xs font-bold mb-2 block">색상 선택</Label>
                <div className="grid grid-cols-4 gap-1.5">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      className="w-8 h-8 rounded-md border-2 transition-transform hover:scale-110"
                      style={{ backgroundColor: c, borderColor: selectedColor === c ? "black" : "transparent" }}
                      onClick={() => setSelectedColor(c)}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">라벨 (선택)</Label>
                <Input
                  placeholder="예: A-1, 식품존..."
                  value={slotLabel}
                  onChange={(e) => setSlotLabel(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>
          )}

          {/* 슬롯 목록 */}
          <div>
            <Label className="text-xs font-black uppercase tracking-wide mb-2 block">
              배치된 슬롯 ({slots.length})
            </Label>
            <div className="space-y-1">
              {slots.map((slot, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedIdx(i)}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-lg border-2 text-xs w-full text-left transition-all",
                    selectedIdx === i
                      ? "border-foreground bg-muted shadow-[2px_2px_0px_rgba(0,0,0,0.7)]"
                      : "border-transparent hover:border-foreground/30 hover:bg-muted/50"
                  )}
                >
                  <div className="w-4 h-4 rounded flex-shrink-0 border border-black/20" style={{ backgroundColor: slot.color }} />
                  <span className="flex-1 truncate font-semibold">
                    {slot.booth?.name ?? slot.label ?? `슬롯 ${i + 1}`}
                  </span>
                  {slot.booth ? (
                    <Badge className="text-[9px] px-1 py-0 bg-green-200 text-green-800 border-green-400 font-black">연결</Badge>
                  ) : (
                    <Move className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 그리드 캔버스 */}
        <div className="flex-1 overflow-auto p-6 bg-muted/10">
          <div
            ref={gridRef}
            className="relative select-none mx-auto"
            style={{
              width: gridCols * CELL,
              height: gridRows * CELL,
              backgroundImage: `
                linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
                linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
              `,
              backgroundSize: `${CELL}px ${CELL}px`,
              backgroundColor: "hsl(var(--card))",
              border: "2px solid hsl(var(--border))",
              borderRadius: "0.5rem",
              cursor: moving ? "grabbing" : "crosshair",
            }}
            onMouseDown={onGridMouseDown}
            onMouseMove={onGridMouseMove}
            onMouseUp={onGridMouseUp}
            onMouseLeave={() => {
              setDrawing(null);
              if (moving) {
                // 그리드 벗어나면 원위치
                setMoving(null);
              }
            }}
          >
            {/* 배치된 슬롯들 */}
            {slots.map((slot, i) => {
              const isMovingThis = moving?.slotIdx === i;
              const isSelected = selectedIdx === i;
              const displaySlot = isMovingThis ? { ...slot, posX: moving!.curX, posY: moving!.curY } : slot;

              return (
                <div
                  key={i}
                  onMouseDown={(e) => onSlotMouseDown(e, i)}
                  className={cn(
                    "absolute rounded-md flex flex-col items-center justify-center text-white text-xs font-black border-2 select-none",
                    isMovingThis
                      ? "opacity-80 cursor-grabbing z-20 shadow-[4px_4px_0px_rgba(0,0,0,0.6)]"
                      : "opacity-90 cursor-grab hover:opacity-100 hover:z-10",
                    isSelected && !isMovingThis ? "ring-2 ring-offset-1 ring-white z-10" : ""
                  )}
                  style={{
                    left:   displaySlot.posX * CELL + 2,
                    top:    displaySlot.posY * CELL + 2,
                    width:  displaySlot.width  * CELL - 4,
                    height: displaySlot.height * CELL - 4,
                    backgroundColor: slot.color,
                    borderColor: "rgba(0,0,0,0.4)",
                    boxShadow: isMovingThis
                      ? "4px 4px 0px rgba(0,0,0,0.5)"
                      : "2px 2px 0px rgba(0,0,0,0.3)",
                    transition: isMovingThis ? "none" : "box-shadow 80ms",
                  }}
                >
                  {slot.booth ? (
                    <>
                      <span className="text-[10px] opacity-70 font-bold">🏪</span>
                      <span className="line-clamp-2 text-center px-1 text-[10px] leading-tight">{slot.booth.name}</span>
                    </>
                  ) : (
                    <span className="line-clamp-2 text-center px-1 leading-tight">{slot.label ?? ""}</span>
                  )}
                </div>
              );
            })}

            {/* 새 슬롯 그리기 미리보기 */}
            {preview && (
              <div
                className="absolute rounded-md border-2 border-dashed pointer-events-none z-30"
                style={{
                  left:   preview.posX * CELL + 2,
                  top:    preview.posY * CELL + 2,
                  width:  preview.width  * CELL - 4,
                  height: preview.height * CELL - 4,
                  backgroundColor: selectedColor,
                  borderColor: "rgba(0,0,0,0.6)",
                  opacity: 0.55,
                }}
              />
            )}
          </div>

          <p className="text-xs text-muted-foreground text-center mt-3 font-semibold">
            빈 곳에 드래그 → 새 슬롯 생성 · 슬롯을 드래그 → 이동 · 슬롯 클릭 → 선택/편집 &nbsp;|&nbsp; {gridCols}×{gridRows} 그리드
          </p>
        </div>
      </div>
    </div>
  );
}
