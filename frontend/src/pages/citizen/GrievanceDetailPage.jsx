import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, StatusBadge, Button } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { api_request } from '../../api/client';
import styles from './GrievanceDetailPage.module.css';

export function GrievanceDetailPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [grievance, set_grievance] = useState(null);
  const [loading, set_loading] = useState(true);
  const [error, set_error] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function fetch_grievance() {
      set_loading(true);
      set_error('');
      try {
        const { data } = await api_request(`/grievances/${id}`, { token });
        if (!cancelled) set_grievance(data.grievance);
      } catch (err) {
        if (!cancelled) {
          set_error(
            err.status === 404
              ? t('citizen.detail_not_found')
              : (err.message ?? t('citizen.detail_error'))
          );
        }
      } finally {
        if (!cancelled) set_loading(false);
      }
    }
    fetch_grievance();
    return () => { cancelled = true; };
  }, [id, token]);

  return (
    <div className={styles.page}>
      <div className={styles.back_row}>
        <button type="button" className={styles.back_btn}
          onClick={() => navigate('/grievances/mine')}>
          ← {t('citizen.detail_back')}
        </button>
      </div>

      {loading && <p className={styles.loading} aria-live="polite">…</p>}
      {error && <div className={styles.error_banner} role="alert">{error}</div>}

      {!loading && !error && grievance && (
        <div className={styles.sections}>
          <div className={styles.title_row}>
            <h1 className={styles.page_title}>
              {t('citizen.detail_title')} <span className={styles.ref}>{grievance.id.slice(0, 8).toUpperCase()}</span>
            </h1>
            <StatusBadge status={grievance.status} />
          </div>

          <Card title={t('citizen.detail_status')}>
            <dl className={styles.fields}>
              <div className={styles.field}>
                <dt>{t('citizen.detail_submitted')}</dt>
                <dd>{format_date(grievance.submitted_at, i18n.language)}</dd>
              </div>
              <div className={styles.field}>
                <dt>{t('citizen.detail_category')}</dt>
                <dd>{grievance.category ?? '—'}</dd>
              </div>
              {grievance.related_grievance_id && (
                <div className={styles.field}>
                  <dt>Follow-up of</dt>
                  <dd>
                    <button type="button" className={styles.link_btn}
                      onClick={() => navigate(`/grievances/${grievance.related_grievance_id}`)}>
                      {grievance.related_grievance_id.slice(0, 8).toUpperCase()}
                    </button>
                  </dd>
                </div>
              )}
            </dl>
          </Card>

          <Card title={t('citizen.detail_transcript')}>
            <p className={styles.transcript_placeholder}>
              {t('citizen.detail_transcript_pending')}
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}

function format_date(iso, lang) {
  if (!iso) return '—';
  const locale = lang === 'ar' ? 'ar-MA' : 'fr-FR';
  return new Date(iso).toLocaleDateString(locale, {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}
