"use client";

import { VisitorRatingPanel } from "./VisitorRatingPanel";
import { JudgeScoringPanel } from "./JudgeScoringPanel";
import { StampRallyPanel } from "./StampRallyPanel";
import { ProductShowcasePanel } from "./ProductShowcasePanel";
import { LiveChatPanel } from "./LiveChatPanel";
import type { ModulePanelProps } from "./ModulePanel";

const PANELS: Record<string, React.ComponentType<ModulePanelProps>> = {
  "visitor-rating": VisitorRatingPanel,
  "judge-scoring": JudgeScoringPanel,
  "stamp-rally": StampRallyPanel,
  "product-showcase": ProductShowcasePanel,
  "live-chat": LiveChatPanel,
};

export function ModuleRenderer({ slotId, moduleId, config, isOperator }: ModulePanelProps) {
  const Panel = PANELS[moduleId];
  if (!Panel) return null;
  return <Panel slotId={slotId} moduleId={moduleId} config={config} isOperator={isOperator} />;
}

export { VisitorRatingPanel, JudgeScoringPanel, StampRallyPanel, ProductShowcasePanel, LiveChatPanel };
