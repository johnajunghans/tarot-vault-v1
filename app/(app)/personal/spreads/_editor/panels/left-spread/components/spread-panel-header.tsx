import type { ReactNode } from "react";

interface SpreadPanelHeaderProps {
  title: string;
  actions?: ReactNode;
}

export default function SpreadPanelHeader({ title, actions }: SpreadPanelHeaderProps) {
  return (
    <div className="flex w-full items-center justify-between gap-8">
      <h3 className="font-display text-base font-bold tracking-tight">{title}</h3>
      <div className="flex items-center gap-1">{actions}</div>
    </div>
  );
}
