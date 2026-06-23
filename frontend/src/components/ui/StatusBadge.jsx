import { useTranslation } from 'react-i18next';
import styles from './StatusBadge.module.css';

const STATUS_STYLE = {
  submitted:           'submitted',
  transcribed:         'transcribed',
  categorized:         'categorized',
  pending_review:      'pending',
  routed:              'routed',
  resolved:            'resolved',
  // live_session statuses
  recording:           'recording',
  pending_processing:  'transcribed',
  processing:          'categorized',
};

export function StatusBadge({ status }) {
  const { t } = useTranslation();
  const style = STATUS_STYLE[status] ?? 'submitted';
  const label = t(`status.${status}`, { defaultValue: status });

  return (
    <span className={`${styles.badge} ${styles[style]}`}>
      {label}
    </span>
  );
}
