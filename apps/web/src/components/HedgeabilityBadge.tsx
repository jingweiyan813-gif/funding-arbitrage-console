import type { MinedOpportunity } from "../types";

type HedgeabilityBadgeProps = {
  hedgeable: MinedOpportunity["hedgeability"]["hedgeable"];
};

const labelByHedgeable: Record<MinedOpportunity["hedgeability"]["hedgeable"], string> = {
  true: "可对冲",
  conditional: "有条件",
  false: "不可对冲"
};

export function HedgeabilityBadge({ hedgeable }: HedgeabilityBadgeProps) {
  return (
    <span className={`hedgeability-badge hedgeability-badge--${hedgeable}`}>
      {labelByHedgeable[hedgeable]}
    </span>
  );
}
