import { useNavigate } from 'react-router-dom';
import {
  Mic, Upload, ShieldCheck, MapPin, BarChart3, Globe,
  Check, ArrowRight, Fingerprint, FileCheck, Clock, CheckCircle2,
  Building2, Lock, Languages, Zap,
} from 'lucide-react';
import { Button, InView } from '../../components/ui';
import { LandingNav } from '../../components/landing/LandingNav';
import { FeatureSection } from '../../components/landing/FeatureSection';
import styles from './LandingPage.module.css';

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      {/* FIX 1 — Navbar */}
      <LandingNav />

      <main>
        {/* FIX 2 — Hero */}
        <section id="home" className={styles.hero}>
          <div className={styles.container}>
            <div className={styles.hero_inner}>
              <div className={styles.hero_text}>
                <InView direction="up">
                  {/* PLACEHOLDER: replace */}
                  <div className={styles.hero_eyebrow}>
                    <span className={styles.eyebrow_badge}>Kingdom of Morocco · Digital Services</span>
                  </div>
                </InView>
                <InView direction="up" delay="60ms">
                  {/* PLACEHOLDER: replace */}
                  <h1 className={styles.hero_heading}>
                    Your grievance,<br />
                    heard and tracked.
                  </h1>
                </InView>
                <InView direction="up" delay="120ms">
                  {/* PLACEHOLDER: replace */}
                  <p className={styles.hero_sub}>
                    A voice-first citizen grievance platform for Moroccan public services.
                    Speak in Arabic or Darija, verify your identity, and follow your case
                    from submission to resolution — all in one place.
                  </p>
                </InView>
                <InView direction="up" delay="180ms">
                  <div className={styles.hero_actions}>
                    <Button variant="primary" size="lg" onClick={() => navigate('/grievances/new')}>
                      Submit a grievance
                    </Button>
                    <a href="#how-it-works" className={styles.hero_link} onClick={(e) => {
                      e.preventDefault();
                      document.querySelector('#how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                    }}>
                      How it works <ArrowRight size={14} />
                    </a>
                  </div>
                </InView>
              </div>

              {/* Illustrative mockup panel */}
              <InView direction="up" delay="100ms">
                <div className={styles.hero_panel}>
                  <div className={styles.panel_header}>
                    <span className={styles.panel_dot} />
                    <span className={styles.panel_dot} />
                    <span className={styles.panel_dot} />
                    <span className={styles.panel_title}>My Grievances</span>
                  </div>
                  <div className={styles.panel_body}>
                    <MockGrievanceRow
                      ref_id="A3F1C2"
                      date="14 Jun 2026"
                      category="Infrastructure"
                      status="routed"
                      status_label="Routed"
                    />
                    <MockGrievanceRow
                      ref_id="B9D4E7"
                      date="10 Jun 2026"
                      category="Public Services"
                      status="pending"
                      status_label="Pending review"
                    />
                    <MockGrievanceRow
                      ref_id="C2A8F0"
                      date="03 Jun 2026"
                      category="Health"
                      status="resolved"
                      status_label="Resolved"
                    />
                    <MockGrievanceRow
                      ref_id="D5B1C9"
                      date="28 May 2026"
                      category="Transport"
                      status="submitted"
                      status_label="Submitted"
                    />
                  </div>
                </div>
              </InView>
            </div>
          </div>
        </section>

        {/* FIX 3 — Stats strip */}
        <section className={styles.stats_strip}>
          <div className={styles.container}>
            <InView direction="up">
              <div className={styles.stats_row}>
                {/* PLACEHOLDER: replace */}
                <StatCard value="4,200+" label="Grievances processed" />
                <StatCard value="17" label="Institutions connected" />
                <StatCard value="3.4 days" label="Average response time" />
                <StatCard value="94%" label="Resolution rate" />
              </div>
            </InView>
          </div>
        </section>

        {/* FIX 4 — Feature sections */}
        <div id="features" className={styles.features_wrapper}>
          <div className={styles.container}>

            <InView direction="up">
              <FeatureSection
                id="feature-voice"
                tag="Voice Submission"
                heading="Speak in Arabic or Darija — we understand both"
                body="Record your grievance directly in the browser or upload an existing audio file. Our pipeline transcribes Arabic (MSA) and Moroccan Darija with confidence-based dialect routing, so nothing gets lost in translation."
                bullets={[
                  { icon: <Mic size={14} />, label: 'In-browser recording via MediaRecorder API — no app download required' },
                  { icon: <Upload size={14} />, label: 'Upload WAV, MP3, or OGG files up to 100 MB' },
                  { icon: <Languages size={14} />, label: 'Arabic and Darija supported with hybrid WhisperX / MoulSot pipeline' },
                ]}
                panel={<FeaturePanel icon={<Mic size={40} />} bg="ochre" label="Voice-first intake" sublabel="Arabic · Darija · MSA" />}
              />
            </InView>

            <InView direction="up">
              <FeatureSection
                id="feature-identity"
                tag="Identity Verification"
                flip
                heading="Your identity, verified — without exposing your data"
                body="Authenticate using a digital identity wallet compatible with MOSIP and Inji Certify standards. Consent is captured as a cryptographically signed Verifiable Credential before any recording begins."
                bullets={[
                  { icon: <Fingerprint size={14} />, label: 'OpenID4VP-compatible wallet authentication' },
                  { icon: <ShieldCheck size={14} />, label: 'Consent VC issued and signed before session starts' },
                  { icon: <Lock size={14} />, label: 'Your identity is never shared with the reviewing officer' },
                ]}
                panel={<FeaturePanel icon={<ShieldCheck size={40} />} bg="neutral" label="Privacy-preserving identity" sublabel="Inji · MOSIP · OpenID4VP" />}
              />
            </InView>

            <InView direction="up">
              <FeatureSection
                id="feature-tracking"
                tag="Real-time Tracking"
                heading="Track your case from submission to resolution"
                body="Every grievance gets a unique reference number and a live status you can check at any time. You receive updates as your case moves through transcription, review, routing, and resolution."
                bullets={[
                  { icon: <Clock size={14} />, label: 'Live status: Submitted → Transcribed → Pending Review → Routed → Resolved' },
                  { icon: <FileCheck size={14} />, label: 'Immutable session record — nothing can be altered after signing' },
                  { icon: <CheckCircle2 size={14} />, label: 'Submit follow-ups linked to your original case' },
                ]}
                panel={<FeaturePanel icon={<BarChart3 size={40} />} bg="ochre" label="Case tracking" sublabel="Live status · Audit trail" />}
              />
            </InView>

            <InView direction="up">
              <FeatureSection
                id="feature-routing"
                tag="Smart Routing"
                flip
                heading="Routed to the right institution, confirmed by a human"
                body="Our AI categorises your grievance and suggests the appropriate institution. A human reviewer confirms the routing before it is forwarded — so automated decisions never go unchecked."
                bullets={[
                  { icon: <MapPin size={14} />, label: 'NLP classification across 11 grievance categories' },
                  { icon: <Building2 size={14} />, label: 'Mapped to 17 connected Moroccan public institutions' },
                  { icon: <Check size={14} />, label: 'Mandatory human-in-the-loop confirmation before routing' },
                ]}
                panel={<FeaturePanel icon={<MapPin size={40} />} bg="neutral" label="Human-confirmed routing" sublabel="AI suggestion · Reviewer approval" />}
              />
            </InView>

            <InView direction="up">
              <FeatureSection
                id="feature-security"
                tag="Tamper-Proof Records"
                heading="Cryptographically signed session records"
                body="Once a grievance is processed, a Session Verifiable Credential is issued — a signed, immutable record of the transcript hash, speaker labels, category, and routing decision. Corrections are additive, never destructive."
                bullets={[
                  { icon: <Lock size={14} />, label: 'Session VCs signed using W3C Verifiable Credentials standard' },
                  { icon: <ShieldCheck size={14} />, label: 'Transcript hash anchors the record — alterations are detectable' },
                  { icon: <FileCheck size={14} />, label: 'Category overrides logged as separate records, not edits' },
                ]}
                panel={<FeaturePanel icon={<Lock size={40} />} bg="ochre" label="Signed session records" sublabel="W3C VCs · Inji Certify" />}
              />
            </InView>

            <InView direction="up">
              <FeatureSection
                id="feature-access"
                tag="Accessible by Design"
                flip
                heading="Designed for every citizen, not just tech users"
                body="No paperwork, no office visit, no language barrier. The platform is built to work on low-bandwidth connections and supports right-to-left Arabic text throughout the interface."
                bullets={[
                  { icon: <Globe size={14} />, label: 'Arabic RTL interface support across all screens' },
                  { icon: <Zap size={14} />, label: 'Runs fully offline after initial load — no cloud dependency' },
                  { icon: <Mic size={14} />, label: 'Voice-first: no typing required to submit a grievance' },
                ]}
                panel={<FeaturePanel icon={<Globe size={40} />} bg="neutral" label="Inclusive access" sublabel="RTL · Offline · Voice" />}
              />
            </InView>

          </div>
        </div>

        {/* FIX 5 — How it works */}
        <section id="how-it-works" className={styles.how_section}>
          <div className={styles.container}>
            <InView direction="up">
              <div className={styles.how_header}>
                {/* PLACEHOLDER: replace */}
                <h2 className={styles.section_heading}>How it works</h2>
                <p className={styles.section_sub}>
                  From first login to resolution in four steps.
                </p>
              </div>
            </InView>
            <InView direction="up" delay="60ms">
              <ol className={styles.steps}>
                {/* PLACEHOLDER: replace */}
                <Step n={1} icon={<Fingerprint size={24} />} label="Verify your identity" desc="Log in with your citizen account or connect your Inji digital wallet to prove who you are — without sharing unnecessary personal data." />
                <Step n={2} icon={<Mic size={24} />} label="Record or upload" desc="Speak your grievance in Arabic or Darija directly in the browser, or upload an audio file. Add written context if needed." />
                <Step n={3} icon={<MapPin size={24} />} label="Review and routing" desc="Your submission is transcribed, categorised by AI, and confirmed by a human reviewer before being forwarded to the appropriate institution." />
                <Step n={4} icon={<CheckCircle2 size={24} />} label="Track to resolution" desc="Follow your case with a reference number. The institution responds, marks it resolved, and a signed record is issued — permanently." />
              </ol>
            </InView>
          </div>
        </section>

        {/* Documentation anchor section */}
        <section id="documentation" className={styles.doc_section}>
          <div className={styles.container}>
            <InView direction="up">
              <div className={styles.doc_inner}>
                <div>
                  {/* PLACEHOLDER: replace */}
                  <h2 className={styles.section_heading}>Built for government, open to scrutiny</h2>
                  <p className={styles.section_sub} style={{ maxWidth: 520 }}>
                    GrievanceID is a research prototype developed at Al Akhawayn University's Digital
                    Innovation Lab as part of SURP'26. All architecture decisions, data models, and
                    security trade-offs are documented openly.
                  </p>
                </div>
                <div className={styles.doc_cards}>
                  {/* PLACEHOLDER: replace */}
                  <DocCard icon={<FileCheck size={20} />} title="System Specification" desc="Full actor model, API surface, data schema, and authorization rules." />
                  <DocCard icon={<Lock size={20} />} title="Threat Model" desc="Security analysis of identity anchoring, VC issuance, and data boundaries." />
                  <DocCard icon={<ShieldCheck size={20} />} title="Privacy Design" desc="How citizen identity is isolated from reviewer-facing data at the API layer." />
                </div>
              </div>
            </InView>
          </div>
        </section>

        {/* Contact anchor */}
        <section id="contact" className={styles.contact_section}>
          <div className={styles.container}>
            <InView direction="up">
              <div className={styles.contact_inner}>
                {/* PLACEHOLDER: replace */}
                <h2 className={styles.contact_heading}>Questions or feedback?</h2>
                <p className={styles.contact_sub}>
                  This is a research project. We welcome institutional feedback, pilot partnership
                  inquiries, and academic collaboration.
                </p>
                <div className={styles.contact_details}>
                  {/* PLACEHOLDER: replace */}
                  <span>Digital Innovation Lab, Al Akhawayn University, Ifrane, Morocco</span>
                  <span>·</span>
                  <a href="mailto:dil@aui.ma" className={styles.contact_link}>dil@aui.ma</a>
                </div>
              </div>
            </InView>
          </div>
        </section>
      </main>

      {/* FIX 6 — Footer */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footer_inner}>
            <div className={styles.footer_brand}>
              <div className={styles.footer_logo}>
                <span className={styles.brand_mark_sm}>GID</span>
                <span className={styles.footer_logo_name}>GrievanceID</span>
              </div>
              {/* PLACEHOLDER: replace */}
              <p className={styles.footer_tagline}>
                Voice-first citizen grievance platform<br />
                for Moroccan public services.
              </p>
            </div>

            <div className={styles.footer_cols}>
              <FooterCol title="Platform">
                {/* PLACEHOLDER: replace */}
                <FooterLink href="#features">Features</FooterLink>
                <FooterLink href="#how-it-works">How it works</FooterLink>
                <FooterLink href="#documentation">Documentation</FooterLink>
                <FooterLink href="#contact">Contact</FooterLink>
              </FooterCol>
              <FooterCol title="Actors">
                {/* PLACEHOLDER: replace */}
                <FooterLink href="/login">Citizen login</FooterLink>
                <FooterLink href="/login">Reviewer login</FooterLink>
                <FooterLink href="/login">Institution staff</FooterLink>
              </FooterCol>
              <FooterCol title="Research">
                {/* PLACEHOLDER: replace */}
                <FooterLink href="#documentation">SURP'26 — AUI</FooterLink>
                <FooterLink href="#documentation">Inji / MOSIP integration</FooterLink>
                <FooterLink href="#documentation">Threat model</FooterLink>
              </FooterCol>
              <FooterCol title="Legal">
                {/* PLACEHOLDER: replace */}
                <FooterLink href="#">Privacy notice</FooterLink>
                <FooterLink href="#">Data processing</FooterLink>
                <FooterLink href="#">Accessibility</FooterLink>
              </FooterCol>
            </div>
          </div>

          <div className={styles.footer_bottom}>
            {/* PLACEHOLDER: replace */}
            <span>© 2026 GrievanceID — SURP'26, Digital Innovation Lab, Al Akhawayn University. Research prototype. Not a production service.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────────────────────── */

function StatCard({ value, label }) {
  return (
    <div className={styles.stat_card}>
      {/* PLACEHOLDER: replace */}
      <span className={styles.stat_value}>{value}</span>
      <span className={styles.stat_label}>{label}</span>
    </div>
  );
}

function Step({ n, icon, label, desc }) {
  return (
    <li className={styles.step}>
      <div className={styles.step_num_col}>
        <div className={styles.step_icon_wrap}>{icon}</div>
        <div className={styles.step_connector} />
      </div>
      <div className={styles.step_content}>
        <div className={styles.step_n}>Step {n}</div>
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
      {/* PLACEHOLDER: replace */}
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
