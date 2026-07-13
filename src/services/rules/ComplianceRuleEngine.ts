import { documentRepository, masterDataRepository, personRepository } from "@/services/data/repositories";
import { daysBetween, isPast } from "@/shared/utils/dateUtils";
import { normalizeSearchText } from "@/shared/utils/textNormalization";
import { MasterDataCategory } from "@/modules/master-data/masterDataCategories";
import { getApplicableDocumentTypes } from "@/modules/documents/documentTypeRegistry";
import type { DocumentStatus } from "@/design-system/primitives/StatusBadge";
import type { DocumentRecord, EntityType, MasterDataRecord, Person } from "@/types/entities";

/**
 * Compliance Rule Engine (Roadmap Phase 3). A plain service (no React) so
 * both UI components and the Notification Engine's rule evaluator (which
 * runs outside any component tree) call the same functions — one
 * implementation of every rule, never two.
 *
 * Per Standard 17.5 (Master-Data-Driven Business Rules): every threshold
 * and weight below is read from a Master Data record — thresholds/weights
 * are only ever hardcoded here as the SEED DEFAULT's fallback, used solely
 * when an administrator hasn't overridden it via the Configuration Center.
 *
 * Layering note: this file imports `getApplicableDocumentTypes` from
 * `modules/documents/documentTypeRegistry`. That registry is UI-adjacent
 * config (Stage 2), and services normally shouldn't reach into `modules/`.
 * It's done here anyway, deliberately, because the alternative — a second
 * copy of "which document types apply to which entity" living inside
 * `services/rules` — would violate "never duplicate business data" far
 * more seriously than this one intentional upward import. If this ever
 * needs to be undone, the fix is moving the registry itself into
 * `services/documents/`, not duplicating it.
 */

const DEFAULT_EXPIRY_WARNING_DAYS = 90;

async function readThresholdValue(code: string, fallback: number): Promise<number> {
  const { items } = await masterDataRepository.list({
    filters: { category: MasterDataCategory.COMPLIANCE_THRESHOLD, code },
  });
  const raw = items[0]?.metadata?.value;
  return typeof raw === "number" ? raw : fallback;
}

export async function getDocumentExpiryWarningDays(): Promise<number> {
  return readThresholdValue("documentExpiryWarningDays", DEFAULT_EXPIRY_WARNING_DAYS);
}

export function computeDocumentStatus(
  expiryDateIso: string,
  warningDays: number,
  referenceDate: Date = new Date()
): DocumentStatus {
  const expiry = new Date(expiryDateIso);
  if (isPast(expiry, referenceDate)) return "expired";
  const daysRemaining = daysBetween(referenceDate, expiry);
  if (daysRemaining <= warningDays) return "expiringSoon";
  return "valid";
}

/** Restricted-profession detection (05_BUSINESS_RULES + Blueprint Section
 *  10 / Standard 17.5 reconciliation): the Master Data record's
 *  `metadata.isRestricted` flag is the AUTHORITATIVE signal that drives
 *  compliance — never inferred silently from a document's own fields. */
export function isProfessionRestricted(profession?: MasterDataRecord): boolean {
  return Boolean(profession?.metadata?.isRestricted);
}

const advisoryRestrictedKeywords = ["worker", "عامل"];

/** ADVISORY ONLY (per the reconciliation in the Implementation Blueprint,
 *  Section 10): a keyword match never changes compliance status by itself.
 *  It exists so an administrator reviewing a new profession in the
 *  Configuration Center can be prompted to consider flagging it — it must
 *  never be treated as equivalent to `isProfessionRestricted`. */
export function suggestsRestrictedProfession(labelAr: string, labelEn: string): boolean {
  const normalized = normalizeSearchText(`${labelAr} ${labelEn}`);
  return advisoryRestrictedKeywords.some((keyword) => normalized.includes(normalizeSearchText(keyword)));
}

export interface ComplianceSnapshot {
  valid: number;
  expiringSoon: number;
  expired: number;
}

/** Platform-wide document compliance counts (Green/Orange/Red only) —
 *  feeds the Dashboard's original Compliance Snapshot widget (Stage 1).
 *  Kept alongside the richer `computeExpiryBands` below (Stage 3) rather
 *  than replaced, so nothing that already reads this shape breaks. */
export async function computeComplianceSnapshot(): Promise<ComplianceSnapshot> {
  const [{ items: documents }, warningDays] = await Promise.all([
    documentRepository.list({ filters: { isActive: true } }),
    getDocumentExpiryWarningDays(),
  ]);

  const snapshot: ComplianceSnapshot = { valid: 0, expiringSoon: 0, expired: 0 };
  for (const document of documents) {
    const status = computeDocumentStatus(document.expiryDate, warningDays);
    if (status === "valid" || status === "expiringSoon" || status === "expired") {
      snapshot[status] += 1;
    }
  }
  return snapshot;
}

