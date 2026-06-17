import styles from './StatusBadge.module.css';

/**
 * StatusBadge — renders a grievance lifecycle status as a small coloured label.
 *
 * Each status has a visually distinct background/text pairing drawn from the
 * token palette. All are muted/desaturated — not traffic-light primaries.
 *
 * Props:
 *   status  'submitted' | 'transcribed' | 'categorized' | 'pending_review'
 *           | 'routed' | 'resolved'
 */
const STATUS_META = {
  submitted:      { label: 'Submitted',       style: 'submitted' },
  transcribed:    { label: 'Transcribed',     style: 'transcribed' },
  categorized:    { label: 'Categorized',     style: 'categorized' },
  pending_review: { label: 'Pending Review',  style: 'pending' },
  routed:         { label: 'Routed',          style: 'routed' },
  resolved:       { label: 'Resolved',        style: 'resolved' },
};

export function StatusBadge({ status }) {
  const meta = STATUS_META[status] ?? { label: status, style: 'submitted' };

  return (
    <span className={`${styles.badge} ${styles[meta.style]}`}>
      {meta.label}
    </span>
  );
}
