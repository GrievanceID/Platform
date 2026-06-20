import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sidebar } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { toggle_lang } from '../i18n';
import { api_request } from '../api/client';
import { useGrievanceNotifications } from '../hooks/useGrievanceNotifications';
import styles from './CitizenLayout.module.css';

export function CitizenLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token, logout } = useAuth();
  const { t } = useTranslation();

  const [grievances, set_grievances] = useState([]);
  const { unseen_count, mark_all_seen } = useGrievanceNotifications(user?.id, grievances);

  // Lightweight background fetch — only id + status needed for badge computation.
  // Uses the same endpoint as GrievanceListPage (browser deduplicates if concurrent).
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    api_request('/grievances/mine', { token })
      .then(({ data }) => {
        if (!cancelled) set_grievances(data.grievances ?? []);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [token]);

  // Mark all seen when citizen lands on the list page
  useEffect(() => {
    if (location.pathname === '/grievances/mine' && grievances.length > 0) {
      mark_all_seen();
    }
  }, [location.pathname, grievances]);

  const NAV_ITEMS = [
    {
      key: '/grievances/mine',
      label: (
        <span className={styles.nav_label_with_badge}>
          {t('citizen.nav_grievances')}
          {unseen_count > 0 && (
            <span className={styles.nav_badge} aria-label={`${unseen_count} nouveaux`}>
              {unseen_count > 9 ? '9+' : unseen_count}
            </span>
          )}
        </span>
      ),
      icon: <ListIcon />,
    },
    { key: '/grievances/new',  label: t('citizen.nav_submit'),     icon: <PlusIcon /> },
    { key: '/profile',         label: t('citizen.nav_profile'),    icon: <PersonIcon /> },
    { key: '/help',            label: t('citizen.nav_help'),       icon: <HelpIcon /> },
  ];

  const active_key = NAV_ITEMS.find((item) =>
    location.pathname.startsWith(item.key)
  )?.key ?? NAV_ITEMS[0].key;
  // /grievances/new must not match /grievances/mine prefix — refine:
  const resolved_key = (() => {
    if (location.pathname === '/grievances/new') return '/grievances/new';
    if (location.pathname.startsWith('/grievances/')) return '/grievances/mine';
    return active_key;
  })();

  async function handle_logout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className={styles.shell}>
      <Sidebar
        items={NAV_ITEMS}
        activeKey={resolved_key}
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

function PersonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6.5 6a1.5 1.5 0 0 1 3 0c0 1-1.5 1.5-1.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="11.5" r="0.75" fill="currentColor" />
    </svg>
  );
}
