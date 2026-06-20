import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, StatusBadge, Button, StatusTimeline } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { api_request } from '../../api/client';
import styles from './GrievanceDetailPage.module.css';

export function GrievanceDetailPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [grievance, set_grievance] = useState(null);
  const [institution, set_institution] = useState(null);
  const [loading, set_loading] = useState(true);
  const [error, set_error] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function fetch_all() {
      set_loading(true);
      set_error('');
      try {
        const { data } = await api_request(`/grievances/${id}`, { token });
        if (cancelled) return;
        set_grievance(data.grievance);

        if (data.grievance?.institution_id) {
          try {
            const { data: inst_data } = await api_request('/institutions', { token });
            const match = (inst_data.institutions ?? []).find(
              (inst) => inst.id === data.grievance.institution_id
            );
            if (!cancelled) set_institution(match ?? null);
          } catch {
            // institution name lookup is best-effort
          }
        }
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
    fetch_all();
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
              {t('citizen.detail_title')}
              <span className={styles.ref}>{grievance.id.slice(0, 8).toUpperCase()}</span>
            </h1>
            <StatusBadge status={grievance.status} />
          </div>

          {/* ── Info ── */}
          <Card title={t('citizen.detail_section_info')}>
            <dl className={styles.fields}>
              <div className={styles.field}>
                <dt>{t('citizen.detail_ref')}</dt>
                <dd><span className={styles.mono}>{grievance.id.slice(0, 8).toUpperCase()}</span></dd>
              </div>
              <div className={styles.field}>
                <dt>{t('citizen.detail_submitted')}</dt>
                <dd>{format_date(grievance.created_at, i18n.language)}</dd>
              </div>
              <div className={styles.field}>
                <dt>{t('citizen.detail_category')}</dt>
                <dd>{grievance.category ?? <span className={styles.muted}>—</span>}</dd>
              </div>
              {grievance.urgency && (
                <div className={styles.field}>
                  <dt>{t('citizen.detail_urgency')}</dt>
                  <dd>{grievance.urgency}</dd>
                </div>
              )}
            </dl>

            {grievance.summary && (
              <div className={styles.summary_block}>
                <p className={styles.summary_label}>{t('citizen.detail_summary_label')}</p>
                <p className={styles.summary_text}>{grievance.summary}</p>
              </div>
            )}

            {grievance.related_grievance_id && (
              <div className={styles.related_block}>
                <button
                  type="button"
                  className={styles.link_btn}
                  onClick={() => navigate(`/grievances/${grievance.related_grievance_id}`)}
                >
                  → {grievance.related_grievance_id.slice(0, 8).toUpperCase()}
                </button>
              </div>
            )}
          </Card>

          {/* ── Timeline ── */}
          <Card title={t('citizen.detail_section_timeline')}>
            <StatusTimeline currentStatus={grievance.status} t={t} />
          </Card>

          {/* ── Routing ── */}
          <Card title={t('citizen.detail_section_routing')}>
            {grievance.institution_id ? (
              <p className={styles.institution_name}>
                {institution?.name ?? grievance.institution_id}
              </p>
            ) : (
              <p className={styles.muted_italic}>{t('citizen.detail_institution_pending')}</p>
            )}
          </Card>

          {/* ── Transcript ── */}
          <Card title={t('citizen.detail_section_transcript')}>
            {grievance.raw_transcript ? (
              <div className={styles.transcript_block}>
                <p className={styles.transcript_section_label}>
                  {t('citizen.detail_transcript_raw_label')}
                </p>
                <p className={styles.transcript_text} dir="auto">
                  {grievance.raw_transcript}
                </p>
                {grievance.diarized_transcript && (
                  <>
                    <p className={`${styles.transcript_section_label} ${styles.mt}`}>
                      {t('citizen.detail_transcript_diarized_label')}
                    </p>
                    <p className={styles.transcript_text} dir="auto">
                      {grievance.diarized_transcript}
                    </p>
                  </>
                )}
              </div>
            ) : (
              <p className={styles.transcript_placeholder}>
                {t('citizen.detail_transcript_pending')}
              </p>
            )}
          </Card>

          {/* ── Follow-up CTA (only for resolved) ── */}
          {grievance.status === 'resolved' && (
            <div className={styles.followup_row}>
              <p className={styles.followup_hint}>{t('citizen.detail_followup_hint')}</p>
              <Button variant="secondary" size="sm" onClick={() => navigate('/grievances/new')}>
                {t('citizen.detail_followup_btn')}
              </Button>
            </div>
          )}
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