// ---------------------------------------------------------------------------
// Stage 3 — tiered expiry (30/60/90-day), compliance scoring, missing
// documents, duplicate records.
// ---------------------------------------------------------------------------

export interface ComplianceThresholds {
  /** Same threshold that drives the status badge (Green/Orange/Red) — the
   *  widest, earliest-warning tier. */
  days90: number;
  days60: number;
  days30: number;
}

/** 05_BUSINESS_RULES "Notification Rules": Expired / 30-Day / 60-Day /
 *  90-Day Expiry are each independently configurable. */
export async function getComplianceThresholds(): Promise<ComplianceThresholds> {
  const [days90, days60, days30] = await Promise.all([
    readThresholdValue("documentExpiryWarningDays", 90),
    readThresholdValue("documentExpiryNotify60Days", 60),
    readThresholdValue("documentExpiryNotify30Days", 30),
  ]);
  return { days90, days60, days30 };
}

export type ExpiryTier = "expired" | "critical30" | "warning60" | "notice90" | "none";

/** The escalating tier a document currently sits in — drives which
 *  notification category fires (see documentExpiryNotificationRule) and
 *  which cumulative band it counts toward on the Compliance Dashboard. */
export function computeExpiryTier(
  expiryDateIso: string,
  thresholds: ComplianceThresholds,
  referenceDate: Date = new Date()
): ExpiryTier {
  const expiry = new Date(expiryDateIso);
  if (isPast(expiry, referenceDate)) return "expired";
  const daysRemaining = daysBetween(referenceDate, expiry);
  if (daysRemaining <= thresholds.days30) return "critical30";
  if (daysRemaining <= thresholds.days60) return "warning60";
  if (daysRemaining <= thresholds.days90) return "notice90";
  return "none";
}

export interface ExpiryBands {
  valid: number;
  within90Days: number; // cumulative — includes within60Days and within30Days
  within60Days: number; // cumulative — includes within30Days
  within30Days: number;
  expired: number;
}

/** Cumulative "expiring within N days" bands (Executive Reporting doc:
 *  "Documents Expiring in: 30 Days / 60 Days / 90 Days" as escalating
 *  funnel line items) — feeds the Compliance Dashboard, distinct from the
 *  simpler 3-color `computeComplianceSnapshot` used on the main Dashboard. */
export async function computeExpiryBands(): Promise<ExpiryBands> {
  const [{ items: documents }, thresholds] = await Promise.all([
    documentRepository.list({ filters: { isActive: true } }),
    getComplianceThresholds(),
  ]);

  const bands: ExpiryBands = { valid: 0, within90Days: 0, within60Days: 0, within30Days: 0, expired: 0 };
  for (const document of documents) {
    const tier = computeExpiryTier(document.expiryDate, thresholds);
    if (tier === "expired") {
      bands.expired += 1;
      continue;
    }
    if (tier === "none") {
      bands.valid += 1;
      continue;
    }
    bands.within90Days += 1;
    if (tier === "warning60" || tier === "critical30") bands.within60Days += 1;
    if (tier === "critical30") bands.within30Days += 1;
  }
  return bands;
}

/** Master Data category `requiredDocumentType` (17.5/17.10): a row's
 *  `code` marks that document type as required wherever the Document Type
 *  Registry says it's applicable. Admin-editable, never hardcoded here. */
export async function getRequiredDocumentTypeCodes(): Promise<Set<string>> {
  const { items } = await masterDataRepository.list({
    filters: { category: MasterDataCategory.REQUIRED_DOCUMENT_TYPE, isActive: true },
  });
  return new Set(items.map((record) => record.code));
}

/** Missing Document detection (05_BUSINESS_RULES "Missing Document
 *  Detection"). Generic across entity types: it only needs to know which
 *  document type CODES are applicable to this entity (from the Document
 *  Type Registry) and which of those are marked required (Master Data) —
 *  it never branches on "employee" vs. anything else. */
export async function detectMissingDocumentTypeCodes(entityType: EntityType, entityId: string): Promise<string[]> {
  const [requiredCodes, { items: docTypeRecords }, { items: documents }] = await Promise.all([
    getRequiredDocumentTypeCodes(),
    masterDataRepository.list({ filters: { category: MasterDataCategory.DOCUMENT_TYPE } }),
    documentRepository.list({ filters: { entityType, entityId, isActive: true } }),
  ]);

  const applicableCodes = getApplicableDocumentTypes(entityType).map((definition) => definition.code);
  const requiredApplicableCodes = applicableCodes.filter((code) => requiredCodes.has(code));

  const codeByMasterDataId = new Map(docTypeRecords.map((record) => [record.id, record.code]));
  const presentCodes = new Set(
    documents
      .map((document) => codeByMasterDataId.get(document.documentTypeMasterDataId))
      .filter((code): code is string => Boolean(code))
  );

  return requiredApplicableCodes.filter((code) => !presentCodes.has(code));
}

