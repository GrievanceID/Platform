import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Button, Input } from '../../components/ui';
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

// ── Editable contact-info card ────────────────────────────────────────────────
// Separate component so state resets cleanly when editing is cancelled.
function ContactInfoCard({ profile, token, on_save, t }) {
  const [editing, set_editing] = useState(false);
  const [saving, set_saving] = useState(false);
  const [save_msg, set_save_msg] = useState('');
  const [save_err, set_save_err] = useState('');

  const [first_name, set_first_name] = useState(profile?.first_name ?? '');
  const [last_name, set_last_name] = useState(profile?.last_name ?? '');
  const [phone_number, set_phone_number] = useState(profile?.phone_number ?? '');

  // Sync local state when profile changes from outside (e.g. fresh fetch).
  useEffect(() => {
    set_first_name(profile?.first_name ?? '');
    set_last_name(profile?.last_name ?? '');
    set_phone_number(profile?.phone_number ?? '');
  }, [profile?.first_name, profile?.last_name, profile?.phone_number]);

  function handle_cancel() {
    set_first_name(profile?.first_name ?? '');
    set_last_name(profile?.last_name ?? '');
    set_phone_number(profile?.phone_number ?? '');
    set_save_msg('');
    set_save_err('');
    set_editing(false);
  }

  async function handle_save(e) {
    e.preventDefault();
    set_save_msg('');
    set_save_err('');
    set_saving(true);
    try {
      const { data } = await api_request('/users/me', {
        method: 'PATCH',
        token,
        body: {
          first_name: first_name.trim() || null,
          last_name: last_name.trim() || null,
          phone_number: phone_number.trim() || null,
        },
      });
      on_save(data.user);
      set_save_msg(t('citizen.profile_save_contact_ok'));
      set_editing(false);
    } catch (err) {
      set_save_err(err.message || t('citizen.profile_save_contact_err'));
    } finally {
      set_saving(false);
    }
  }

  const actions_slot = !editing && (
    <button
      type="button"
      className={styles.edit_btn}
      onClick={() => set_editing(true)}
    >
      {t('citizen.profile_edit_btn')}
    </button>
  );

  return (
    <Card title={t('citizen.profile_section_contact_info')} actions={actions_slot}>
      <p className={styles.self_reported_note}>
        {t('citizen.profile_contact_info_note')}
      </p>

      {!editing ? (
        // ── Read view ────────────────────────────────────────────────────────
        <dl className={styles.fields}>
          <div className={styles.field}>
            <dt>{t('citizen.profile_first_name_label')}</dt>
            <dd className={!profile?.first_name ? styles.field_empty : undefined}>
              {profile?.first_name || t('citizen.profile_not_set')}
            </dd>
          </div>
          <div className={styles.field}>
            <dt>{t('citizen.profile_last_name_label')}</dt>
            <dd className={!profile?.last_name ? styles.field_empty : undefined}>
              {profile?.last_name || t('citizen.profile_not_set')}
            </dd>
          </div>
          <div className={styles.field}>
            <dt>{t('citizen.profile_phone_label')}</dt>
            <dd className={!profile?.phone_number ? styles.field_empty : undefined}>
              {profile?.phone_number || t('citizen.profile_not_set')}
            </dd>
          </div>
        </dl>
      ) : (
        // ── Edit view ────────────────────────────────────────────────────────
        <form onSubmit={handle_save} noValidate>
          <div className={styles.edit_fields}>
            <Input
              id="first_name"
              label={t('citizen.profile_first_name_label')}
              value={first_name}
              onChange={(e) => set_first_name(e.target.value)}
              placeholder={t('citizen.profile_placeholder_first_name')}
              disabled={saving}
              autoComplete="given-name"
            />
            <Input
              id="last_name"
              label={t('citizen.profile_last_name_label')}
              value={last_name}
              onChange={(e) => set_last_name(e.target.value)}
              placeholder={t('citizen.profile_placeholder_last_name')}
              disabled={saving}
              autoComplete="family-name"
            />
            <Input
              id="phone_number"
              label={t('citizen.profile_phone_label')}
              value={phone_number}
              onChange={(e) => set_phone_number(e.target.value)}
              placeholder={t('citizen.profile_placeholder_phone')}
              disabled={saving}
              autoComplete="tel"
              type="tel"
            />
          </div>

          {save_err && (
            <p className={styles.save_err} role="alert">{save_err}</p>
          )}

          <div className={styles.edit_actions}>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={saving}
            >
              {saving ? t('citizen.profile_saving_contact') : t('citizen.profile_save_contact_btn')}
            </Button>
            <button
              type="button"
              className={styles.cancel_btn}
              onClick={handle_cancel}
              disabled={saving}
            >
              {t('citizen.profile_cancel_btn')}
            </button>
          </div>
        </form>
      )}

      {save_msg && !editing && (
        <p className={styles.save_ok}>{save_msg}</p>
      )}
    </Card>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function ProfilePage() {
  const { user: auth_user, token } = useAuth();
  const { t, i18n } = useTranslation();

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

          {/* ── Profile hero — avatar + email + role ── */}
          <div className={styles.profile_hero}>
            <Avatar email={display?.email} />
            <div className={styles.hero_text}>
              <p className={styles.hero_email}>{display?.email ?? '—'}</p>
              <span className={styles.role_pill}>{display?.role ?? '—'}</span>
            </div>
          </div>

          {/* ── Immutable identity fields — NO edit affordance ── */}
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

          {/* ── Self-reported contact info — EDITABLE ── */}
          <ContactInfoCard
            profile={profile}
            token={token}
            on_save={(updated_user) => set_profile(updated_user)}
            t={t}
          />

          {/* ── Request changes to immutable fields ── */}
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
