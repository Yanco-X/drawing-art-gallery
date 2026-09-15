import { useState } from 'react';
import type { ReactNode } from 'react';

export interface MetricsColumn<Row> {
  key: keyof Row & string;
  label: string;
  numeric?: boolean;
  render?: (row: Row) => ReactNode;
}

type Cell = string | number;

export const MetricsTable = <Row extends { id: string } & Record<string, Cell>>({
  columns,
  rows,
  sortBy,
  empty,
}: {
  columns: MetricsColumn<Row>[];
  rows: Row[];
  sortBy: keyof Row & string;
  empty: string;
}) => {
  const [sort, setSort] = useState({ key: sortBy, descending: true });

  const sorted = [...rows].sort((a, b) => {
    const left = a[sort.key];
    const right = b[sort.key];
    const order =
      typeof left === 'number' && typeof right === 'number'
        ? left - right
        : String(left).localeCompare(String(right));
    return sort.descending ? -order : order;
  });

  const sortOn = (key: keyof Row & string, numeric: boolean) =>
    setSort((current) =>
      current.key === key
        ? { key, descending: !current.descending }
        : { key, descending: numeric },
    );

  if (rows.length === 0) {
    return <p className="text-[13px] text-faint">{empty}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-line">
            {columns.map((column) => {
              const active = sort.key === column.key;
              return (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={
                    active
                      ? sort.descending
                        ? 'descending'
                        : 'ascending'
                      : undefined
                  }
                  className={`py-2 font-normal ${column.numeric ? 'text-right' : 'text-left'}`}
                >
                  <button
                    type="button"
                    onClick={() => sortOn(column.key, Boolean(column.numeric))}
                    className={`cursor-pointer border-none bg-transparent p-0 text-[12px] uppercase tracking-eyebrow transition-colors duration-200 hover:text-accent ${active ? 'text-text' : 'text-faint'}`}
                  >
                    {column.label}
                    {active && (sort.descending ? ' ↓' : ' ↑')}
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={row.id} className="border-b border-line">
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`py-2.5 pr-4 ${column.numeric ? 'text-right tabular-nums text-muted' : 'text-text'}`}
                >
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
