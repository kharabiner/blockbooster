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
};

export function BoothModules({ slotId, modules, isOperator }: Props) {
  return (
    <div className="space-y-3">
      {modules.map((m) => (
        <ModuleRenderer
          key={m.moduleId}
          slotId={slotId}
          moduleId={m.moduleId}
          config={m.config}
          isOperator={isOperator}
        />
      ))}
    </div>
  );
}
