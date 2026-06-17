# Voice-Based Citizen Grievance Intelligence Platform
## Complete System Specification — SURP'26, Digital Innovation Lab (DIL), AUI

**Status:** Pre-implementation specification. Built from team decisions through Week 2-3.
**Purpose:** Single source of truth for Claude Code prompting and team alignment. Decisions marked `[DECIDED — PROTOTYPE PHASE]` are settled for this build; revisit only with explicit reason.

---

## 1. Project Identity

**Program:** SURP'26, Al Akhawayn University (AUI), Ifrane, Morocco. June 2 – July 20, 2026.
**Lab:** Digital Innovation Lab (DIL), collaborating with CMU Africa's Upanzi Network.
**Mentor:** Professor Houda Chakiri.
**Sub-research question (Ilyass):** How can verifiable credentials and digital identity wallets (Inji) improve trust and interoperability in citizen-centric digital services?
**Research angle:** Security and threat modeling as the primary contribution lens.

**Team:**

| Name | Role | Owns |
|---|---|---|
| Ilyass Lhafi | Team Lead, Identity & Trust Layer | Auth, Consent VC, Session VC, threat model |
| Mohammed | Speech Processing | ASR (WhisperX + MoulSot hybrid pipeline) |
| Lina | Speaker Diarization | Pyannote.audio + alignment, speaker labeling |
| Mira | AI Categorization & Routing | NLP classification, summarization, routing suggestion |

**GitHub Organization:** GrievanceID — `identity-layer`, `speech-processing`, `ai-categorization`, `docs`.

---

## 2. What This System Is

A voice-based citizen grievance intake and routing platform for Moroccan government use. A citizen speaks a grievance in Arabic or Darija; the system transcribes it, identifies speakers, classifies and summarizes the content, has a human confirm routing, and produces a cryptographically signed record of the session anchored to verified identity.

**Why it's a research contribution, not just a build:** no existing work combines verified digital identity anchoring (VCs), Arabic/Darija voice transcription with confidence-based dialect routing, speaker diarization, human-in-the-loop AI verification, and cryptographic session records, applied to Moroccan government services.

---

## 3. Actors and Roles

Two distinct concepts, kept deliberately separate:

- **Platform actors** — who logs into the system and what they can do.
- **Speaker labels** — Citizen / Agent / Witness / Unknown, assigned by Lina's diarization *within a recorded session*. These are not login roles. A witness does not authenticate; they are a voice the pipeline labels after the fact.

### 3.1 Citizen
- Authenticates (simple login for prototype phase; Inji Wallet/OpenID4VP later).
- Records or uploads a grievance (audio).
- Views status and detail of their own submitted grievances.
- Submits follow-up audio linked to a prior grievance.

### 3.2 Reviewer (Triage)
`[DECIDED — PROTOTYPE PHASE]` Modeled as a real human-in-the-loop government workflow role, not a placeholder. One seeded account for prototype/demo purposes; the role and its data boundaries are built as if a real triage office would staff it.

- Authenticates.
- Sees a queue of AI-processed grievances pending routing confirmation (`pending_review`), prioritized by Mira's confidence score — lowest confidence first.
- Views transcript, diarization, and Mira's suggested category/institution.
- Does **not** see the citizen's verified identity. Reviewer's API responses exclude citizen identity fields entirely — enforced server-side, not hidden in the UI.
- Approves, corrects, or rejects the AI's routing suggestion.

**Rationale (for report):** Fully automated routing without human confirmation risks misdirecting sensitive grievances to the wrong institution. An intermediate, identity-blind review step lets a human verify AI output before institutional handoff, without expanding who has access to citizen identity — a privacy-by-design choice consistent with MOSIP/Inji's minimal-disclosure philosophy.

### 3.3 Employee (Institution Staff)
- Authenticates; scoped to exactly one `institution_id`.
- Sees only grievances routed to their own institution. Institution scope is derived from the authenticated session server-side — never accepted as a client-supplied parameter (see Section 8, Authorization).
- Views full grievance detail: diarized transcript, category, summary, confidence.
- Adds notes, marks resolved, flags a grievance with a reason.
- Can request a category override (creates an override record; does not retroactively alter the signed Session VC).

