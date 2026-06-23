import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sidebar } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { toggle_lang } from '../i18n';
import styles from './CitizenLayout.module.css';

export function StaffLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  const NAV_BY_ROLE = {
    reviewer: [
      { key: '/reviewer/queue',   label: t('reviewer.nav_queue'),      icon: <QueueIcon /> },
    ],
    employee: [
      { key: '/employee/dashboard', label: t('employee.nav_grievances'), icon: <ListIcon /> },
    ],
    admin: [
      { key: '/admin/dashboard',  label: t('admin.nav_grievances'), icon: <ListIcon /> },
      { key: '/admin/employees',  label: t('admin.nav_employees'),  icon: <PeopleIcon /> },
      { key: '/admin/stats',      label: t('admin.nav_stats'),      icon: <ChartIcon /> },
      { key: '/admin/issues',     label: t('admin.nav_issues'),     icon: <FlagIcon /> },
    ],
  };

  const nav_items = NAV_BY_ROLE[user?.role] ?? [];

  const active_key = nav_items.find((item) =>
    location.pathname.startsWith(item.key)
  )?.key ?? nav_items[0]?.key;

  async function handle_logout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className={styles.shell}>
      <Sidebar
        items={nav_items}
        activeKey={active_key}
        onNavigate={(key) => navigate(key)}
        header={
          <div className={styles.brand}>
            <img
              src="/src/assets/branding/tawthiqid-logo-sidebar.png"
              alt="TawthiqID"
              className={styles.brand_logo}
              height={28}
            />
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

function QueueIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1" y="2"  width="9"  height="1.5" rx="0.75" fill="currentColor" />
      <rect x="1" y="5"  width="12" height="1.5" rx="0.75" fill="currentColor" />
      <rect x="1" y="8"  width="12" height="1.5" rx="0.75" fill="currentColor" />
      <rect x="1" y="11" width="9"  height="1.5" rx="0.75" fill="currentColor" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="5.5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M1 13c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="11.5" cy="4.5" r="2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M14 12.5c0-1.8-1.1-3-2.5-3.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1"  y="9"  width="3" height="5" rx="0.5" fill="currentColor" />
      <rect x="6"  y="5"  width="3" height="9" rx="0.5" fill="currentColor" />
      <rect x="11" y="2"  width="3" height="12" rx="0.5" fill="currentColor" />
    </svg>
  );
}

function FlagIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 2v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M3 2.5h8.5l-2 3.5 2 3.5H3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
