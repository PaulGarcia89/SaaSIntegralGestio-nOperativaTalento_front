import type { ReactNode } from "react";

type PageIntroProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
};

export function PageIntro({ eyebrow, title, description, actions }: PageIntroProps) {
  return (
    <section className="page-intro">
      <div>
        <span className="eyebrow eyebrow-soft">{eyebrow}</span>
        <h2 className="page-title">{title}</h2>
        <p className="page-copy">{description}</p>
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </section>
  );
}

type MetricCardProps = {
  label: string;
  value: string;
  detail: string;
};

export function MetricCard({ label, value, detail }: MetricCardProps) {
  return (
    <article className="panel metric-panel">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}

type SectionCardProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function SectionCard({ title, subtitle, children }: SectionCardProps) {
  return (
    <section className="panel section-panel">
      <div className="panel-head">
        <div>
          {subtitle ? <p className="section-label">{subtitle}</p> : null}
          <h3>{title}</h3>
        </div>
      </div>
      {children}
    </section>
  );
}

type InfoListProps = {
  items: Array<{
    title: string;
    description: string;
    badge?: string;
  }>;
};

export function InfoList({ items }: InfoListProps) {
  return (
    <ul className="info-list">
      {items.map((item) => (
        <li key={`${item.title}-${item.description}`}>
          <div>
            <strong>{item.title}</strong>
            <span>{item.description}</span>
          </div>
          {item.badge ? <span className="mini-badge">{item.badge}</span> : null}
        </li>
      ))}
    </ul>
  );
}

type DataTableProps = {
  columns: string[];
  rows: string[][];
};

export function DataTable({ columns, rows }: DataTableProps) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.join("-")}>
              {row.map((cell) => (
                <td key={cell}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type SplitPanelProps = {
  left: ReactNode;
  right: ReactNode;
};

export function SplitPanel({ left, right }: SplitPanelProps) {
  return <div className="split-grid">{left}{right}</div>;
}
