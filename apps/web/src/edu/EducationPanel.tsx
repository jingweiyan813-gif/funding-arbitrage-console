import type { ReactNode } from "react";
import { useState } from "react";

type EducationPanelProps = {
  title: string;
  children: ReactNode;
  defaultCollapsed?: boolean;
};

export function EducationPanel({
  title,
  children,
  defaultCollapsed = true
}: EducationPanelProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <section className="education-panel">
      <div className="education-heading">
        <h3>{title}</h3>
        <button onClick={() => setCollapsed((value) => !value)} type="button">
          {collapsed ? "展开说明" : "我懂了"}
        </button>
      </div>
      {collapsed ? null : <div className="education-body">{children}</div>}
    </section>
  );
}
