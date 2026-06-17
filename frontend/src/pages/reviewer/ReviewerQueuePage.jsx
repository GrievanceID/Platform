import { useTranslation } from 'react-i18next';
import { Card } from '../../components/ui';
import styles from './ReviewerQueuePage.module.css';

export function ReviewerQueuePage() {
  const { t } = useTranslation();
  return (
    <div className={styles.page}>
      <div className={styles.page_header}>
        <h1 className={styles.page_title}>{t('reviewer.queue_title')}</h1>
        <p className={styles.page_sub}>{t('reviewer.queue_sub')}</p>
      </div>
      <Card>
        <div className={styles.placeholder}>{t('reviewer.queue_placeholder')}</div>
      </Card>
    </div>
  );
}