### 3.4 Admin
- Authenticates; cross-institution visibility.
- Manages Employee and Reviewer accounts (create/deactivate, assign institution).
- Can reroute a grievance post-routing (logged action).
- Views aggregate stats: counts by category/institution/status, confidence distributions — this is also the research data export point for the final report.

---

## 4. Use Cases

| ID | Actor | Use Case |
|---|---|---|
| UC-1 | Citizen | Register / log in |
| UC-2 | Citizen | Record or upload a grievance (audio) |
| UC-3 | Citizen | View status of own grievances |
| UC-4 | Citizen | Submit a follow-up linked to a prior grievance |
| UC-5 | Reviewer | View queue of grievances pending routing, sorted by ascending confidence |
| UC-6 | Reviewer | View de-identified transcript + AI-suggested category/institution |
| UC-7 | Reviewer | Approve, correct, or reject AI routing suggestion |
| UC-8 | Employee | View grievances routed to own institution |
| UC-9 | Employee | View full grievance detail (transcript, diarization, category, summary) |
| UC-10 | Employee | Add note, mark resolved, flag with reason |
| UC-11 | Employee | Request category override |
| UC-12 | Admin | Manage Employee/Reviewer accounts |
| UC-13 | Admin | Cross-institution view, filter by institution/category/status/date |
| UC-14 | Admin | Reroute a grievance (logged) |
| UC-15 | Admin | View aggregate stats dashboard |
| UC-16 | System (internal) | On submission: transcribe → diarize → categorize → await Reviewer approval → route |
| UC-17 | System (internal) | Issue Consent VC before recording begins |
| UC-18 | System (internal) | Issue Session VC after pipeline + routing approval completes |

---

## 5. Functional Requirements

- FR-1: System must transcribe Arabic/Darija audio using a confidence-routed hybrid of WhisperX (MSA) and MoulSot (Darija), threshold experimentally tuned (current value: -0.15 avg_logprob).
- FR-2: System must diarize multi-speaker audio and label segments (Citizen/Agent/Witness/Unknown).
- FR-3: System must categorize grievance content and suggest a target institution.
- FR-4: System must NOT auto-route without human (Reviewer) confirmation.
- FR-5: Reviewer-facing data must exclude citizen identity fields at the API layer.
- FR-6: Each grievance, once a Session VC is issued, is treated as immutable. Post-issuance corrections (e.g., category override) are recorded as separate, linked records — never as mutation of the signed payload.
- FR-7: Institutions are stored as seeded database records, not hardcoded in application code or frontend. Adding an institution requires no code change.
- FR-8: Employees may only access grievances where `grievance.institution_id == employee.institution_id`, enforced server-side.
- FR-9: Citizens may only access their own grievances, enforced server-side.
- FR-10: Follow-up grievances are new, separate, atomic records linked via `related_grievance_id` — never edits to a prior signed record.

---

## 6. Non-Functional Requirements

- NFR-1 (Offline/air-gapped): The entire system — frontend, backend, ASR service, database, model inference — must run with no internet connectivity at runtime. Model weight downloads (HuggingFace pulls for WhisperX/MoulSot) are a documented one-time setup step requiring internet; all subsequent operation is offline. No CDN-hosted fonts, scripts, or assets; everything bundled at build time.
- NFR-2 (Local-only AI): No external/cloud AI APIs at any stage. All inference (ASR, diarization, categorization) runs on local or local-network infrastructure.
- NFR-3 (Security): Passwords hashed (bcrypt/argon2). Sessions via signed JWT or server-side session store. Role and institution scoping enforced at the API/authorization layer, never only in the UI. Rate limiting on auth endpoints.
- NFR-4 (Portability): ASR pipeline runs behind a stable HTTP API contract so it can move between CPU (dev laptop) and GPU (DIL lab machine) without changing platform code — config/deployment change only.
- NFR-5 (Auditability): Routing decisions (AI suggestion, Reviewer action, Admin reroute) are logged with actor, timestamp, and reason where applicable.
- NFR-6 (Extensibility): Institution set, categorization taxonomy, and ASR model versions must be swappable without redeploying the platform backend.

