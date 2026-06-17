import styles from './Table.module.css';

/**
 * Table — sortable-ready data table.
 *
 * Sorting state is caller-managed (pass sortKey/sortDir + onSort) so the
 * component stays stateless and the parent controls fetch/filter logic.
 *
 * Props:
 *   columns   Array<{ key, label, sortable?, width?, align? }>
 *   rows      Array<Record<string, any>>
 *   rowKey    string | (row) => string   — unique key per row
 *   sortKey   string | null              — currently sorted column key
 *   sortDir   'asc' | 'desc'
 *   onSort    (key: string) => void      — called when a sortable header is clicked
 *   empty       ReactNode                  — shown when rows is empty
 *   onRowClick  (row) => void              — optional row click handler; adds pointer cursor
 *   emptyMessage string                   — shorthand for empty when no custom node needed
 */
export function Table({
  columns = [],
  rows = [],
  rowKey = 'id',
  sortKey,
  sortDir = 'asc',
  onSort,
  empty,
  emptyMessage,
  onRowClick,
}) {
  const get_key = typeof rowKey === 'function' ? rowKey : (row) => row[rowKey];

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead className={styles.thead}>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={[
                  styles.th,
                  col.sortable ? styles.sortable : '',
                  col.align === 'right' ? styles.align_right : '',
                  col.align === 'center' ? styles.align_center : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={col.width ? { width: col.width } : undefined}
                onClick={col.sortable && onSort ? () => onSort(col.key) : undefined}
                aria-sort={
                  col.sortable && sortKey === col.key
                    ? sortDir === 'asc' ? 'ascending' : 'descending'
                    : undefined
                }
              >
                <span className={styles.th_inner}>
                  {col.label}
                  {col.sortable && (
                    <SortIcon active={sortKey === col.key} dir={sortDir} />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className={styles.empty}>
                {empty ?? emptyMessage ?? 'No records found.'}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={get_key(row)}
                className={`${styles.tr} ${onRowClick ? styles.tr_clickable : ''}`}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={onRowClick ? (e) => { if (e.key === 'Enter') onRowClick(row); } : undefined}
                role={onRowClick ? 'button' : undefined}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={[
                      styles.td,
                      col.align === 'right' ? styles.align_right : '',
                      col.align === 'center' ? styles.align_center : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function SortIcon({ active, dir }) {
  return (
    <span className={`${styles.sort_icon} ${active ? styles.sort_active : ''}`} aria-hidden>
      {active && dir === 'desc' ? '↓' : '↑'}
    </span>
  );
}
