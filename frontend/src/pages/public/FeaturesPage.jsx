import { useTranslation } from 'react-i18next';
import {
  Mic, Upload, ShieldCheck, MapPin, BarChart3, Globe,
  Check, Fingerprint, FileCheck, Clock, CheckCircle2,
  Building2, Lock, Languages, Zap,
} from 'lucide-react';
import { InView } from '../../components/ui';
import { LandingNav } from '../../components/landing/LandingNav';
import { FeatureSection } from '../../components/landing/FeatureSection';
import styles from './FeaturesPage.module.css';

export function FeaturesPage() {
  const { t } = useTranslation();

  return (
    <div className={styles.page}>
      <LandingNav />

      <main>
        <div className={styles.page_header}>
          <div className={styles.container}>
            <InView direction="up">
              <h1 className={styles.page_heading}>{t('features.page_heading')}</h1>
              <p className={styles.page_sub}>{t('features.page_sub')}</p>
            </InView>
          </div>
        </div>

        <div className={styles.features_wrapper}>
          <div className={styles.container}>
            <InView direction="up">
              <FeatureSection
                id="feat-voice"
                tag={t('features.voice_tag')}
                heading={t('features.voice_heading')}
                body={t('features.voice_body')}
                bullets={[
                  { icon: <Mic size={14} />,       label: t('features.voice_b1') },
                  { icon: <Upload size={14} />,     label: t('features.voice_b2') },
                  { icon: <Languages size={14} />,  label: t('features.voice_b3') },
                ]}
                panel={<FeaturePanel icon={<Mic size={40} />} bg="ochre" label={t('features.voice_panel_label')} sublabel={t('features.voice_panel_sub')} />}
              />
            </InView>

            <InView direction="up">
              <FeatureSection
                id="feat-identity"
                tag={t('features.identity_tag')}
                flip
                heading={t('features.identity_heading')}
                body={t('features.identity_body')}
                bullets={[
                  { icon: <Fingerprint size={14} />, label: t('features.identity_b1') },
                  { icon: <ShieldCheck size={14} />, label: t('features.identity_b2') },
                  { icon: <Lock size={14} />,        label: t('features.identity_b3') },
                ]}
                panel={<FeaturePanel icon={<ShieldCheck size={40} />} bg="neutral" label={t('features.identity_panel_label')} sublabel={t('features.identity_panel_sub')} />}
              />
            </InView>

            <InView direction="up">
              <FeatureSection
                id="feat-tracking"
                tag={t('features.tracking_tag')}
                heading={t('features.tracking_heading')}
                body={t('features.tracking_body')}
                bullets={[
                  { icon: <Clock size={14} />,        label: t('features.tracking_b1') },
                  { icon: <FileCheck size={14} />,    label: t('features.tracking_b2') },
                  { icon: <CheckCircle2 size={14} />, label: t('features.tracking_b3') },
                ]}
                panel={<FeaturePanel icon={<BarChart3 size={40} />} bg="ochre" label={t('features.tracking_panel_label')} sublabel={t('features.tracking_panel_sub')} />}
              />
            </InView>

            <InView direction="up">
              <FeatureSection
                id="feat-routing"
                tag={t('features.routing_tag')}
                flip
                heading={t('features.routing_heading')}
                body={t('features.routing_body')}
                bullets={[
                  { icon: <MapPin size={14} />,    label: t('features.routing_b1') },
                  { icon: <Building2 size={14} />, label: t('features.routing_b2') },
                  { icon: <Check size={14} />,     label: t('features.routing_b3') },
                ]}
                panel={<FeaturePanel icon={<MapPin size={40} />} bg="neutral" label={t('features.routing_panel_label')} sublabel={t('features.routing_panel_sub')} />}
              />
            </InView>

            <InView direction="up">
              <FeatureSection
                id="feat-security"
                tag={t('features.security_tag')}
                heading={t('features.security_heading')}
                body={t('features.security_body')}
                bullets={[
                  { icon: <Lock size={14} />,       label: t('features.security_b1') },
                  { icon: <ShieldCheck size={14} />, label: t('features.security_b2') },
                  { icon: <FileCheck size={14} />,  label: t('features.security_b3') },
                ]}
                panel={<FeaturePanel icon={<Lock size={40} />} bg="ochre" label={t('features.security_panel_label')} sublabel={t('features.security_panel_sub')} />}
              />
            </InView>

            <InView direction="up">
              <FeatureSection
                id="feat-access"
                tag={t('features.access_tag')}
                flip
                heading={t('features.access_heading')}
                body={t('features.access_body')}
                bullets={[
                  { icon: <Globe size={14} />, label: t('features.access_b1') },
                  { icon: <Zap size={14} />,   label: t('features.access_b2') },
                  { icon: <Mic size={14} />,   label: t('features.access_b3') },
                ]}
                panel={<FeaturePanel icon={<Globe size={40} />} bg="neutral" label={t('features.access_panel_label')} sublabel={t('features.access_panel_sub')} />}
              />
            </InView>
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footer_inner}>
            <div className={styles.footer_brand}>
              <div className={styles.footer_logo}>
                <img
                  src="/src/assets/branding/tawthiqid-logo-transparent.png"
                  alt="TawthiqID"
                  className={styles.footer_logo_img}
                  height={24}
                />
              </div>
              <p className={styles.footer_tagline}>{t('landing.footer_tagline')}</p>
            </div>
            <div className={styles.footer_cols}>
              <FooterCol title={t('landing.footer_col_platform')}>
                <FooterLink href="/features">{t('landing.footer_link_features')}</FooterLink>
                <FooterLink href="/#how-it-works">{t('landing.footer_link_how')}</FooterLink>
                <FooterLink href="/#documentation">{t('landing.footer_link_docs')}</FooterLink>
                <FooterLink href="/#contact">{t('landing.footer_link_contact')}</FooterLink>
              </FooterCol>
              <FooterCol title={t('landing.footer_col_actors')}>
                <FooterLink href="/login">{t('landing.footer_link_citizen')}</FooterLink>
                <FooterLink href="/login">{t('landing.footer_link_reviewer')}</FooterLink>
                <FooterLink href="/login">{t('landing.footer_link_staff')}</FooterLink>
              </FooterCol>
              <FooterCol title={t('landing.footer_col_research')}>
                <FooterLink href="/#documentation">{t('landing.footer_link_surp')}</FooterLink>
                <FooterLink href="/#documentation">{t('landing.footer_link_inji')}</FooterLink>
                <FooterLink href="/#documentation">{t('landing.footer_link_threat')}</FooterLink>
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
      <a href={href} className={styles.footer_link}>
        {children}
      </a>
    </li>
  );
}