/** Duplicate Record detection (05_BUSINESS_RULES "Duplicate Record
 *  Detection"). National ID uniqueness is already enforced at entry time
 *  (ValidationEngine.isNationalIdUnique) — this is the ongoing COMPLIANCE
 *  check that catches anything that got in another way (e.g. a future
 *  bulk import), grouped for reporting/notification. */
export async function detectDuplicateNationalIds(): Promise<Map<string, Person[]>> {
  const { items: persons } = await personRepository.list({ filters: { isActive: true } });
  const byNationalId = new Map<string, Person[]>();
  for (const person of persons) {
    const group = byNationalId.get(person.nationalId) ?? [];
    group.push(person);
    byNationalId.set(person.nationalId, group);
  }
  for (const [nationalId, group] of byNationalId) {
    if (group.length < 2) byNationalId.delete(nationalId);
  }
  return byNationalId;
}

export interface ComplianceScoreWeights {
  expiredDocument: number;
  missingDocument: number;
  restrictedProfession: number;
}

/** Compliance scoring weights (Blueprint Standard 17.5 explicitly names
 *  "compliance scoring weights" as Master-Data-driven). Defaults below are
 *  a reasonable starting point, not a claimed industry standard — an
 *  administrator can retune them without a code change. */
export async function getComplianceScoreWeights(): Promise<ComplianceScoreWeights> {
  const [expiredDocument, missingDocument, restrictedProfession] = await Promise.all([
    readThresholdValue("scoreWeightExpiredDocument", 15),
    readThresholdValue("scoreWeightMissingDocument", 10),
    readThresholdValue("scoreWeightRestrictedProfession", 20),
  ]);
  return { expiredDocument, missingDocument, restrictedProfession };
}

/** Per-entity Compliance Score (0–100): starts at 100, loses points for
 *  each expired document, each missing required document, and (for
 *  employees) an unmitigated restricted profession. Generic over entity
 *  type — the profession penalty simply doesn't apply to entity types that
 *  have no profession field. */
export async function computeEntityComplianceScore(
  entityType: EntityType,
  entityId: string,
  weights?: ComplianceScoreWeights
): Promise<number> {
  const w = weights ?? (await getComplianceScoreWeights());
  const [documentsResult, thresholds, missingCodes] = await Promise.all([
    documentRepository.list({ filters: { entityType, entityId, isActive: true } }),
    getComplianceThresholds(),
    detectMissingDocumentTypeCodes(entityType, entityId),
  ]);

  let score = 100;
  const expiredCount = documentsResult.items.filter(
    (document: DocumentRecord) => computeExpiryTier(document.expiryDate, thresholds) === "expired"
  ).length;
  score -= expiredCount * w.expiredDocument;
  score -= missingCodes.length * w.missingDocument;

  if (entityType === "employee") {
    const person = await personRepository.getById(entityId);
    if (person?.professionMasterDataId) {
      const profession = await masterDataRepository.getById(person.professionMasterDataId);
      if (isProfessionRestricted(profession)) score -= w.restrictedProfession;
    }
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

/** Platform-wide Compliance Score: the average of every employee's score
 *  (Executive Reporting doc "Overall Compliance %"). Averaged rather than
 *  summed so the score stays a 0–100 percentage regardless of headcount. */
export async function computeOverallComplianceScore(): Promise<number> {
  const weights = await getComplianceScoreWeights();
  const { items: employees } = await personRepository.list({ filters: { type: "employee", isActive: true } });
  if (employees.length === 0) return 100;

  const scores = await Promise.all(
    employees.map((employee) => computeEntityComplianceScore("employee", employee.id, weights))
  );
  const total = scores.reduce((sum, score) => sum + score, 0);
  return Math.round(total / employees.length);
}

export type ComplianceScoreTone = "neutral" | "good" | "warning" | "poor";

/** Shared score→meaning mapping (MVP cleanup: this exact ternary chain was
 *  copy-pasted across the Employee compliance section, the Dashboard
 *  widget, and the Compliance Center — one definition now). Returns a
 *  semantic tone, not a CSS class — see shared/utils/complianceScoreTone.ts
 *  for the presentational mapping, kept out of this business-logic file. */
export function getComplianceScoreTone(score: number | undefined): ComplianceScoreTone {
  if (score === undefined) return "neutral";
  if (score >= 80) return "good";
  if (score >= 50) return "warning";
  return "poor";
}
