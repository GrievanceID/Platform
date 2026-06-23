# CLAUDE.md — Operating Rules for This Repo

This is the `platform` repo for the SURP'26 voice-based citizen grievance platform (TawthiqID — formerly GrievanceID org).
Full system spec lives at `/docs/PROJECT_SPECIFICATION.md` — read it before scaffolding or making
architectural decisions. This file is operating rules, not the spec itself.

## What this repo is

- React + Vite frontend
- Node.js + Express backend (auth, RBAC, grievance/institution/user CRUD, orchestration)
- Talks to two external services over HTTP, NOT in this repo:
  - ASR service (FastAPI, Python) — `speech-processing` repo, exposes `/transcribe`
  - Identity service (Inji Certify / eSignet, later phase) — `identity-layer` repo
- Postgres for storage

## Hard constraints — do not violate

- NO cloud AI APIs, ever. No OpenAI/Anthropic/etc. calls for ASR or categorization. Local/local-network only.
- NO CDN runtime dependencies (fonts, scripts, icon libs). Everything bundled at build time — this app must run fully air-gapped after initial setup.
- Institutions are seeded DB rows (`institutions.seed.json`), never hardcoded in app code or frontend.
- Authorization scoping (institution_id for employees, citizen_id for citizens) is ALWAYS derived server-side from the session/auth token. Never accept it as a client-supplied query param or body field. This is the single most important rule in this repo.
- No design with gradient-heavy/SaaS-default aesthetics. Professional, restrained, government-appropriate visual style. See Design Tokens section below — this supersedes any older references to teal elsewhere in this repo or its history.
- Citizen identity fields must be excluded from Reviewer-facing API responses at the API layer, not filtered in the frontend.
- Every new page MUST use the i18n system from day one — no hardcoded user-facing strings in any frontend component. Add all keys to both `frontend/src/locales/ar.json` and `frontend/src/locales/fr.json` before writing JSX that uses them. Use `useTranslation()` from `react-i18next`.
- Session VCs are immutable once issued. Corrections happen via separate linked records (CategoryOverride), never by mutating a signed record.

## Design tokens

Primary accent: oxblood `#4A1620` (fourth iteration — supersedes ochre `#8A5A1F`, which
superseded green, which superseded teal `#0D7C7C`; if you see any of those older values
anywhere including in `PROJECT_SPECIFICATION.md`, treat this file as authoritative instead).

- Hover state: `#3A1018`
- Active state: `#2A0A10`
- Light tint / subtle bg: `#F5ECED` (pale oxblood-blush — noticeably softer than the old ochre tan)
- Border accent: `#C4818E`
- Background: `#FAFAFA`
- Typography: Plus Jakarta Sans
- Border radius: minimal, 2-4px max — avoid heavily rounded "consumer app" aesthetics
- Token source of truth: `frontend/src/styles/tokens.css` — never hardcode color, spacing,
  or radius values directly in component files; add missing values to tokens.css first.
- Logo assets (rebrand to TawthiqID, 2026-06-23): `frontend/src/assets/branding/`
  - `tawthiqid-logo-transparent.png` — full icon+wordmark lockup, transparent bg. Use for
    navbar, login page header, and footers (light/neutral backgrounds).
  - `tawthiqid-logo-sidebar.png` — same lockup with "Tawthiq" text recolored white for
    legibility on the oxblood sidebar. Use ONLY for sidebar headers (CitizenLayout, StaffLayout).
  - `tawthiqid-icon-square.png` — icon-only, square-padded, transparent. Use for favicon
    and any app-icon-style slot.
  - `tawthiqid-logo-light.png` / `tawthiqid-icon.png` — secondary variants, available if needed.

## Workflow conventions

- Thinking level: low for routine build/fix tasks. Use medium only when explicitly told it's a complex debugging task.
- When given a multi-fix prompt, treat each as FIX 1 / FIX 2 / etc. Report back which files were touched per fix.
- Stay scoped to files explicitly named in the prompt unless a fix is impossible without touching something else — if so, stop and ask rather than expanding scope silently.
- Commit directly to main. Descriptive, informal commit messages (no enforced conventional-commits format).
- Don't introduce new dependencies without flagging it first.

## Where to look before asking

- Full actors/use cases/data model/API surface: `/docs/PROJECT_SPECIFICATION.md`
- Open/deferred decisions: Section 13 of the spec
- If something in this file and the spec conflict, the spec wins for architecture; this file wins
  for day-to-day execution conventions and design tokens specifically (the spec's color references
  are stale — see Design Tokens above).