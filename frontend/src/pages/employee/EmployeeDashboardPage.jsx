import { useTranslation } from 'react-i18next';
import { Card } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import styles from './EmployeeDashboardPage.module.css';

export function EmployeeDashboardPage() {
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <div className={styles.page}>
      <div className={styles.page_header}>
        <h1 className={styles.page_title}>{t('employee.dashboard_title')}</h1>
        <p className={styles.page_sub}>{t('employee.dashboard_sub')}</p>
      </div>
      <Card>
        <div className={styles.placeholder}>{t('employee.dashboard_placeholder')}</div>
      </Card>
    </div>
  );
}
