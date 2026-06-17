import { Check } from 'lucide-react';
import styles from './FeatureSection.module.css';

/**
 * FeatureSection — alternating two-column layout block.
 * Used exclusively on the landing page; lives in components/landing/ rather
 * than components/ui/ because it encodes a page-layout pattern, not a
 * reusable UI primitive.
 *
 * Props:
 *   tag       string  — small bordered label above heading (e.g. "Voice Submission")
 *   heading   string
 *   body      string  — supporting paragraph
 *   bullets   Array<{ icon: ReactNode, label: string }>
 *   panel     ReactNode — right (or left) visual panel
 *   flip      boolean  — when true, panel comes first (left), text second (right)
 *   id        string   — section anchor id
 */
export function FeatureSection({ tag, heading, body, bullets = [], panel, flip = false, id }) {
  return (
    <section id={id} className={`${styles.section} ${flip ? styles.flip : ''}`}>
      <div className={styles.text_col}>
        {tag && <span className={styles.tag}>{tag}</span>}
        <h2 className={styles.heading}>{heading}</h2>
        <p className={styles.body}>{body}</p>
        <ul className={styles.bullets}>
          {bullets.map((b, i) => (
            <li key={i} className={styles.bullet}>
              <span className={styles.bullet_icon}>{b.icon ?? <Check size={14} />}</span>
              <span>{b.label}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className={styles.panel_col}>
        {panel}
      </div>
    </section>
  );
}
