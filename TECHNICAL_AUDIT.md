# GRRK — Technical Audit
Prepared by: Technical Lead review
Scope: Full repository (108 source files), post Version 1.0 MVP + mobile-first shell
Audit basis: full read of every source file, offline TypeScript build verification, static security/scalability scans

---

## 0. Build Status

**Cannot run a real `npm install`/`npm run build`** — this environment has no network access to the npm registry (confirmed: registry requests return `403`). This has been true and disclosed since Stage 0.

What I *can* and did verify, as the closest available substitute:
- Extracted every `.ts`/`.tsx` file and ran it through the real TypeScript compiler (offline, with ambient shims standing in for the not-installed npm packages) to catch structural errors: **zero real errors** — the only diagnostics are artifacts of the shim itself (untyped `react`/`dexie` stand-ins), all individually traced and reproducible.
- Cross-checked every i18n key referenced in code against both locale files: **all resolve**.
- Static scans for common vulnerability patterns (below).

**This is not a substitute for a real build.** A real `npm install && npm run build` is the first thing that should happen next, on a machine with registry access, before this is trusted further. Given the size of the dependency tree (React, Vite, Dexie, i18next, Zod, React Hook Form, Tailwind), it is realistic that a real build surfaces something my offline method structurally cannot see — a version incompatibility, a Tailwind class purge issue, or a bundler-specific edge case.

---

## 1. Architecture Summary (as-built, verified against code)

Repository-First data layer (IndexedDB via Dexie) → Universal Entity Engine (schema-driven List/Form/Detail) → Document Engine (registry-driven, generic across entity types) → Compliance/Notification Engines (Master-Data-driven thresholds) → Reporting Engine → mobile-first UI shell. This matches the documented Blueprint. No drift found between what's documented and what's built — the architecture docs are trustworthy.

**Genuine strengths:**
- The generic-engine pattern actually holds up: Employee is the only entity with UI, but Document/Compliance/Timeline/Search all operate on `entityType` generically and were verified to contain no Employee-specific branching.
- Every business threshold (expiry windows, score weights, required documents) is a Master Data row, not a constant — verified by code inspection, not just by comment claims.
- Audit trail is automatic and unbypassable (repository-level interceptor), including for the newer attachment-preview `view` action.

---

## 2. Security Review

| Finding | Severity | Detail |
|---|---|---|
| No real authentication | **Critical** | `currentUser()` is a hardcoded stub, always returns the same "system-user". Anyone with the URL has full access to everything. Acceptable for an internal single-user MVP demo; **not acceptable** for the stated real users (external company reps, contractors) without this being fixed first. |
| No authorization enforcement | **Critical** | `Role.permissions: string[]` exists as a type but is checked **nowhere** in the codebase (confirmed via full-text search). Every repository call succeeds unconditionally regardless of role. |
| Attachment preview trusts browser-reported MIME type | **Medium** | `AttachmentPreviewDialog` renders an `<iframe src={blobUrl}>` when `file.type === "application/pdf"`. `file.type` is inferred by the browser from the filename/OS, not verified against actual file bytes — a renamed malicious file could report as a PDF. The iframe also has **no `sandbox` attribute**. Modern browsers' built-in PDF viewers are reasonably hardened, but this is unverified defense-in-depth, not a proven safe boundary. |
| No secrets, no `eval`/`dangerouslySetInnerHTML`, no raw `localStorage` usage | ✅ Pass | Full-text scans clean across the repository. |
| Data at rest is unencrypted browser storage | Low (documented, by design) | IndexedDB, single-browser. Acceptable for the current single-device model; becomes a real question once real people's National ID/Iqama numbers are involved in a shared/multi-device deployment. |

**Bottom line: this build should not be exposed to real external users (contractors, company reps) over the internet as-is.** It is safe for internal, trusted, single-user evaluation only, exactly as it's being used today.

---

## 3. Scalability Review

| Finding | Severity | Detail |
|---|---|---|
| Compliance scoring re-fetches shared data per employee | **Medium** | `computeOverallComplianceScore()` calls `computeEntityComplianceScore()` once per employee; each call independently re-queries Master Data thresholds and documents rather than sharing one fetch across the batch. Confirmed 9 separate repository-list call sites inside `ComplianceRuleEngine.ts`. At current scale (a handful of employees) this is invisible. At a few hundred employees, the Compliance Center and Dashboard will visibly slow down — this is an `O(n)` fan-out of IndexedDB round-trips, not an algorithmic problem, so it's a cheap fix (batch-fetch once, compute in memory) when it becomes worth doing. |
| Hardcoded `pageSize: 100` on every entity list, no real pagination | **Medium** | Confirmed in `EntityListPage.tsx`. Fine for one GR office's headcount; the 101st employee silently doesn't appear in the list today. |
| Single-browser storage (IndexedDB) | Low (documented, architectural) | No multi-device sync. This is the single biggest reason "scalability" beyond one browser requires the already-planned Supabase migration — not a bug, a known phase boundary. |

