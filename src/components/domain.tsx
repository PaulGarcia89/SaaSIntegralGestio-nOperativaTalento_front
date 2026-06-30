"use client";

import { useState, type ReactNode } from "react";

type ToolbarOption = {
  label: string;
  value: string;
};

export function FilterToolbar({
  searchPlaceholder,
  options,
  activeValue,
  onChange,
}: {
  searchPlaceholder: string;
  options: ToolbarOption[];
  activeValue: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="filter-toolbar">
      <input
        aria-label={searchPlaceholder}
        className="toolbar-search"
        placeholder={searchPlaceholder}
        value={activeValue}
        onChange={(event) => onChange(event.target.value)}
      />
      <div className="toolbar-chips">
        {options.map((option) => (
          <button
            key={option.value}
            className={activeValue === option.value ? "toolbar-chip active" : "toolbar-chip"}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function StateCard({
  title,
  description,
  tone,
  action,
}: {
  title: string;
  description: string;
  tone: "empty" | "restricted";
  action?: ReactNode;
}) {
  return (
    <section className={`state-card ${tone}`}>
      <div className="state-icon" />
      <h3>{title}</h3>
      <p>{description}</p>
      {action ? <div className="state-action">{action}</div> : null}
    </section>
  );
}

export function DrawerPreview({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <aside className="panel drawer-panel">
      <div className="panel-head">
        <div>
          <p className="section-label">{subtitle}</p>
          <h3>{title}</h3>
        </div>
      </div>
      <div className="drawer-body">{children}</div>
    </aside>
  );
}

export function DomainTable<T>({
  data,
  columns,
  onSelect,
  getKey,
}: {
  data: T[];
  columns: Array<{ key: string; header: string; render: (row: T) => ReactNode }>;
  onSelect?: (row: T) => void;
  getKey: (row: T) => string;
}) {
  return (
    <div className="table-wrap">
      <table className="data-table data-table-interactive">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={getKey(row)}
              onClick={() => onSelect?.(row)}
              className={onSelect ? "clickable-row" : undefined}
            >
              {columns.map((column) => (
                <td key={`${getKey(row)}-${column.key}`}>{column.render(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function useSelectableRow<T>(items: T[]) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  return {
    selected: items[selectedIndex] ?? items[0] ?? null,
    selectIndex: setSelectedIndex,
  };
}
