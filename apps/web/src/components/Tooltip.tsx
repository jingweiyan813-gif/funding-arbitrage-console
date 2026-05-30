import type { ReactNode } from "react";

type TooltipProps = {
  label: ReactNode;
  text: string;
};

export function Tooltip({ label, text }: TooltipProps) {
  return (
    <span className="tooltip-term" title={text}>
      {label}
    </span>
  );
}
