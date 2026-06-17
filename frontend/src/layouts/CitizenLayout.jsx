import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sidebar } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { toggle_lang } from '../i18n';
import styles from './CitizenLayout.module.css';

export function CitizenLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  const NAV_ITEMS = [
    { key: '/grievances/mine', label: t('citizen.nav_grievances'), icon: <ListIcon /> },
    { key: '/grievances/new',  label: t('citizen.nav_submit'),     icon: <PlusIcon /> },
  ];

  const active_key = NAV_ITEMS.find((item) =>
    location.pathname.startsWith(item.key)
  )?.key ?? NAV_ITEMS[0].key;

  async function handle_logout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className={styles.shell}>
      <Sidebar
        items={NAV_ITEMS}
        activeKey={active_key}
        onNavigate={(key) => navigate(key)}
        header={
          <div className={styles.brand}>
            <span className={styles.brand_name}>GrievanceID</span>
          </div>
        }
        footer={
          <div className={styles.user_footer}>
            <span className={styles.user_email}>{user?.email}</span>
            <button type="button" className={styles.lang_btn} onClick={toggle_lang}>
              {t('lang_toggle.label')}
            </button>
            <button type="button" className={styles.logout_btn} onClick={handle_logout}>
              {t('citizen.sign_out')}
            </button>
          </div>
        }
      />
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
}

function ListIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1" y="3"    width="14" height="1.5" rx="0.75" fill="currentColor" />
      <rect x="1" y="7.25" width="14" height="1.5" rx="0.75" fill="currentColor" />
      <rect x="1" y="11.5" width="14" height="1.5" rx="0.75" fill="currentColor" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="7.25" y="1"  width="1.5" height="14" rx="0.75" fill="currentColor" />
      <rect x="1"    y="7.25" width="14" height="1.5" rx="0.75" fill="currentColor" />
    </svg>
  );
}
