import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Table, StatusBadge } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { api_request } from '../../api/client';
import styles from './EmployeeDashboardPage.module.css';

export function EmployeeDashboardPage() {
  const { token } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [grievances, set_grievances] = useState([]);
  const [loading, set_loading] = useState(true);
  const [error, set_error] = useState('');

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    api_request('/grievances', { token })
      .then(({ data }) => {
        if (!cancelled) { set_grievances(data.grievances ?? []); set_loading(false); }
      })
      .catch(() => {
        if (!cancelled) { set_error(t('employee.queue_error')); set_loading(false); }
      });
    return () => { cancelled = true; };
  }, [token]);

  const locale = i18n.language === 'ar' ? 'ar-MA' : 'fr-FR';
  function fmt_date(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString(locale, {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  }

  // Stats derived from fetched list — no separate endpoint needed
  const now = new Date();
  const week_start = new Date(now);
  week_start.setDate(now.getDate() - now.getDay());
  week_start.setHours(0, 0, 0, 0);

  const count_open = grievances.filter((g) => g.status !== 'resolved').length;
  const count_resolved_week = grievances.filter(
    (g) => g.status === 'resolved' && new Date(g.created_at) >= week_start,
  ).length;
  const count_total = grievances.length;

  const columns = [
    {
      key: 'id',
      label: t('employee.queue_col_ref'),
      width: '140px',
      render: (val) => <span className={styles.ref_cell}>{val.slice(0, 8).toUpperCase()}</span>,
    },
    {
      key: 'category',
      label: t('employee.queue_col_category'),
      render: (val) => val
        ? <span className={styles.category_cell}>{val}</span>
        : <span className={styles.muted}>—</span>,
    },
    {
      key: 'urgency',
      label: t('employee.queue_col_urgency'),
      width: '110px',
      align: 'center',
      render: (val) => val
        ? <span className={`${styles.urgency_cell} ${styles[`urgency_${val}`]}`}>{val}</span>
        : <span className={styles.muted}>—</span>,
    },
    {
      key: 'created_at',
      label: t('employee.queue_col_date'),
      width: '140px',
      render: (val) => fmt_date(val),
    },
    {
      key: 'status',
      label: t('employee.queue_col_status'),
      width: '150px',
      render: (val) => <StatusBadge status={val} />,
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.page_header}>
        <h1 className={styles.page_title}>{t('employee.dashboard_title')}</h1>
        <p className={styles.page_sub}>{t('employee.dashboard_sub')}</p>
      </div>

      {!loading && !error && (
        <div className={styles.stats_strip}>
          <div className={styles.stat}>
            <span className={styles.stat_value}>{count_open}</span>
            <span className={styles.stat_label}>{t('employee.queue_stat_open')}</span>
          </div>
          <div className={styles.stat_divider} />
          <div className={styles.stat}>
            <span className={styles.stat_value}>{count_resolved_week}</span>
            <span className={styles.stat_label}>{t('employee.queue_stat_resolved')}</span>
          </div>
          <div className={styles.stat_divider} />
          <div className={styles.stat}>
            <span className={styles.stat_value}>{count_total}</span>
            <span className={styles.stat_label}>{t('employee.queue_stat_total')}</span>
          </div>
        </div>
      )}

      {loading && <p className={styles.loading}>{t('employee.queue_loading')}</p>}
      {error && <p className={styles.error_msg} role="alert">{error}</p>}

      {!loading && !error && (
        <Table
          columns={columns}
          rows={grievances}
          rowKey="id"
          emptyMessage={t('employee.queue_empty')}
          onRowClick={(row) => navigate(`/employee/cases/${row.id}`)}
        />
      )}
    </div>
  );
}
