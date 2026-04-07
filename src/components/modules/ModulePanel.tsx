"use client";

import { Suspense, lazy } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// 모듈별 패널 컴포넌트를 동적으로 로드
const MODULE_PANELS: Record<string, React.ComponentType<ModulePanelProps>> = {};

// 등록 함수 (각 모듈에서 호출)
export function registerModule(moduleId: string, component: React.ComponentType<ModulePanelProps>) {
  MODULE_PANELS[moduleId] = component;
}

export type ModulePanelProps = {
  slotId: string;
  moduleId: string;
  config: Record<string, unknown>;
  isOperator?: boolean;
  isOrganizer?: boolean;
  eventId?: string;
};

export function ModulePanel({ slotId, moduleId, config, isOperator, isOrganizer, eventId }: ModulePanelProps) {
  const Panel = MODULE_PANELS[moduleId];
  if (!Panel) return null;
  return (
    <Suspense fallback={<Skeleton className="h-24 w-full rounded-lg" />}>
      <Panel slotId={slotId} moduleId={moduleId} config={config} isOperator={isOperator} isOrganizer={isOrganizer} eventId={eventId} />
    </Suspense>
  );
}