---

## 7. System Architecture

**Pattern:** Layered, service-oriented client-server architecture. Three independently deployable services behind clean API boundaries, not a monolith.

```
┌─────────────────────────────────────────────┐
│  Frontend (React + Vite, static bundle)      │
│  Citizen / Reviewer / Employee / Admin views │
└───────────────────┬───────────────────────────┘
                     │ HTTPS (local network)
┌────────────────────▼──────────────────────────┐
│  Platform Backend (Node.js + Express)         │
│  - Auth, sessions, RBAC + institution scoping │
│  - Grievance/Institution/User CRUD            │
│  - Orchestrates pipeline calls                │
│  - Postgres data access                       │
└──────┬─────────────────────────┬──────────────┘
       │                         │
┌──────▼──────────────┐  ┌───────▼─────────────────┐
│ ASR Service          │  │ Identity Service (later) │
│ (Python + FastAPI)    │  │ Inji Certify / eSignet   │
│ WhisperX + MoulSot    │  │ OpenID4VP, Consent VC,   │
│ + diarization         │  │ Session VC issuance      │
│ Runs on CPU now,       │  └──────────────────────────┘
│ GPU later — same API  │
└────────────────────────┘
                     │
              ┌──────▼──────┐
              │  PostgreSQL  │
              └─────────────┘
```

**Why layered + service-oriented, not monolithic:** the ASR pipeline is the system's heaviest, fastest-changing component (active fine-tuning, model swaps, eventual GPU migration). Isolating it behind a stable HTTP contract means platform code never changes when the ASR team improves their models — only the service behind the contract changes. The same logic applies to the identity layer, which will be developed and integrated last per team sequencing.

---

## 8. Authorization Model (Critical)

The single highest-risk failure mode in this system is cross-institution or cross-citizen data leakage via client-controlled scoping. Concretely:

- `GET /grievances` for an Employee must derive `institution_id` from the authenticated session token — **never** from a query parameter the client supplies. A naive implementation that trusts `?institution_id=X` from the client lets any employee read another institution's citizen data by changing the parameter.
- `GET /grievances/:id` for a Citizen must check `grievance.citizen_id == session.user_id` before returning data.
- Reviewer-facing endpoints must omit citizen identity fields from the response payload entirely — not merely hide them in the frontend. If the API returns the field, it is not de-identified, regardless of what the UI displays.

This is treated as a citable research observation: naive RBAC implementations leak cross-institution or cross-citizen data through client-controlled scoping parameters; correct implementations derive all scoping from server-side session state.

---

## 9. Data Model

**User**
`id, role [citizen|reviewer|employee|admin], institution_id [nullable; set for employee only], email, password_hash, created_at`

**Institution**
`id, name, category [health|transport|municipality|education|justice|utilities|social_protection], is_default_for_category [bool], created_at`
Seeded via version-controlled seed file (`institutions.seed.json`), not hardcoded. Adding institutions = adding seed rows, no code change.

**Grievance**
`id, citizen_id, status [submitted|transcribed|categorized|pending_review|routed|resolved], institution_id [nullable until routed], related_grievance_id [nullable, follow-ups], flag_reason [nullable: low_confidence|manual_override|other], created_at`

**AudioSession**
`id, grievance_id, audio_file_ref, raw_transcript, diarized_transcript, speaker_segments [JSON], created_at`

**CaseFile**
`id, grievance_id, category, urgency, suggested_institution_id, summary, confidence_score, human_review_flag`

**GrievanceNote**
`id, grievance_id, author_id, text, created_at`

**CategoryOverride**
`id, grievance_id, requested_by, old_category, new_category, reason, created_at`
(Does not mutate CaseFile or SessionVC — additive record only, per FR-6.)

**ConsentVC**
`id, citizen_id, grievance_id, vc_payload, issued_at`

**SessionVC**
`id, grievance_id, transcript_hash, participant_id_hashes, category, signature, issued_at`
Immutable once issued. Represents "this transcript and this category, as attested at issuance time" — not a live-updating record.

---

## 10. API Surface

