import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { api_request } from '../../api/client';
import styles from './ProfilePage.module.css';

function Avatar({ email }) {
  const initial = email ? email[0].toUpperCase() : '?';
  return (
    <div className={styles.avatar} aria-hidden="true">
      {initial}
    </div>
  );
}

export function ProfilePage() {
  const { user: auth_user, token } = useAuth();
  const { t, i18n } = useTranslation();

  // Fetch fresh user record — login SELECT omits created_at; GET /users/me fixes this.
  const [profile, set_profile] = useState(null);
  const [loading, set_loading] = useState(true);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    api_request('/users/me', { token })
      .then(({ data }) => {
        if (!cancelled) { set_profile(data.user); set_loading(false); }
      })
      .catch(() => {
        if (!cancelled) { set_profile(auth_user ?? null); set_loading(false); }
      });
    return () => { cancelled = true; };
  }, [token]);

  const display = profile ?? auth_user;

  function format_date(iso) {
    if (!iso) return '—';
    const locale = i18n.language === 'ar' ? 'ar-MA' : 'fr-FR';
    return new Date(iso).toLocaleDateString(locale, {
      day: '2-digit', month: 'long', year: 'numeric',
    });
  }

  return (
    <div className={styles.page}>
      <div className={styles.page_header}>
        <h1 className={styles.page_title}>{t('citizen.profile_title')}</h1>
      </div>

      {loading && <p className={styles.loading}>…</p>}

      {!loading && (
        <div className={styles.sections}>

          {/* ── Profile header — avatar + identity summary ── */}
          <div className={styles.profile_hero}>
            <Avatar email={display?.email} />
            <div className={styles.hero_text}>
              <p className={styles.hero_email}>{display?.email ?? '—'}</p>
              <span className={styles.role_pill}>{display?.role ?? '—'}</span>
            </div>
          </div>

          {/* ── Account identity — single-column read-only fields ── */}
          <Card title={t('citizen.profile_section_identity')}>
            <dl className={styles.fields}>
              <div className={styles.field}>
                <dt>{t('citizen.profile_email_label')}</dt>
                <dd>{display?.email ?? '—'}</dd>
              </div>
              <div className={styles.field}>
                <dt>{t('citizen.profile_role_label')}</dt>
                <dd>
                  <span className={styles.role_pill_sm}>{display?.role ?? '—'}</span>
                </dd>
              </div>
              <div className={styles.field}>
                <dt>{t('citizen.profile_since_label')}</dt>
                <dd>{format_date(display?.created_at)}</dd>
              </div>
              <div className={styles.field}>
                <dt>{t('citizen.profile_account_id_label')}</dt>
                <dd>
                  <span className={styles.account_id}>
                    {display?.id ? display.id.slice(0, 8).toUpperCase() : '—'}
                  </span>
                </dd>
              </div>
            </dl>
            <p className={styles.readonly_note}>{t('citizen.profile_note_readonly')}</p>
          </Card>

          {/* ── Request changes ── */}
          <Card title={t('citizen.profile_section_contact')}>
            <p className={styles.contact_body}>{t('citizen.profile_contact_body')}</p>
            <div className={styles.contact_row}>
              <span className={styles.contact_label}>{t('citizen.profile_contact_email_label')}</span>
              <a
                href={`mailto:${t('citizen.profile_contact_email')}`}
                className={styles.contact_link}
              >
                {t('citizen.profile_contact_email')}
              </a>
            </div>
          </Card>

        </div>
      )}
    </div>
  );
}