---

## 4. Maintainability Review

- **Strength:** every non-obvious decision has an inline comment citing the source document/section that justifies it — this is unusually well-documented for a codebase this size, and it held up under this audit (I checked several claims against the actual referenced business rules doc and they were accurate).
- **One flagged, deliberate layering exception:** `services/rules/ComplianceRuleEngine.ts` imports `modules/documents/documentTypeRegistry.ts` — a `services/` file depending on a `modules/` file, backwards from normal layering. This was a conscious tradeoff (avoiding duplicating the entity↔document-type mapping) and is commented as such, not accidental. Still genuine technical debt — see roadmap.
- **Dead code:** none found in this audit. The previous MVP pass already removed the two orphaned Toast files and the stale placeholder widget; nothing new has accumulated since.
- **Test coverage is thin.** Only `ComplianceRuleEngine` (tier/score logic) and `textNormalization` have unit tests. The repository layer, notification reconciliation logic, and cascade-delete are entirely untested — these are exactly the places a regression would be expensive and hard to notice.

---

## 5. Accessibility Review

- Keyboard navigation, focus-visible rings, and translated `aria-label`s are consistently present on interactive elements (verified by grep across Dialog, buttons, form fields) — this was a deliberate pass in an earlier stage and it held up.
- **Not verified: actual screen-reader behavior.** I can confirm markup patterns (roles, labels, live regions on toasts) are present, but I have no way to run a real screen reader in this environment. This should be manually tested with VoiceOver (iPhone) and TalkBack (Android) before calling accessibility "done" — those are exactly your two target platforms.
- Color contrast was designed against reasonable defaults (status colors, text tokens) but was never run through an automated contrast checker.

---

## 6. Mobile UX Review

- The shell (bottom tab bar, sidebar-on-desktop) is genuinely mobile-first now, not a shrunk desktop layout.
- Forms, tables, and the Document/Attachment panels all use responsive grid classes that collapse to one column below `sm` — verified by inspection across Employee, Document, Compliance, and Notification screens.
- **Untested claim:** none of this has been seen on an actual Android/iPhone screen by anyone (including me — I cannot render a browser with network access here). The responsive classes are correct by inspection; real-device testing (tap target size in practice, iOS Safari's viewport quirks, Android keyboard covering inputs) is still outstanding.

---

## 7. Technical Debt Inventory (concrete, not vague)

1. No authentication/authorization enforcement (Critical — Section 2).
2. Attachment preview iframe lacks `sandbox` attribute and trusts client-reported MIME type (Medium — Section 2).
3. Compliance scoring fan-out causes redundant repository fetches (Medium — Section 3).
4. No real pagination past 100 records per entity type (Medium — Section 3).
5. `ComplianceRuleEngine` → `documentTypeRegistry` layering exception (Low-Medium — Section 4, already documented in code).
6. Thin test coverage outside compliance scoring (Medium — Section 4).
7. PDF/Excel report export are still placeholder stubs that throw (Low — known and surfaced honestly in the UI since the last pass).
8. Real device/screen-reader testing never performed (Medium — Sections 5–6).

---

## 8. Prioritized Roadmap

**Before any real (non-internal) users touch this:**
1. Real authentication + role enforcement — everything else is secondary to this.
2. Iframe sandboxing + basic file-type verification on attachment upload.

**Before scaling past one small office:**
3. Batch-fetch fix in `ComplianceRuleEngine` (cheap, isolated, no architecture change).
4. Real pagination on entity lists.

**Quality-of-life, can happen anytime:**
5. Real device testing pass (Android Chrome + iOS Safari) with a punch-list of fixes.
6. Expand test coverage to repositories and notification reconciliation.
7. PDF/Excel export implementation.

**Longer-term (matches the already-approved Blueprint, not new scope):**
8. Supabase/cloud migration — this is also what makes real auth and multi-device use possible, so items 1 and 8 are related; a lightweight auth stub-to-real swap doesn't strictly require the full migration, but the two should be planned together.

---

## 9. Architecture Improvement Suggestions

- **Resolve the layering exception** (#5) by moving `documentTypeRegistry.ts` from `modules/documents` into `services/documents` — a pure relocation, no behavior change, removes the one documented "backwards" dependency.
- **Introduce a batch compliance-evaluation pass**: one function that fetches all documents/master-data/employees ONCE and computes every employee's score from that shared snapshot, replacing the current per-employee fan-out. Same public API, internal-only change.
- **No other structural changes recommended.** The engine architecture (Repository-First, Universal Entity Engine, generic Document/Compliance engines) is sound and has now been stress-tested across four feature stages without needing a rewrite — that's the strongest evidence it was the right design.

---

## Summary

The architecture is solid and matches its documentation. The build is clean by every offline check available to me. The debt is real but small, specific, and mostly isolated (not systemic). The one finding that actually matters before wider use is authentication — everything else is either already known/documented or cheap to fix when it becomes worth doing.

**Waiting for your review and approval before any further changes.**