### Auth
- `POST /auth/register` (citizen self-registration only)
- `POST /auth/login`
- `POST /auth/logout`

### Citizen
- `POST /grievances` (audio upload or in-browser recording blob)
- `GET /grievances/mine`
- `GET /grievances/:id` (own only — server-enforced)
- `POST /grievances/:id/followup`

### Reviewer
- `GET /grievances?status=pending_review` (sorted by ascending confidence)
- `GET /grievances/:id` (citizen identity fields excluded)
- `POST /grievances/:id/approve-routing`
- `POST /grievances/:id/correct-routing`
- `POST /grievances/:id/reject`

### Employee
- `GET /grievances` (institution derived server-side from session)
- `GET /grievances/:id`
- `PATCH /grievances/:id/status`
- `POST /grievances/:id/notes`
- `POST /grievances/:id/flag`
- `POST /grievances/:id/override-category`

### Admin
- `GET /grievances` (cross-institution, filterable)
- `POST /employees`, `DELETE /employees/:id`
- `PATCH /grievances/:id/reroute`
- `GET /stats`

### Internal: Platform → ASR Service (not exposed to frontend)
- `POST /transcribe` → `{raw_transcript, diarized_transcript, speaker_segments, confidence}`
- `POST /categorize` → `{category, urgency, suggested_institution, summary, confidence_score}`

### Internal: Platform → Identity Service (later phase)
- `POST /vc/consent`
- `POST /vc/session`

---

## 11. Grievance Status Lifecycle

```
submitted → transcribed → categorized → pending_review → routed → resolved
                                              │
                                        (Reviewer may reject →
                                         back to transcribed/categorized
                                         for reprocessing)
```

`flag_reason` distinguishes *why* a grievance needed attention: `low_confidence` (model uncertainty) vs. `manual_override` (human disagreement) vs. `other` — kept distinct because it's measurable data on how often human review catches what the model missed.

---

## 12. Technology Stack

| Layer | Choice | Reason |
|---|---|---|
| Frontend | React + Vite | Standard, fast to build; framework choice does not affect backend security/seriousness — implementation discipline does |
| Platform backend | Node.js + Express | Matches team's existing MedAxis experience; sufficient for this scale (research prototype, not high-traffic production) |
| ASR/ML service | Python + FastAPI | Matches existing ASR scripts/libraries (WhisperX, MoulSot/qwen-asr, Pyannote, Silero VAD); Pydantic gives free request/response validation |
| Database | PostgreSQL | Required later for Inji Certify's Postgres Data Provider Plugin anyway — standardize now, avoid a later migration from SQLite |
| Identity/Trust | MOSIP, Inji Certify, Inji Wallet, eSignet (OpenID4VP) | Per Ilyass's prior MedAxis experience; integrated last per team sequencing |
| Containerization | Docker Compose | Matches Inji Certify's existing deployment pattern; consistent across dev machines |
| Frontend build constraint | All assets bundled at build time; no CDN runtime dependencies | Required for air-gapped operation (NFR-1) |

---

## 13. Explicit Open Items (Deferred, Not Forgotten)

- Staffing/operational framing of the Reviewer role beyond the prototype (DIL-internal QA function vs. template for a future government triage office) — leans toward the latter per team decision, full operational design out of scope for six-week build.
- Multi-office routing granularity within a single category (e.g., multiple Health institutions) — prototype scope is category-level routing with a default institution per category; office-level geographic routing is future work.
- Fine-tuning data pipeline for MoulSot (held-out test set, domain match between training clips and real grievance speech, licensing review for YouTube-sourced audio) — owned by Mohammed/team, tracked separately.
- Whether eSignet/Inji Certify's OIDC discovery flow has any non-local dependency that would break under true air-gap — to be verified during identity layer integration, not assumed solved.

---

## 14. Document Provenance

Built from team architecture discussions covering: ASR pipeline experimentation (Section "All Transcription Results" in original project context), team role definitions, actor/use-case/data-model design conversation, and explicit team decisions on Reviewer role framing, de-identification, and offline/air-gap requirements. This document supersedes informal notes; update it as decisions change rather than letting drift accumulate across chat threads.