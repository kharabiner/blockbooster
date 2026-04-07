"use client";

import { ModuleRenderer } from "./index";

type ModuleConfig = {
  moduleId: string;
  config: Record<string, unknown>;
};

type Props = {
  slotId: string;
  modules: ModuleConfig[];
  isOperator?: boolean;
  isOrganizer?: boolean;
  eventId?: string;
};

export function BoothModules({ slotId, modules, isOperator, isOrganizer, eventId }: Props) {
  return (
    <div className="space-y-3">
      {modules.map((m) => (
        <ModuleRenderer
          key={m.moduleId}
          slotId={slotId}
          moduleId={m.moduleId}
          config={m.config}
          isOperator={isOperator}
          isOrganizer={isOrganizer}
          eventId={eventId}
        />
      ))}
    </div>
  );
}
