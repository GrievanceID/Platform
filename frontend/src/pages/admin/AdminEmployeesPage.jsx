import { useTranslation } from 'react-i18next';
import { Card } from '../../components/ui';
import styles from './AdminDashboardPage.module.css';

export function AdminEmployeesPage() {
  const { t } = useTranslation();
  return (
    <div className={styles.page}>
      <div className={styles.page_header}>
        <h1 className={styles.page_title}>{t('admin.employees_title')}</h1>
        <p className={styles.page_sub}>{t('admin.employees_sub')}</p>
      </div>
      <Card>
        <div className={styles.placeholder}>{t('admin.employees_placeholder')}</div>
      </Card>
    </div>
  );
}
