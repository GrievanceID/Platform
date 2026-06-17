import { useTranslation } from 'react-i18next';
import { Card } from '../../components/ui';
import styles from './AdminDashboardPage.module.css';

export function AdminStatsPage() {
  const { t } = useTranslation();
  return (
    <div className={styles.page}>
      <div className={styles.page_header}>
        <h1 className={styles.page_title}>{t('admin.stats_title')}</h1>
        <p className={styles.page_sub}>{t('admin.stats_sub')}</p>
      </div>
      <Card>
        <div className={styles.placeholder}>{t('admin.stats_placeholder')}</div>
      </Card>
    </div>
  );
}
