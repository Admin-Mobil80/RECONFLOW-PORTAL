/**
 * Calls to the portal API, served from this site's own hostname at /api/*.
 *
 * Every request carries the signed-in user's ID token as x-id-token (not
 * Authorization: CloudFront replaces that header with its own signature for
 * the function URL). POSTs also carry the body's SHA-256, which that signature
 * covers.
 */

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function api<T>(
  path: string,
  idToken: string | null,
  init: { method?: "GET" | "POST"; body?: unknown } = {},
): Promise<T> {
  const method = init.method ?? "GET";
  const headers: Record<string, string> = { accept: "application/json" };
  if (idToken) headers["x-id-token"] = idToken;

  let body: string | undefined;
  if (init.body !== undefined) {
    body = JSON.stringify(init.body);
    headers["content-type"] = "application/json";
    headers["x-amz-content-sha256"] = await sha256Hex(body);
  }

  const response = await fetch(`/api${path}`, { method, headers, body });
  const payload = (await response.json().catch(() => ({}))) as { error?: string } & T;
  if (!response.ok) throw new ApiError(payload.error ?? `Request failed (${response.status})`, response.status);
  return payload;
}

// --- shapes returned by the API ---------------------------------------------------

export interface Money {
  readonly amount: number;
  readonly currency: string;
}

export interface Decision {
  readonly caseId: string;
  readonly action: string;
  readonly actionLabel: string;
  readonly classification?: string;
  readonly note: string;
  readonly decidedBy: string;
  readonly decidedByName?: string;
  readonly at: string;
}

export interface CaseSummary {
  readonly caseId: string;
  readonly supplier: string;
  readonly reason: string;
  readonly amount: Money;
  readonly amountInBase?: Money;
  readonly issuedDate: string;
  readonly readiness: "ready" | "not-ready";
  readonly classification: string;
  readonly classificationLabel: string;
  readonly confidence: number;
  readonly exceptions: number;
  readonly blockingExceptions: number;
  readonly stage: string;
  readonly stageLabel: string;
  readonly stale: boolean;
  readonly businessDaysInStage: number;
  readonly latestDecision?: Decision;
}

export interface ReadinessCheck {
  readonly id: string;
  readonly label: string;
  readonly passed: boolean;
  readonly detail: string;
  readonly evidence: readonly string[];
}

export interface ClassificationSignal {
  readonly id: string;
  readonly label: string;
  readonly weight: number;
  readonly satisfied: boolean;
  readonly detail: string;
}

export interface CaseException {
  readonly id: string;
  readonly severity: "info" | "warning" | "blocking";
  readonly title: string;
  readonly detail: string;
  readonly actionRequired: string;
  readonly evidence: readonly string[];
}

export interface FxRate {
  readonly currency: string;
  readonly rateToBase: number;
  readonly asOf: string;
  readonly provider: string;
}

export interface Assessment {
  readonly caseId: string;
  readonly assessedAt: string;
  readonly readiness: { readonly verdict: "ready" | "not-ready"; readonly checks: readonly ReadinessCheck[] };
  readonly classification: {
    readonly classification: string;
    readonly label: string;
    readonly confidence: number;
    readonly rule: string;
    readonly signals: readonly ClassificationSignal[];
  };
  readonly exceptions: readonly CaseException[];
  readonly lifecycle: {
    readonly stage: string;
    readonly stageLabel: string;
    readonly enteredAt: string;
    readonly businessDaysInStage: number;
    readonly stale: boolean;
    readonly escalation?: string;
  };
  readonly summaryFacts: readonly string[];
  readonly fx: { readonly base: string; readonly rates: Readonly<Record<string, FxRate>> };
}

export interface EvidenceItem {
  readonly role: string;
  readonly sourceId: string;
  readonly recordType: string;
  readonly recordId: string;
  readonly updatedAt: string;
  readonly attributes: Readonly<Record<string, unknown>>;
}

export interface DocumentLink {
  readonly documentId: string;
  readonly kind: string;
  readonly title: string;
  readonly contentType: string;
  readonly uploadedAt: string;
  readonly url: string;
}

export interface CaseDetail {
  readonly assessment: Assessment;
  readonly evidence: { readonly items: readonly EvidenceItem[]; readonly documents: readonly DocumentLink[] };
  readonly decisions: readonly Decision[];
  readonly narrative: { readonly summary: string; readonly source: "openai" | "deterministic"; readonly model?: string };
  readonly decisionActions: Readonly<Record<string, string>>;
  readonly classifications: Readonly<Record<string, string>>;
}

export function money(m: Money): string {
  return `${m.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${m.currency}`;
}

export function day(iso: string): string {
  return iso.slice(0, 10);
}
