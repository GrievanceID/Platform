import styles from './StatusTimeline.module.css';

const STEPS = [
  'submitted',
  'transcribed',
  'categorized',
  'pending_review',
  'routed',
  'resolved',
];

export function StatusTimeline({ currentStatus, t }) {
  const current_idx = STEPS.indexOf(currentStatus);

  return (
    <ol className={styles.timeline} aria-label={t('citizen.detail_section_timeline')}>
      {STEPS.map((step, idx) => {
        const is_done    = idx < current_idx;
        const is_current = idx === current_idx;
        const state_class = is_done
          ? styles.step_done
          : is_current
          ? styles.step_current
          : styles.step_future;

        return (
          <li key={step} className={`${styles.step} ${state_class}`}>
            <span className={styles.step_connector} aria-hidden="true" />
            <span className={styles.step_dot} aria-hidden="true">
              {is_done && <CheckMark />}
            </span>
            <span className={styles.step_label}>
              {t(`citizen.timeline_step_${step}`)}
            </span>
            {is_current && (
              <span className={styles.step_current_badge} aria-current="step">
                ●
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function CheckMark() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path
        d="M2 5.5l2 2 4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
