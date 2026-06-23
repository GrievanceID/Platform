import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Table, StatusBadge } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { api_request } from '../../api/client';
import styles from './EmployeeSessionsPage.module.css';

export function EmployeeSessionsPage() {
  const { token } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [sessions, set_sessions] = useState([]);
  const [loading, set_loading] = useState(true);
  const [error, set_error] = useState('');

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    api_request('/live-sessions', { token })
      .then(({ data }) => {
        if (!cancelled) { set_sessions(data.sessions ?? []); set_loading(false); }
      })
      .catch(() => {
        if (!cancelled) { set_error(t('employee.sessions_error')); set_loading(false); }
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

  function fmt_duration(seconds) {
    if (seconds == null) return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return t('employee.sessions_duration_fmt', { m, s: String(s).padStart(2, '0') });
  }

  const columns = [
    {
      key: 'id',
      label: t('employee.sessions_col_ref'),
      width: '120px',
      render: (val) => <span className={styles.ref_cell}>{val.slice(0, 8).toUpperCase()}</span>,
    },
    {
      key: 'title',
      label: t('employee.sessions_col_title'),
      render: (val) => val
        ? <span className={styles.title_cell}>{val}</span>
        : <span className={styles.muted}>—</span>,
    },
    {
      key: 'created_at',
      label: t('employee.sessions_col_date'),
      width: '140px',
      render: (val) => fmt_date(val),
    },
    {
      key: 'duration_seconds',
      label: t('employee.sessions_col_duration'),
      width: '110px',
      render: (val) => fmt_duration(val),
    },
    {
      key: 'status',
      label: t('employee.sessions_col_status'),
      width: '160px',
      render: (val) => <StatusBadge status={val} />,
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.page_header}>
        <div className={styles.header_row}>
          <div>
            <h1 className={styles.page_title}>{t('employee.sessions_title')}</h1>
            <p className={styles.page_sub}>{t('employee.sessions_sub')}</p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/employee/sessions/new')}
          >
            {t('employee.sessions_start_btn')}
          </Button>
        </div>
      </div>

      {loading && <p className={styles.loading}>{t('employee.sessions_loading')}</p>}
      {error && <p className={styles.error_msg} role="alert">{error}</p>}

      {!loading && !error && (
        <Table
          columns={columns}
          rows={sessions}
          rowKey="id"
          emptyMessage={t('employee.sessions_empty')}
          onRowClick={(row) => navigate(`/employee/sessions/${row.id}`)}
        />
      )}
    </div>
  );
}
