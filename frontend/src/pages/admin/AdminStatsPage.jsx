import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { api_request } from '../../api/client';
import styles from './AdminStatsPage.module.css';

// Confidence bucket thresholds (same boundary used in Reviewer queue)
const LOW = 0.65;
const HIGH = 0.85;

function BarRow({ label, value, max, color_class }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className={styles.bar_row}>
      <span className={styles.bar_label}>{label}</span>
      <div className={styles.bar_track}>
        <div
          className={`${styles.bar_fill} ${color_class ?? ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={styles.bar_count}>{value}</span>
    </div>
  );
}

export function AdminStatsPage() {
  const { t, i18n } = useTranslation();
  const { token } = useAuth();

  const [stats, set_stats] = useState(null);
  const [loading, set_loading] = useState(true);
  const [error, set_error] = useState('');

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    api_request('/grievances/stats', { token })
      .then(({ data }) => {
        if (!cancelled) { set_stats(data); set_loading(false); }
      })
      .catch(() => {
        if (!cancelled) { set_error(t('admin.stats_error')); set_loading(false); }
      });
    return () => { cancelled = true; };
  }, [token]);

  const locale = i18n.language === 'ar' ? 'ar-MA' : 'fr-FR';
  function pct(n) { return n != null ? `${Math.round(n * 100)} %` : '—'; }
  function num(n) { return n != null ? Number(n).toLocaleString(locale) : '—'; }

  if (loading) return (
    <div className={styles.page}>
      <p className={styles.loading}>{t('admin.stats_loading')}</p>
    </div>
  );

  if (error) return (
    <div className={styles.page}>
      <p className={styles.error_msg} role="alert">{error}</p>
    </div>
  );

  const by_status = stats?.by_status ?? [];
  const by_category = stats?.by_category ?? [];
  const by_institution = stats?.by_institution ?? [];
  const conf = stats?.confidence ?? {};

  const max_status = Math.max(...by_status.map((r) => r.count), 1);
  const max_category = Math.max(...by_category.map((r) => r.count), 1);
  const max_inst = Math.max(...by_institution.map((r) => r.total), 1);

  return (
    <div className={styles.page}>
      <div className={styles.page_header}>
        <h1 className={styles.page_title}>{t('admin.stats_title')}</h1>
        <p className={styles.page_sub}>{t('admin.stats_sub')}</p>
      </div>

      <div className={styles.grid}>

        {/* ── Status breakdown ── */}
        <Card title={t('admin.stats_section_status')}>
          {by_status.length === 0
            ? <p className={styles.no_data}>{t('admin.stats_no_data')}</p>
            : by_status.map((row) => (
              <BarRow
                key={row.status}
                label={t(`status.${row.status}`, row.status)}
                value={row.count}
                max={max_status}
              />
            ))
          }
        </Card>

        {/* ── Category breakdown ── */}
        <Card title={t('admin.stats_section_category')}>
          {by_category.length === 0
            ? <p className={styles.no_data}>{t('admin.stats_no_data')}</p>
            : by_category.map((row) => (
              <BarRow
                key={row.category ?? 'unknown'}
                label={row.category ?? '—'}
                value={row.count}
                max={max_category}
                color_class={styles.bar_accent}
              />
            ))
          }
        </Card>

        {/* ── AI confidence distribution ── */}
        <Card title={t('admin.stats_section_confidence')}>
          {!conf.avg_confidence ? (
            <p className={styles.no_data}>{t('admin.stats_no_data')}</p>
          ) : (
            <dl className={styles.conf_fields}>
              <div className={styles.conf_field}>
                <dt>{t('admin.stats_confidence_avg')}</dt>
                <dd className={styles.conf_value}>{pct(conf.avg_confidence)}</dd>
              </div>
              <div className={styles.conf_field}>
                <dt>{t('admin.stats_confidence_min')}</dt>
                <dd>{pct(conf.min_confidence)}</dd>
              </div>
              <div className={styles.conf_field}>
                <dt>{t('admin.stats_confidence_max')}</dt>
                <dd>{pct(conf.max_confidence)}</dd>
              </div>
              <div className={styles.conf_field}>
                <dt>{t('admin.stats_confidence_flagged')}</dt>
                <dd>{num(conf.human_flagged)}</dd>
              </div>
            </dl>
          )}
        </Card>

        {/* ── Institution breakdown — full width ── */}
        <Card title={t('admin.stats_section_institution')} className={styles.full_width}>
          {by_institution.length === 0
            ? <p className={styles.no_data}>{t('admin.stats_no_data')}</p>
            : (
              <div className={styles.inst_table_wrap}>
                <table className={styles.inst_table}>
                  <thead>
                    <tr>
                      <th className={styles.th}>{t('admin.stats_col_institution')}</th>
                      <th className={styles.th}>{t('admin.stats_col_inst_category')}</th>
                      <th className={`${styles.th} ${styles.th_num}`}>{t('admin.stats_col_total')}</th>
                      <th className={`${styles.th} ${styles.th_num}`}>{t('admin.stats_col_resolved')}</th>
                      <th className={styles.th}>{t('admin.stats_col_total')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {by_institution.map((row) => (
                      <tr key={row.institution} className={styles.tr}>
                        <td className={styles.td}>{row.institution}</td>
                        <td className={styles.td_muted}>{row.institution_category ?? '—'}</td>
                        <td className={`${styles.td} ${styles.td_num}`}>{row.total}</td>
                        <td className={`${styles.td} ${styles.td_num}`}>{row.resolved}</td>
                        <td className={styles.td}>
                          <BarRow
                            label=""
                            value={row.total}
                            max={max_inst}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </Card>

      </div>
    </div>
  );
}
