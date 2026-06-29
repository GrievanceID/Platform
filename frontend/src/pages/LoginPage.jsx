import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Input } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { api_request } from '../api/client';
import { ROLE_HOME } from '../layouts/ProtectedRoute';
import { toggle_lang } from '../i18n';
import styles from './LoginPage.module.css';

const ESIGNET_AUTHORIZE_URL = 'http://localhost:3000/authorize';
const ESIGNET_CLIENT_ID = 'tawthiqid-citizen';
const ESIGNET_REDIRECT_URI = 'http://localhost:5173/login';
const ESIGNET_STATE_KEY = 'esignet_state';

function random_string(length = 16) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

function start_esignet_login() {
  const nonce = random_string();
  const state = random_string();
  sessionStorage.setItem(ESIGNET_STATE_KEY, state);

  const params = new URLSearchParams({
    client_id: ESIGNET_CLIENT_ID,
    redirect_uri: ESIGNET_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid profile',
    acr_values: 'mosip:idp:acr:generated-code',
    claims_locales: 'en',
    nonce,
    state,
  });

  window.location.href = `${ESIGNET_AUTHORIZE_URL}?${params.toString()}`;
}

function BackArrow() {
  return (
    <svg
      className={styles.back_arrow}
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M9 2L4 7l5 5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const STAFF_ROLES = [
  { value: 'reviewer', key: 'tab_reviewer' },
  { value: 'employee', key: 'tab_employee' },
  { value: 'admin',    key: 'tab_admin' },
];

export function LoginPage() {
  const { commit_session, is_authenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  // tier: 'choice' | 'citizen' | 'staff'
  const [tier, set_tier] = useState('choice');
  const [selected_role, set_selected_role] = useState('reviewer');
  const [email, set_email] = useState('');
  const [password, set_password] = useState('');
  const [error, set_error] = useState('');
  const [loading, set_loading] = useState(false);

  const [esignet_status, set_esignet_status] = useState('idle'); // 'idle' | 'pending' | 'error'
  const [esignet_error, set_esignet_error] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    const state = params.get('state');

    if (!code || !state) return;

    const stored_state = sessionStorage.getItem(ESIGNET_STATE_KEY);

    async function complete_esignet_login() {
      set_tier('citizen');
      set_esignet_status('pending');
      set_esignet_error('');

      if (state !== stored_state) {
        sessionStorage.removeItem(ESIGNET_STATE_KEY);
        set_esignet_status('error');
        set_esignet_error(t('login.esignet_state_mismatch'));
        return;
      }

      try {
        const { data } = await api_request(
          `/auth/esignet/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`
        );
        sessionStorage.removeItem(ESIGNET_STATE_KEY);
        commit_session(data.token, data.user);
        navigate('/grievances/mine', { replace: true });
      } catch (err) {
        sessionStorage.removeItem(ESIGNET_STATE_KEY);
        set_esignet_status('error');
        if (err.status === 401) {
          set_esignet_error(t('login.esignet_error_unrecognized'));
        } else {
          set_esignet_error(t('login.esignet_error_generic'));
        }
      }
    }

    complete_esignet_login();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (is_authenticated && user) {
    navigate(ROLE_HOME[user.role] ?? '/', { replace: true });
    return null;
  }

  function go_to_citizen() {
    set_email('');
    set_password('');
    set_error('');
    set_tier('citizen');
  }

  function go_to_staff() {
    set_email('');
    set_password('');
    set_error('');
    set_tier('staff');
  }

  function go_back_to_choice() {
    set_email('');
    set_password('');
    set_error('');
    set_tier('choice');
  }

  // For the citizen path, the declared role is always 'citizen'.
  // For the staff path, it is the value of the role selector.
  const declared_role = tier === 'citizen' ? 'citizen' : selected_role;

  async function handle_submit(e) {
    e.preventDefault();
    set_error('');
    set_loading(true);

    try {
      const { data } = await api_request('/auth/login', {
        method: 'POST',
        body: { email: email.trim(), password },
      });

      const returned_user = data.user;

      // Role-gate: declared role (tab/selector) must match what the backend returns.
      if (returned_user.role !== declared_role) {
        const actual_label = t(`login.tab_${returned_user.role}`, { defaultValue: returned_user.role });
        const selected_label = t(`login.tab_${declared_role}`, { defaultValue: declared_role });
        set_error(t('login.error_mismatch', { actual: actual_label, selected: selected_label }));
        return;
      }

      commit_session(data.token, returned_user);
      const from = location.state?.from?.pathname;
      navigate(from ?? ROLE_HOME[returned_user.role] ?? '/', { replace: true });
    } catch (err) {
      set_error(err.message ?? t('login.error_generic'));
    } finally {
      set_loading(false);
    }
  }

  return (
    <div className={styles.page}>
      <Link to="/" className={styles.back_home}>
        <BackArrow />
        {t('login.back_home')}
      </Link>

      <div className={styles.container}>
        <div className={styles.heading_block}>
          <Link to="/" className={styles.logo_link}>
            <img
              src="/src/assets/branding/tawthiqid-logo-transparent.png"
              alt="TawthiqID"
              className={styles.brand_logo}
              height={36}
            />
          </Link>
          <p className={styles.app_subtitle}>{t('login.subtitle')}</p>
        </div>

        <div className={styles.card}>
          {/* ── Tier 1: Entry choice ── */}
          {tier === 'choice' && (
            <>
              <div className={styles.choice_grid}>
                <button
                  type="button"
                  className={styles.choice_card}
                  onClick={go_to_citizen}
                >
                  <span className={styles.choice_label}>{t('login.choice_citizen_label')}</span>
                  <span className={styles.choice_sub}>{t('login.choice_citizen_sub')}</span>
                </button>
                <button
                  type="button"
                  className={styles.choice_card}
                  onClick={go_to_staff}
                >
                  <span className={styles.choice_label}>{t('login.choice_staff_label')}</span>
                  <span className={styles.choice_sub}>{t('login.choice_staff_sub')}</span>
                </button>
              </div>
              <div className={styles.choice_footer}>
                <button type="button" className={styles.lang_toggle} onClick={toggle_lang}>
                  {t('lang_toggle.label')}
                </button>
              </div>
            </>
          )}

          {/* ── Tier 2a: Citizen path ── */}
          {tier === 'citizen' && (
            <>
              <div className={styles.tier_header}>
                <button
                  type="button"
                  className={styles.back_to_choice}
                  onClick={go_back_to_choice}
                  disabled={loading}
                >
                  <BackArrow />
                  {t('login.back_to_choice')}
                </button>
              </div>
              <div className={styles.form_body}>
                <h2 className={styles.form_title}>
                  {t('login.title', { role: t('login.tab_citizen') })}
                </h2>

                {esignet_status === 'error' && (
                  <div className={styles.error_banner} role="alert">{esignet_error}</div>
                )}

                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  disabled={esignet_status === 'pending'}
                  onClick={start_esignet_login}
                >
                  {esignet_status === 'pending' ? t('login.esignet_redirecting') : t('login.esignet_submit')}
                </Button>

                <p className={styles.app_subtitle}>{t('login.esignet_sub')}</p>

                {esignet_status === 'error' && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    onClick={start_esignet_login}
                  >
                    {t('login.esignet_retry')}
                  </Button>
                )}

                <button type="button" className={styles.lang_toggle} onClick={toggle_lang}>
                  {t('lang_toggle.label')}
                </button>
              </div>
            </>
          )}

          {/* ── Tier 2b: Staff path ── */}
          {tier === 'staff' && (
            <>
              <div className={styles.tier_header}>
                <button
                  type="button"
                  className={styles.back_to_choice}
                  onClick={go_back_to_choice}
                  disabled={loading}
                >
                  <BackArrow />
                  {t('login.back_to_choice')}
                </button>
              </div>
              <form onSubmit={handle_submit} noValidate>
                <div className={styles.form_body}>
                  <h2 className={styles.form_title}>
                    {t('login.title', { role: t(`login.tab_${selected_role}`) })}
                  </h2>

                  {error && (
                    <div className={styles.error_banner} role="alert">{error}</div>
                  )}

                  <div className={styles.role_select_group}>
                    <label className={styles.role_select_label} htmlFor="staff_role">
                      {t('login.staff_role_label')}
                    </label>
                    <select
                      id="staff_role"
                      className={styles.role_select}
                      value={selected_role}
                      onChange={(e) => { set_selected_role(e.target.value); set_error(''); }}
                      disabled={loading}
                    >
                      {STAFF_ROLES.map((r) => (
                        <option key={r.value} value={r.value}>
                          {t(`login.${r.key}`)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Input
                    id="email"
                    type="email"
                    label={t('login.email_label')}
                    autoComplete="email"
                    value={email}
                    onChange={(e) => set_email(e.target.value)}
                    required
                    disabled={loading}
                  />

                  <Input
                    id="password"
                    type="password"
                    label={t('login.password_label')}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => set_password(e.target.value)}
                    required
                    disabled={loading}
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={loading || !email || !password}
                  >
                    {loading ? t('login.submitting') : t('login.submit')}
                  </Button>

                  <button type="button" className={styles.lang_toggle} onClick={toggle_lang}>
                    {t('lang_toggle.label')}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
