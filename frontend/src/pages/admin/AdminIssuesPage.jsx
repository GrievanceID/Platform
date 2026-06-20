import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Button } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { api_request } from '../../api/client';
import styles from './AdminIssuesPage.module.css';

const CATEGORY_KEY = {
  ai_error: 'admin.issues_cat_ai_error',
  bug:      'admin.issues_cat_bug',
  other:    'admin.issues_cat_other',
};

export function AdminIssuesPage() {
  const { t, i18n } = useTranslation();
  const { token } = useAuth();

  const [reports, set_reports] = useState([]);
  const [loading, set_loading] = useState(true);
  const [error, set_error] = useState('');
  const [filter, set_filter] = useState('open');
  const [resolving_id, set_resolving_id] = useState(null);
  const [resolve_err, set_resolve_err] = useState('');

  function fetch_reports(status_filter) {
    if (!token) return;
    set_loading(true);
    set_error('');
    const qs = status_filter && status_filter !== 'all' ? `?status=${status_filter}` : '';
    api_request(`/issue-reports${qs}`, { token })
      .then(({ data }) => {
        set_reports(data.reports ?? []);
        set_loading(false);
      })
      .catch(() => {
        set_error(t('admin.issues_error'));
        set_loading(false);
      });
  }

  useEffect(() => { fetch_reports(filter); }, [filter, token]);

  const locale = i18n.language === 'ar' ? 'ar-MA' : 'fr-FR';
  function fmt_date(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString(locale, {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  async function handle_resolve(report_id) {
    set_resolve_err('');
    set_resolving_id(report_id);
    try {
      await api_request(`/issue-reports/${report_id}/resolve`, { method: 'PATCH', token });
      // Update in-place so the list reflects the change without a full refetch
      set_reports((prev) =>
        prev.map((r) => r.id === report_id ? { ...r, status: 'resolved' } : r)
      );
    } catch {
      set_resolve_err(t('admin.issues_resolve_err'));
    } finally {
      set_resolving_id(null);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.page_header}>
        <h1 className={styles.page_title}>{t('admin.issues_title')}</h1>
        <p className={styles.page_sub}>{t('admin.issues_sub')}</p>
      </div>

      {/* ── Filter strip ── */}
      <div className={styles.filter_strip} role="group">
        {['open', 'resolved', 'all'].map((f) => (
          <button
            key={f}
            type="button"
            className={`${styles.filter_btn} ${filter === f ? styles.filter_active : ''}`}
            onClick={() => set_filter(f)}
          >
            {t(`admin.issues_filter_${f}`)}
          </button>
        ))}
      </div>

      {loading && <p className={styles.loading}>{t('admin.issues_loading')}</p>}
      {error && <p className={styles.error_msg} role="alert">{error}</p>}
      {resolve_err && <p className={styles.error_msg} role="alert">{resolve_err}</p>}

      {!loading && !error && reports.length === 0 && (
        <Card>
          <p className={styles.empty_msg}>{t('admin.issues_empty')}</p>
        </Card>
      )}

      {!loading && !error && reports.length > 0 && (
        <div className={styles.report_list}>
          {reports.map((report) => (
            <div key={report.id} className={`${styles.report_card} ${report.status === 'resolved' ? styles.report_resolved : ''}`}>
              <div className={styles.report_top}>
                <div className={styles.report_badges}>
                  <span className={`${styles.cat_badge} ${styles[`cat_${report.category}`]}`}>
                    {t(CATEGORY_KEY[report.category] ?? 'admin.issues_cat_other')}
                  </span>
                  <span className={`${styles.status_badge} ${report.status === 'open' ? styles.status_open : styles.status_resolved_badge}`}>
                    {report.status === 'open'
                      ? t('admin.issues_status_open')
                      : t('admin.issues_status_resolved')}
                  </span>
                  <span className={styles.role_badge}>{report.reporter_role}</span>
                </div>
                <span className={styles.report_date}>{fmt_date(report.created_at)}</span>
              </div>

              <p className={styles.report_description}>{report.description}</p>

              <div className={styles.report_meta}>
                <span className={styles.meta_item}>
                  <span className={styles.meta_label}>{t('admin.issues_col_grievance')}</span>
                  {report.grievance_id
                    ? <span className={styles.ref_chip}>{report.grievance_id.slice(0, 8).toUpperCase()}</span>
                    : <span className={styles.meta_muted}>{t('admin.issues_none_linked')}</span>
                  }
                </span>
              </div>

              {report.status === 'open' && (
                <div className={styles.report_actions}>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={resolving_id === report.id}
                    onClick={() => handle_resolve(report.id)}
                  >
                    {resolving_id === report.id
                      ? t('admin.issues_resolving')
                      : t('admin.issues_resolve_btn')}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
