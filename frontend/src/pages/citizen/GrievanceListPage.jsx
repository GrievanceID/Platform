import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Table, StatusBadge, Button } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { api_request } from '../../api/client';
import styles from './GrievanceListPage.module.css';

export function GrievanceListPage() {
  const { token, i18n: _i18n } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [grievances, set_grievances] = useState([]);
  const [loading, set_loading] = useState(true);
  const [error, set_error] = useState('');

  const COLUMNS = [
    {
      key: 'id',
      label: t('citizen.col_ref'),
      render: (_val, row) => (
        <span className={styles.ref_id}>{truncate_id(row.id)}</span>
      ),
    },
    {
      key: 'submitted_at',
      label: t('citizen.col_date'),
      render: (val) => format_date(val, i18n.language),
    },
    {
      key: 'category',
      label: t('citizen.col_category'),
      render: (val) => val ?? <span className={styles.muted}>—</span>,
    },
    {
      key: 'status',
      label: t('citizen.col_status'),
      render: (val) => <StatusBadge status={val} />,
    },
  ];

  useEffect(() => {
    let cancelled = false;
    async function fetch_grievances() {
      set_loading(true);
      set_error('');
      try {
        const { data } = await api_request('/grievances/mine', { token });
        if (!cancelled) set_grievances(data.grievances ?? []);
      } catch (err) {
        if (!cancelled) set_error(err.message ?? t('citizen.list_error'));
      } finally {
        if (!cancelled) set_loading(false);
      }
    }
    fetch_grievances();
    return () => { cancelled = true; };
  }, [token]);

  return (
    <div className={styles.page}>
      <div className={styles.page_header}>
        <div>
          <h1 className={styles.page_title}>{t('citizen.list_title')}</h1>
        </div>
        <Button variant="primary" size="sm" onClick={() => navigate('/grievances/new')}>
          {t('citizen.nav_submit')}
        </Button>
      </div>

      {error && <div className={styles.error_banner} role="alert">{error}</div>}

      {loading && (
        <div className={styles.loading_state} aria-live="polite">
          {t('citizen.list_title')}…
        </div>
      )}

      {!loading && !error && (
        <Table
          columns={COLUMNS}
          rows={grievances}
          onRowClick={(row) => navigate(`/grievances/${row.id}`)}
          emptyMessage={t('citizen.list_empty')}
        />
      )}
    </div>
  );
}

function truncate_id(id) {
  if (!id) return '—';
  return id.slice(0, 8).toUpperCase();
}

function format_date(iso, lang) {
  if (!iso) return '—';
  const locale = lang === 'ar' ? 'ar-MA' : 'fr-FR';
  return new Date(iso).toLocaleDateString(locale, {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}
