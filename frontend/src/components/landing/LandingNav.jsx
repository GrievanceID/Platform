import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toggle_lang } from '../../i18n';
import { Button } from '../ui';
import styles from './LandingNav.module.css';

export function LandingNav() {
  const { t, i18n } = useTranslation();
  const [scrolled, set_scrolled] = useState(false);
  const [mobile_open, set_mobile_open] = useState(false);
  const navigate = useNavigate();

  const NAV_LINKS = [
    { label: t('nav.home'),          href: '#home' },
    { label: t('nav.features'),      href: '#features' },
    { label: t('nav.how_it_works'),  href: '#how-it-works' },
    { label: t('nav.documentation'), href: '#documentation' },
    { label: t('nav.contact'),       href: '#contact' },
  ];

  useEffect(() => {
    function on_scroll() { set_scrolled(window.scrollY > 12); }
    window.addEventListener('scroll', on_scroll, { passive: true });
    return () => window.removeEventListener('scroll', on_scroll);
  }, []);

  function handle_anchor(e, href) {
    e.preventDefault();
    set_mobile_open(false);
    if (href === '#home') { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <header className={`${styles.nav} ${scrolled ? styles.nav_scrolled : ''}`}>
      <div className={styles.inner}>
        <a href="#home" className={styles.brand} onClick={(e) => handle_anchor(e, '#home')}>
          <span className={styles.brand_mark}>GID</span>
          <span className={styles.brand_name}>GrievanceID</span>
        </a>

        <nav className={styles.links} aria-label={t('nav.home')}>
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className={styles.link}
               onClick={(e) => handle_anchor(e, link.href)}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className={styles.ctas}>
          <button
            type="button"
            className={styles.lang_btn}
            onClick={toggle_lang}
            aria-label={t('lang_toggle.aria')}
          >
            {t('lang_toggle.label')}
          </button>
          <Button variant="secondary" size="sm" onClick={() => navigate('/login')}>
            {t('nav.sign_in')}
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/grievances/new')}>
            {t('nav.submit_grievance')}
          </Button>
        </div>

        <button type="button" className={styles.hamburger}
          aria-label={mobile_open ? t('nav.close_menu') : t('nav.open_menu')}
          aria-expanded={mobile_open}
          onClick={() => set_mobile_open((v) => !v)}>
          {mobile_open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobile_open && (
        <div className={styles.mobile_drawer}>
          <nav>
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className={styles.mobile_link}
                 onClick={(e) => handle_anchor(e, link.href)}>
                {link.label}
              </a>
            ))}
          </nav>
          <div className={styles.mobile_ctas}>
            <button type="button" className={styles.lang_btn} onClick={() => { set_mobile_open(false); toggle_lang(); }}>
              {t('lang_toggle.label')}
            </button>
            <Button variant="secondary" size="sm" onClick={() => { set_mobile_open(false); navigate('/login'); }}>
              {t('nav.sign_in')}
            </Button>
            <Button variant="primary" size="sm" onClick={() => { set_mobile_open(false); navigate('/grievances/new'); }}>
              {t('nav.submit_grievance')}
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
