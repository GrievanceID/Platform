import styles from './Sidebar.module.css';

/**
 * Sidebar — icon + label navigation with active-state indicator.
 *
 * The active item gets a left-border accent bar in --accent (ochre) and a
 * subtle --accent-subtle background. No active item uses ochre as a flood fill.
 *
 * Props:
 *   items      Array<{ key, label, icon: ReactNode, href? }>
 *   activeKey  string — key of the currently active item
 *   onNavigate (key: string, item: object) => void
 *   header     ReactNode — optional slot above nav items (e.g. org logo/name)
 *   footer     ReactNode — optional slot below nav items (e.g. logged-in user)
 */
export function Sidebar({ items = [], activeKey, onNavigate, header, footer }) {
  return (
    <nav className={styles.sidebar} aria-label="Primary navigation">
      {header && <div className={styles.header}>{header}</div>}

      <ul className={styles.nav_list} role="list">
        {items.map((item) => {
          const is_active = item.key === activeKey;
          return (
            <li key={item.key}>
              <button
                type="button"
                className={`${styles.nav_item} ${is_active ? styles.active : ''}`}
                aria-current={is_active ? 'page' : undefined}
                onClick={() => onNavigate?.(item.key, item)}
              >
                <span className={styles.icon} aria-hidden="true">
                  {item.icon}
                </span>
                <span className={styles.label}>{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {footer && <div className={styles.footer}>{footer}</div>}
    </nav>
  );
}
