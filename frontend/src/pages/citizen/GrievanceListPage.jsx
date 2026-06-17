import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, StatusBadge, Button } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { api_request } from '../../api/client';
import styles from './GrievanceListPage.module.css';

// Table col.render receives (cellValue, row) — second arg is the full row.
const COLUMNS = [
  {
    key: 'id',
    label: 'Reference',
    render: (_val, row) => (
      <span className={styles.ref_id}>{truncate_id(row.id)}</span>
    ),
  },
  {
    key: 'submitted_at',
    label: 'Submitted',
    render: (val) => format_date(val),
  },
  {
    key: 'category',
    label: 'Category',
    render: (val) => val ?? <span className={styles.muted}>—</span>,
  },
  {
    key: 'status',
    label: 'Status',
    render: (val) => <StatusBadge status={val} />,
  },
];

export function GrievanceListPage() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [grievances, set_grievances] = useState([]);
  const [loading, set_loading] = useState(true);
  const [error, set_error] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function fetch_grievances() {
      set_loading(true);
      set_error('');
      try {
        const { data } = await api_request('/grievances/mine', { token });
        if (!cancelled) set_grievances(data.grievances ?? []);
      } catch (err) {
        if (!cancelled) set_error(err.message ?? 'Failed to load grievances.');
      } finally {
        if (!cancelled) set_loading(false);
      }
    }

    fetch_grievances();
    return () => { cancelled = true; };
  }, [token]);

  function handle_row_click(row) {
    navigate(`/grievances/${row.id}`);
  }

  return (
    <div className={styles.page}>
      <div className={styles.page_header}>
        <div>
          <h1 className={styles.page_title}>My Grievances</h1>
          <p className={styles.page_desc}>
            Track the status of your submitted grievances.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate('/grievances/new')}
        >
          Submit new
        </Button>
      </div>

      {error && (
        <div className={styles.error_banner} role="alert">{error}</div>
      )}

      {loading && (
        <div className={styles.loading_state} aria-live="polite">
          Loading grievances…
        </div>
      )}

      {!loading && !error && (
        <Table
          columns={COLUMNS}
          rows={grievances}
          onRowClick={handle_row_click}
          emptyMessage="You have not submitted any grievances yet."
        />
      )}
    </div>
  );
}

function truncate_id(id) {
  if (!id) return '—';
  return id.slice(0, 8).toUpperCase();
}

function format_date(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
