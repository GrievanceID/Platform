import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { api_request } from '../../api/client';
import styles from './AdminEmployeesPage.module.css';

export function AdminEmployeesPage() {
  const { t, i18n } = useTranslation();
  const { token } = useAuth();

  const [employees, set_employees] = useState([]);
  const [institutions, set_institutions] = useState([]);
  const [loading, set_loading] = useState(true);
  const [error, set_error] = useState('');
  const [filter_inst, set_filter_inst] = useState('');

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    Promise.all([
      api_request('/employees', { token }),
      api_request('/institutions', { token }).catch(() => ({ data: { institutions: [] } })),
    ])
      .then(([emp_res, inst_res]) => {
        if (!cancelled) {
          set_employees(emp_res.data.employees ?? []);
          set_institutions(inst_res.data.institutions ?? []);
          set_loading(false);
        }
      })
      .catch(() => {
        if (!cancelled) { set_error(t('admin.employees_error')); set_loading(false); }
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

  const visible = filter_inst
    ? employees.filter((e) => e.institution_id === filter_inst)
    : employees;

  // Group by institution for display
  const by_inst = {};
  for (const emp of visible) {
    const key = emp.institution_id ?? 'unassigned';
    const label = emp.institution_name ?? key;
    if (!by_inst[key]) by_inst[key] = { label, rows: [] };
    by_inst[key].rows.push(emp);
  }

  return (
    <div className={styles.page}>
      <div className={styles.page_header}>
        <h1 className={styles.page_title}>{t('admin.employees_title')}</h1>
        <p className={styles.page_sub}>{t('admin.employees_sub')}</p>
      </div>

      {/* Institution filter */}
      {!loading && !error && institutions.length > 0 && (
        <div className={styles.filter_strip}>
          <select
            className={styles.filter_select}
            value={filter_inst}
            onChange={(e) => set_filter_inst(e.target.value)}
          >
            <option value="">— {t('admin.stats_col_institution')} —</option>
            {institutions.map((inst) => (
              <option key={inst.id} value={inst.id}>{inst.name}</option>
            ))}
          </select>
        </div>
      )}

      {loading && <p className={styles.loading}>{t('admin.employees_loading')}</p>}
      {error && <p className={styles.error_msg} role="alert">{error}</p>}

      {!loading && !error && visible.length === 0 && (
        <Card>
          <p className={styles.empty_msg}>{t('admin.employees_empty')}</p>
        </Card>
      )}

      {!loading && !error && visible.length > 0 && (
        <div className={styles.groups}>
          {Object.entries(by_inst).map(([key, { label, rows }]) => (
            <div key={key} className={styles.group}>
              <h2 className={styles.group_heading}>{label}</h2>
              <div className={styles.table_wrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.th}>{t('admin.employees_col_email')}</th>
                      <th className={styles.th}>{t('admin.employees_col_since')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((emp) => (
                      <tr key={emp.id} className={styles.tr}>
                        <td className={styles.td}>{emp.email}</td>
                        <td className={styles.td_muted}>{fmt_date(emp.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && (
        <p className={styles.create_note}>{t('admin.employees_create_note')}</p>
      )}
    </div>
  );
}
