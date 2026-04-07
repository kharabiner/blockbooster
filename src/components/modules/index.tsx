"use client";

import { ScoreInputPanel }  from "./ScoreInputPanel";
import { InfoBoardPanel }   from "./InfoBoardPanel";
import { StampPanel }       from "./StampPanel";
import { ChatPanel }        from "./ChatPanel";
import { ReactionPanel }    from "./ReactionPanel";
import { AnnouncementPanel } from "./AnnouncementPanel";
import type { ModulePanelProps } from "./ModulePanel";

const PANELS: Record<string, React.ComponentType<ModulePanelProps>> = {
  "score-input":  ScoreInputPanel,
  "info-board":   InfoBoardPanel,
  "stamp":        StampPanel,
  "chat":         ChatPanel,
  "reaction":     ReactionPanel,
  "announcement": AnnouncementPanel,
};

export function ModuleRenderer({ slotId, moduleId, config, isOperator, isOrganizer, eventId }: ModulePanelProps) {
  const Panel = PANELS[moduleId];
  if (!Panel) return null;
  return (
    <Panel
      slotId={slotId}
      moduleId={moduleId}
      config={config}
      isOperator={isOperator}
      isOrganizer={isOrganizer}
      eventId={eventId}
    />
  );
}

export { ScoreInputPanel, InfoBoardPanel, StampPanel, ChatPanel, ReactionPanel, AnnouncementPanel };
