import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Mic, Upload, ShieldCheck, MapPin, BarChart3, Globe,
  Check, ArrowRight, Fingerprint, FileCheck, Clock, CheckCircle2,
  Building2, Lock, Languages, Zap, ListTodo,
} from 'lucide-react';
import { Button, InView } from '../../components/ui';
import { LandingNav } from '../../components/landing/LandingNav';
import { FeatureSection } from '../../components/landing/FeatureSection';
import styles from './LandingPage.module.css';

export function LandingPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className={styles.page}>
      <LandingNav />

      <main>
        {/* Hero */}
        <section id="home" className={styles.hero}>
          <div className={styles.container}>
            <div className={styles.hero_inner}>
              <div className={styles.hero_text}>
                <InView direction="up">
                  <div className={styles.hero_eyebrow}>
                    <span className={styles.eyebrow_badge}>{t('landing.eyebrow')}</span>
                  </div>
                </InView>
                <InView direction="up" delay="60ms">
                  <h1 className={styles.hero_heading}>
                    {t('landing.hero_heading_1')}<br />
                    {t('landing.hero_heading_2')}
                  </h1>
                </InView>
                <InView direction="up" delay="120ms">
                  <p className={styles.hero_sub}>{t('landing.hero_sub')}</p>
                </InView>
                <InView direction="up" delay="180ms">
                  <div className={styles.hero_actions}>
                    <Button variant="primary" size="lg" onClick={() => navigate('/grievances/new')}>
                      {t('landing.cta_submit')}
                    </Button>
                    <a href="#how-it-works" className={styles.hero_link} onClick={(e) => {
                      e.preventDefault();
                      document.querySelector('#how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                    }}>
                      {t('landing.cta_how')} <ArrowRight size={14} className="rtl_flip" />
                    </a>
                  </div>
                </InView>
              </div>

              <InView direction="up" delay="100ms">
                <div className={styles.hero_panel}>
                  <div className={styles.panel_chrome}>
                    <div className={styles.panel_traffic}>
                      <span className={styles.panel_dot_red} />
                      <span className={styles.panel_dot_yellow} />
                      <span className={styles.panel_dot_green} />
                    </div>
                    <div className={styles.panel_tab}>
                      <span className={styles.panel_tab_icon}><ListTodo size={11} /></span>
                      {t('landing.panel_title')}
                    </div>
                    <div className={styles.panel_tab_inactive}>
                      <Clock size={11} />
                      {t('landing.panel_tab_history')}
                    </div>
                  </div>
                  <div className={styles.panel_thead}>
                    <span className={styles.panel_th}>{t('landing.panel_col_ref')}</span>
                    <span className={styles.panel_th}>{t('landing.panel_col_date')}</span>
                    <span className={styles.panel_th}>{t('landing.panel_col_category')}</span>
                    <span className={styles.panel_th}>{t('landing.panel_col_status')}</span>
                  </div>
                  <div className={styles.panel_body}>
                    <MockGrievanceRow ref_id="A3F1C2" date="14 Jun 2026" category={t('mock.cat_infrastructure')}  status="routed"    status_label={t('status.routed')} />
                    <MockGrievanceRow ref_id="B9D4E7" date="10 Jun 2026" category={t('mock.cat_public_services')} status="pending"   status_label={t('status.pending')} />
                    <MockGrievanceRow ref_id="C2A8F0" date="03 Jun 2026" category={t('mock.cat_health')}          status="resolved"  status_label={t('status.resolved')} />
                    <MockGrievanceRow ref_id="D5B1C9" date="28 May 2026" category={t('mock.cat_transport')}       status="submitted" status_label={t('status.submitted')} />
                    <MockGrievanceRow ref_id="E1C3A6" date="19 May 2026" category={t('mock.cat_education')}       status="resolved"  status_label={t('status.resolved')} />
                    <MockGrievanceRow ref_id="F7D2B8" date="05 May 2026" category={t('mock.cat_environment')}     status="routed"    status_label={t('status.routed')} />
                  </div>
                  <div className={styles.panel_statusbar}>
                    <span className={styles.panel_statusbar_dot} />
                    <span className={styles.panel_statusbar_text}>{t('landing.panel_statusbar')}</span>
                  </div>
                </div>
              </InView>
            </div>
          </div>
        </section>

        {/* Stats strip */}
        <section className={styles.stats_strip}>
          <div className={styles.container}>
            <InView direction="up">
              <div className={styles.stats_row}>
                <StatCard value={t('landing.stat_processed_value')}    label={t('landing.stat_processed_label')} />
                <StatCard value={t('landing.stat_institutions_value')} label={t('landing.stat_institutions_label')} />
                <StatCard value={t('landing.stat_response_value')}     label={t('landing.stat_response_label')} />
                <StatCard value={t('landing.stat_resolution_value')}   label={t('landing.stat_resolution_label')} />
              </div>
            </InView>
          </div>
        </section>

        {/* Feature sections */}
        <div id="features" className={styles.features_wrapper}>
          <div className={styles.container}>
            <InView direction="up">
              <FeatureSection
                id="feature-voice"
                tag={t('landing.feature_voice_tag')}
                heading={t('landing.feature_voice_heading')}
                body={t('landing.feature_voice_body')}
                bullets={[
                  { icon: <Mic size={14} />,       label: t('landing.feature_voice_b1') },
                  { icon: <Upload size={14} />,     label: t('landing.feature_voice_b2') },
                  { icon: <Languages size={14} />,  label: t('landing.feature_voice_b3') },
                ]}
                panel={<FeaturePanel icon={<Mic size={40} />} bg="ochre" label={t('landing.feature_voice_panel_label')} sublabel={t('landing.feature_voice_panel_sub')} />}
              />
            </InView>

            <InView direction="up">
              <FeatureSection
                id="feature-identity"
                tag={t('landing.feature_identity_tag')}
                flip
                heading={t('landing.feature_identity_heading')}
                body={t('landing.feature_identity_body')}
                bullets={[
                  { icon: <Fingerprint size={14} />, label: t('landing.feature_identity_b1') },
                  { icon: <ShieldCheck size={14} />, label: t('landing.feature_identity_b2') },
                  { icon: <Lock size={14} />,        label: t('landing.feature_identity_b3') },
                ]}
                panel={<FeaturePanel icon={<ShieldCheck size={40} />} bg="neutral" label={t('landing.feature_identity_panel_label')} sublabel={t('landing.feature_identity_panel_sub')} />}
              />
            </InView>

            <InView direction="up">
              <FeatureSection
                id="feature-tracking"
                tag={t('landing.feature_tracking_tag')}
                heading={t('landing.feature_tracking_heading')}
                body={t('landing.feature_tracking_body')}
                bullets={[
                  { icon: <Clock size={14} />,       label: t('landing.feature_tracking_b1') },
                  { icon: <FileCheck size={14} />,   label: t('landing.feature_tracking_b2') },
                  { icon: <CheckCircle2 size={14} />, label: t('landing.feature_tracking_b3') },
                ]}
                panel={<FeaturePanel icon={<BarChart3 size={40} />} bg="ochre" label={t('landing.feature_tracking_panel_label')} sublabel={t('landing.feature_tracking_panel_sub')} />}
              />
            </InView>

            <InView direction="up">
              <FeatureSection
                id="feature-routing"
                tag={t('landing.feature_routing_tag')}
                flip
                heading={t('landing.feature_routing_heading')}
                body={t('landing.feature_routing_body')}
                bullets={[
                  { icon: <MapPin size={14} />,    label: t('landing.feature_routing_b1') },
                  { icon: <Building2 size={14} />, label: t('landing.feature_routing_b2') },
                  { icon: <Check size={14} />,     label: t('landing.feature_routing_b3') },
                ]}
                panel={<FeaturePanel icon={<MapPin size={40} />} bg="neutral" label={t('landing.feature_routing_panel_label')} sublabel={t('landing.feature_routing_panel_sub')} />}
              />
            </InView>

            <InView direction="up">
              <FeatureSection
                id="feature-security"
                tag={t('landing.feature_security_tag')}
                heading={t('landing.feature_security_heading')}
                body={t('landing.feature_security_body')}
                bullets={[
                  { icon: <Lock size={14} />,      label: t('landing.feature_security_b1') },
                  { icon: <ShieldCheck size={14} />, label: t('landing.feature_security_b2') },
                  { icon: <FileCheck size={14} />, label: t('landing.feature_security_b3') },
                ]}
                panel={<FeaturePanel icon={<Lock size={40} />} bg="ochre" label={t('landing.feature_security_panel_label')} sublabel={t('landing.feature_security_panel_sub')} />}
              />
            </InView>

            <InView direction="up">
              <FeatureSection
                id="feature-access"
                tag={t('landing.feature_access_tag')}
                flip
                heading={t('landing.feature_access_heading')}
                body={t('landing.feature_access_body')}
                bullets={[
                  { icon: <Globe size={14} />, label: t('landing.feature_access_b1') },
                  { icon: <Zap size={14} />,   label: t('landing.feature_access_b2') },
                  { icon: <Mic size={14} />,   label: t('landing.feature_access_b3') },
                ]}
                panel={<FeaturePanel icon={<Globe size={40} />} bg="neutral" label={t('landing.feature_access_panel_label')} sublabel={t('landing.feature_access_panel_sub')} />}
              />
            </InView>
          </div>
        </div>

        {/* How it works */}
        <section id="how-it-works" className={styles.how_section}>
          <div className={styles.container}>
            <InView direction="up">
              <div className={styles.how_header}>
                <h2 className={styles.section_heading}>{t('landing.how_heading')}</h2>
                <p className={styles.section_sub}>{t('landing.how_sub')}</p>
              </div>
            </InView>
            <InView direction="up" delay="60ms">
              <ol className={styles.steps}>
                <Step n={1} icon={<Fingerprint size={24} />} label={t('landing.step1_label')} desc={t('landing.step1_desc')} t={t} />
                <Step n={2} icon={<Mic size={24} />}         label={t('landing.step2_label')} desc={t('landing.step2_desc')} t={t} />
                <Step n={3} icon={<MapPin size={24} />}      label={t('landing.step3_label')} desc={t('landing.step3_desc')} t={t} />
                <Step n={4} icon={<CheckCircle2 size={24} />} label={t('landing.step4_label')} desc={t('landing.step4_desc')} t={t} />
              </ol>
            </InView>
          </div>
        </section>

        {/* Documentation */}
        <section id="documentation" className={styles.doc_section}>
          <div className={styles.container}>
            <InView direction="up">
              <div className={styles.doc_inner}>
                <div>
                  <h2 className={styles.section_heading}>{t('landing.doc_heading')}</h2>
                  <p className={styles.section_sub} style={{ maxWidth: 520 }}>{t('landing.doc_sub')}</p>
                </div>
                <div className={styles.doc_cards}>
                  <DocCard icon={<FileCheck size={20} />} title={t('landing.doc_card1_title')} desc={t('landing.doc_card1_desc')} />
                  <DocCard icon={<Lock size={20} />}      title={t('landing.doc_card2_title')} desc={t('landing.doc_card2_desc')} />
                  <DocCard icon={<ShieldCheck size={20} />} title={t('landing.doc_card3_title')} desc={t('landing.doc_card3_desc')} />
                </div>
              </div>
            </InView>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className={styles.contact_section}>
          <div className={styles.container}>
            <InView direction="up">
              <div className={styles.contact_inner}>
                <h2 className={styles.contact_heading}>{t('landing.contact_heading')}</h2>
                <p className={styles.contact_sub}>{t('landing.contact_sub')}</p>
                <div className={styles.contact_details}>
                  <span>{t('landing.contact_address')}</span>
                  <span>·</span>
                  <a href="mailto:dil@aui.ma" className={styles.contact_link}>dil@aui.ma</a>
                </div>
              </div>
            </InView>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footer_inner}>
            <div className={styles.footer_brand}>
              <div className={styles.footer_logo}>
                <span className={styles.brand_mark_sm}>GID</span>
                <span className={styles.footer_logo_name}>GrievanceID</span>
              </div>
              <p className={styles.footer_tagline}>{t('landing.footer_tagline')}</p>
            </div>
            <div className={styles.footer_cols}>
              <FooterCol title={t('landing.footer_col_platform')}>
                <FooterLink href="#features">{t('landing.footer_link_features')}</FooterLink>
                <FooterLink href="#how-it-works">{t('landing.footer_link_how')}</FooterLink>
                <FooterLink href="#documentation">{t('landing.footer_link_docs')}</FooterLink>
                <FooterLink href="#contact">{t('landing.footer_link_contact')}</FooterLink>
              </FooterCol>
              <FooterCol title={t('landing.footer_col_actors')}>
                <FooterLink href="/login">{t('landing.footer_link_citizen')}</FooterLink>
                <FooterLink href="/login">{t('landing.footer_link_reviewer')}</FooterLink>
                <FooterLink href="/login">{t('landing.footer_link_staff')}</FooterLink>
              </FooterCol>
              <FooterCol title={t('landing.footer_col_research')}>
                <FooterLink href="#documentation">{t('landing.footer_link_surp')}</FooterLink>
                <FooterLink href="#documentation">{t('landing.footer_link_inji')}</FooterLink>
                <FooterLink href="#documentation">{t('landing.footer_link_threat')}</FooterLink>
              </FooterCol>
              <FooterCol title={t('landing.footer_col_legal')}>
                <FooterLink href="#">{t('landing.footer_link_privacy')}</FooterLink>
                <FooterLink href="#">{t('landing.footer_link_data')}</FooterLink>
                <FooterLink href="#">{t('landing.footer_link_accessibility')}</FooterLink>
              </FooterCol>
            </div>
          </div>
          <div className={styles.footer_bottom}>
            <span>{t('landing.footer_bottom')}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── Sub-components ── */

function StatCard({ value, label }) {
  return (
    <div className={styles.stat_card}>
      <span className={styles.stat_value}>{value}</span>
      <span className={styles.stat_label}>{label}</span>
    </div>
  );
}

function Step({ n, icon, label, desc, t }) {
  return (
    <li className={styles.step}>
      <div className={styles.step_num_col}>
        <div className={styles.step_icon_wrap}>{icon}</div>
        <div className={styles.step_connector} />
      </div>
      <div className={styles.step_content}>
        <div className={styles.step_n}>{t('landing.step_n', { n })}</div>
        <h3 className={styles.step_label}>{label}</h3>
        <p className={styles.step_desc}>{desc}</p>
      </div>
    </li>
  );
}

function FeaturePanel({ icon, label, sublabel, bg }) {
  return (
    <div className={`${styles.feat_panel} ${bg === 'ochre' ? styles.feat_panel_ochre : styles.feat_panel_neutral}`}>
      <div className={styles.feat_panel_icon}>{icon}</div>
      <div className={styles.feat_panel_text}>
        <span className={styles.feat_panel_label}>{label}</span>
        <span className={styles.feat_panel_sub}>{sublabel}</span>
      </div>
    </div>
  );
}

function DocCard({ icon, title, desc }) {
  return (
    <div className={styles.doc_card}>
      <span className={styles.doc_card_icon}>{icon}</span>
      <h4 className={styles.doc_card_title}>{title}</h4>
      <p className={styles.doc_card_desc}>{desc}</p>
    </div>
  );
}

function FooterCol({ title, children }) {
  return (
    <div className={styles.footer_col}>
      <h4 className={styles.footer_col_title}>{title}</h4>
      <ul className={styles.footer_col_links}>{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }) {
  return (
    <li>
      <a
        href={href}
        className={styles.footer_link}
        onClick={href.startsWith('#') ? (e) => {
          e.preventDefault();
          document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
        } : undefined}
      >
        {children}
      </a>
    </li>
  );
}

function MockGrievanceRow({ ref_id, date, category, status, status_label }) {
  return (
    <div className={styles.mock_row}>
      <span className={styles.mock_ref}>{ref_id}</span>
      <span className={styles.mock_date}>{date}</span>
      <span className={styles.mock_category}>{category}</span>
      <span className={`${styles.mock_badge} ${styles[`mock_badge_${status}`]}`}>{status_label}</span>
    </div>
  );
}
