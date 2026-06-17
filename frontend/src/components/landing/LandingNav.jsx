import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from '../ui';
import styles from './LandingNav.module.css';

const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Documentation', href: '#documentation' },
  { label: 'Contact', href: '#contact' },
];

export function LandingNav() {
  const [scrolled, set_scrolled] = useState(false);
  const [mobile_open, set_mobile_open] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    function on_scroll() {
      set_scrolled(window.scrollY > 12);
    }
    window.addEventListener('scroll', on_scroll, { passive: true });
    return () => window.removeEventListener('scroll', on_scroll);
  }, []);

  function handle_anchor(e, href) {
    e.preventDefault();
    set_mobile_open(false);
    if (href === '#home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <header className={`${styles.nav} ${scrolled ? styles.nav_scrolled : ''}`}>
      <div className={styles.inner}>
        {/* Logo + wordmark */}
        <a href="#home" className={styles.brand} onClick={(e) => handle_anchor(e, '#home')}>
          <span className={styles.brand_mark}>GID</span>
          <span className={styles.brand_name}>GrievanceID</span>
        </a>

        {/* Desktop nav links */}
        <nav className={styles.links} aria-label="Site navigation">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={styles.link}
              onClick={(e) => handle_anchor(e, link.href)}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className={styles.ctas}>
          <Button variant="secondary" size="sm" onClick={() => navigate('/login')}>
            Sign in
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/grievances/new')}>
            Submit a grievance
          </Button>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className={styles.hamburger}
          aria-label={mobile_open ? 'Close menu' : 'Open menu'}
          aria-expanded={mobile_open}
          onClick={() => set_mobile_open((v) => !v)}
        >
          {mobile_open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobile_open && (
        <div className={styles.mobile_drawer}>
          <nav>
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={styles.mobile_link}
                onClick={(e) => handle_anchor(e, link.href)}
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className={styles.mobile_ctas}>
            <Button variant="secondary" size="sm" onClick={() => { set_mobile_open(false); navigate('/login'); }}>
              Sign in
            </Button>
            <Button variant="primary" size="sm" onClick={() => { set_mobile_open(false); navigate('/grievances/new'); }}>
              Submit a grievance
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
