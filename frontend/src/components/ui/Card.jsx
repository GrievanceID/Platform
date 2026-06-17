import styles from './Card.module.css';

/**
 * Card — a bordered, surfaced container for content sections and data panels.
 * Intentionally minimal: a white surface, subtle border, minimal radius.
 * Not a marketing card — this is a task-screen panel.
 *
 * Props:
 *   title     string (optional header)
 *   actions   ReactNode (optional header-right slot, e.g. a Button)
 *   padding   'sm' | 'md' | 'lg'   default: 'md'
 *   children  ReactNode
 */
export function Card({ title, actions, padding = 'md', children, className, ...rest }) {
  return (
    <div className={`${styles.card} ${className ?? ''}`} {...rest}>
      {(title || actions) && (
        <div className={styles.header}>
          {title && <h3 className={styles.title}>{title}</h3>}
          {actions && <div className={styles.actions}>{actions}</div>}
        </div>
      )}
      <div className={`${styles.body} ${styles[`padding_${padding}`]}`}>
        {children}
      </div>
    </div>
  );
}
