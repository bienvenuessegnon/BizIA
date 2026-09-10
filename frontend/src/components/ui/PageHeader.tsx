import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  actions?: ReactNode;
};

export function PageHeader({ eyebrow, title, description, action, actions }: PageHeaderProps) {
  const actionSlot = actions ?? action;

  return (
    <header className="page-hero">
      <div className="page-hero__text">
        {eyebrow && <p className="page-hero__eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="page-hero__desc">{description}</p>}
      </div>
      {actionSlot && <div className="page-hero__actions">{actionSlot}</div>}
    </header>
  );
}
