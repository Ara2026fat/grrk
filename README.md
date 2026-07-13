# GRRK — Government Relations Intelligence Platform

**Status:** Version 1.0 MVP — Enterprise Foundation, Employee Management, generic Document Engine (incl. Attachment Preview), and Compliance/Notification Engine, polished and stabilized for real-world use. No new major modules beyond this scope; see the MVP completion report for known limitations and Version 2.0 recommendations.

## 1. Project Overview

GRRK is an enterprise Government Relations platform for managing people
(employees, contractors, visitors), companies, organizations, government
documents, compliance, notifications, reporting, and workflow — built to
Anthropic-internal-grade "GRRK Project Knowledge" specifications covering
vision, roadmap, design system, architecture, business rules, localization,
executive reporting, and QA standards.

This repository currently contains **Stage 0 + Stage 1**: the cross-cutting
enterprise foundation (design system, localization, data layer, and eight
engine frameworks) plus the first complete vertical slice — Employee
registration, National ID document management, compliance status,
notifications, the Universal Timeline, audit logging, and two exportable
reports — built per the approved [Implementation Blueprint](../10_IMPLEMENTATION_BLUEPRINT)
and its ratified architectural standards (Section 17.1–17.11). Contractor,
Visitor, Company, and Organization modules are not implemented yet — see
[`ARCHITECTURE.md`](./ARCHITECTURE.md) for exactly what is and isn't built.

## 2. Technology Stack

| Layer | Technology | Why |
|---|---|---|
| UI framework | React 18 + TypeScript | strict typing, component reuse |
| Build tool | Vite 5 | fast dev loop |
| Styling | Tailwind CSS 3 + a token file | one source of truth for color/spacing/type |
| Routing | react-router-dom 6 | standard, well-supported |
| Local data store | Dexie 4 (IndexedDB) | supports blobs (attachments/voice), scales past localStorage's 5MB cap |
| Localization | i18next / react-i18next | native RTL/LTR, no hardcoded strings |
| Forms & validation | React Hook Form + Zod | schema-driven, reusable validation |
| State | React context + component state (Stage 0 scope) | no global store needed yet |
| Testing | Vitest | fast, Vite-native |

Full rationale for each choice is in the Implementation Blueprint, Section 3.

## 3. Folder Structure

```
src/
  app/                   Shell, router, providers (Theme, Auth, i18n wiring)
  design-system/         Tokens, primitives (Button/Card/Table/...), theme (RTL/LTR)
  i18n/                  i18next bootstrap + ar/en resource files
  shared/                Cross-module components (SearchBox, Timeline, WidgetContainer), hooks, utils
  services/
    data/                IRepository contract, IndexedDB adapter, Dexie schema, concrete repos
    rules/               Validation Engine
    notifications/       Notification Engine + delivery-channel senders
    reporting/           Reporting Engine + export-format adapters
    audit/               Audit Engine (auto-invoked by every repository write)
    workflow/            Workflow Engine (definitions, instances, lifecycle)
    ai/                  AI-Ready service interfaces + no-op mocks
    logging/             Centralized logging (feeds System Health Center)
    search/               Centralized bilingual search
    health/                System Health Center data aggregation
    auth/                  AuthContext stub
    container.ts           Composition root — wires everything above together
  modules/
    entity-engine/         Universal Entity Engine (generic List/Form/Detail pages)
    master-data/            Master Data Engine (provider + category keys)
    configuration-center/   Configuration Center foundation shell
    system-health/           System Health Center foundation shell
    dashboard/               Widget registry + customizable dashboard shell
  types/entities.ts         Shared entity type contracts
  config/env.ts              Typed environment access
```

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for how these layers relate.

## 4. Installation

> **Note on this repository's origin:** this codebase was authored in a
> network-isolated sandbox and has **not yet been `npm install`-ed or
> compiled**. Do this first on a machine with npm registry access:

```bash
git clone <your-repo-url> grrk-app
cd grrk-app
npm install
```

Copy the environment template and adjust as needed:

```bash
cp .env.example .env.local
```

## 5. Running the Project

```bash
npm run dev
```

Starts the Vite dev server (default `http://localhost:5173`). The app
boots straight into the Dashboard shell; use the language toggle (AR/EN) in
the sidebar to confirm RTL/LTR switching.

## 6. Build Instructions

```bash
npm run build      # tsc -b (project-wide type check) + vite build
npm run preview    # serve the production build locally
npm run test        # run the Vitest suite
npm run lint         # ESLint
```

`npm run build` type-checks the **entire** project before bundling — a
type error anywhere fails the build by design (Development Guidelines:
"never break existing functionality").

## 7. Architecture Overview

GRRK Stage 0 is built around **Repository-First Architecture** (Blueprint
Standard 17.1): every module reads/writes data through an `IRepository<T>`
interface, never IndexedDB or localStorage directly. This is what makes
five entity types collapse into one **Universal Entity Engine** (17.3),
and what makes a future Supabase/Postgres backend a matter of writing new
adapter classes rather than rewriting the app.

Eight engine **frameworks** are wired up and ready for business rules in
later stages: Validation, Notification, Reporting, Audit, Workflow,
Configuration Center, System Health Center, and AI-Ready services (OCR,
Transcription, Summary, Intelligent Search, Predictive Compliance — each
backed by an honest no-op mock today).

For the full layered diagram (Mermaid), module relationships, and a
breakdown of what's a real implementation vs. a Stage 0 contract-only
placeholder, see **[`ARCHITECTURE.md`](./ARCHITECTURE.md)**.

## 8. Governance

Every file's header comment cites the Project Knowledge document or
Implementation Blueprint section that justifies its shape. Before changing
a file's structure, re-read that citation — Sections 17.1–17.11 of the
Blueprint are binding standards, not suggestions (see the Blueprint's
Governance Note).
