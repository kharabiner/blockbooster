"use client";

import { VisitorRatingPanel } from "./VisitorRatingPanel";
import { JudgeScoringPanel } from "./JudgeScoringPanel";
import { StampRallyPanel } from "./StampRallyPanel";
import { ProductShowcasePanel } from "./ProductShowcasePanel";
import { LiveChatPanel } from "./LiveChatPanel";
import { AnnouncementPanel } from "./AnnouncementPanel";
import type { ModulePanelProps } from "./ModulePanel";

const PANELS: Record<string, React.ComponentType<ModulePanelProps>> = {
  "visitor-rating": VisitorRatingPanel,
  "judge-scoring": JudgeScoringPanel,
  "stamp-rally": StampRallyPanel,
  "product-showcase": ProductShowcasePanel,
  "live-chat": LiveChatPanel,
  announcement: AnnouncementPanel,
};

export function ModuleRenderer({ slotId, moduleId, config, isOperator, isOrganizer, eventId }: ModulePanelProps) {
  const Panel = PANELS[moduleId];
  if (!Panel) return null;
  return <Panel slotId={slotId} moduleId={moduleId} config={config} isOperator={isOperator} isOrganizer={isOrganizer} eventId={eventId} />;
}

export { VisitorRatingPanel, JudgeScoringPanel, StampRallyPanel, ProductShowcasePanel, LiveChatPanel, AnnouncementPanel };
