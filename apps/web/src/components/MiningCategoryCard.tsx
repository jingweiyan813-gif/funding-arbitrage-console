import type { ReactNode } from "react";
import type { MiningCategory } from "../types";

type MiningCategoryCardProps = {
  title: string;
  description: string;
  category: MiningCategory;
  count: number;
  children: ReactNode;
};

export function MiningCategoryCard({
  title,
  description,
  category,
  count,
  children
}: MiningCategoryCardProps) {
  return (
    <section className={`mining-category-card mining-category-card--${category}`}>
      <div className="mining-category-heading">
        <div>
          <span className="section-kicker">{categoryLabel(category)}</span>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        <strong>{count}</strong>
      </div>
      {children}
    </section>
  );
}

function categoryLabel(category: MiningCategory): string {
  if (category === "true") {
    return "true opportunity";
  }

  if (category === "conditional") {
    return "conditional";
  }

  return "trap";
}
