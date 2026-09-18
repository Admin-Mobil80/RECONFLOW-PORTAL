import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { api, ApiError, day, money, type CaseDetail as CaseDetailData, type EvidenceItem, type Money } from "../api";
import { useAuth } from "../auth/AuthContext";

const SOURCE_LABELS: Record<string, string> = {
  procurement: "Procurement system",
  disbursement: "Disbursement system",
  treasury: "Treasury",
  cashroom: "Cash Room",
};

const ROLE_LABELS: Record<string, string> = {
  "credit-note": "Credit note",
  invoice: "Invoice",
  contract: "Contract",
  "fund-source": "Fund source",
  "refund-voucher": "Refund voucher",
  "treasury-voucher-status": "Voucher status (Treasury)",
  "treasury-receipt": "Treasury receipt",
  "cashroom-receipt": "Cash Room deposit",
  "processing-outcome": "Processing outcome",
};

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "yes" : "no";
  if (typeof value === "number") return value.toLocaleString("en-US");
  if (Array.isArray(value)) return value.map(formatValue).join(", ");
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) return day(value);
  return String(value);
}

function EvidenceCard({ item }: { item: EvidenceItem }) {
  const entries = Object.entries(item.attributes).filter(([key]) => !key.endsWith("DocumentId") && key !== "documentId");
  return (
    <div className="evidence-card">
      <div className="evidence-head">
        <b>{ROLE_LABELS[item.role] ?? item.role}</b>
        <span className="tag">{item.recordId}</span>
      </div>
      <dl className="kv">
        {entries.map(([key, value]) => (
          <div key={key}>
            <dt>{key.replace(/([A-Z])/g, " $1").toLowerCase()}</dt>
            <dd>{formatValue(value)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function CaseDetail() {
  const { caseId = "" } = useParams();
  const { idToken, session } = useAuth();
  const [data, setData] = useState<CaseDetailData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState("accept");
  const [classification, setClassification] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await api<CaseDetailData>(`/cases/${encodeURIComponent(caseId)}`, idToken()));
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Could not load this case.");
    }
  }, [caseId, idToken]);

  useEffect(() => {
    void load();
  }, [load]);

  async function decide(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(null);
    try {
      await api(`/cases/${encodeURIComponent(caseId)}/decisions`, idToken(), {
        method: "POST",
        body: { action, classification: action === "override" ? classification : undefined, note },
      });
      setNote("");
      setSaved("Decision recorded.");
      await load();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Could not record the decision.");
    } finally {
      setSaving(false);
    }
  }

  if (error && !data) {
    return (
      <>
        <div className="page-head">
          <h2>{caseId}</h2>
        </div>
        <p className="form-error" role="alert">
          {error}
        </p>
        <p style={{ marginTop: "1rem" }}>
          <Link to="/app/cases">← All cases</Link>
        </p>
      </>
    );
  }
  if (!data) return <p className="count page-head">Assessing {caseId}…</p>;

  const { assessment: a, evidence, decisions, narrative } = data;
  const creditNote = evidence.items.find((i) => i.role === "credit-note")?.attributes as
    | { amount: number; currency: string; supplierId: string; issuedDate: string; reason: string }
    | undefined;
  const contract = evidence.items.find((i) => i.role === "contract")?.attributes as { supplierName?: string } | undefined;
  const amount: Money | undefined = creditNote ? { amount: creditNote.amount, currency: creditNote.currency } : undefined;
  const baseRate = amount && amount.currency !== a.fx.base ? a.fx.rates[amount.currency] : undefined;

  const bySource = new Map<string, EvidenceItem[]>();
  for (const item of evidence.items) bySource.set(item.sourceId, [...(bySource.get(item.sourceId) ?? []), item]);

  const blocking = a.exceptions.filter((e) => e.severity === "blocking").length;

  return (
    <>
      <p className="crumbs">
        <Link to="/app/cases">← All cases</Link>
      </p>
      <div className="page-head case-head">
        <div>
          <h2>{a.caseId}</h2>
          <p>
            {contract?.supplierName ?? creditNote?.supplierId}
            {creditNote && ` · issued ${day(creditNote.issuedDate)} · ${creditNote.reason}`}
          </p>
        </div>
        <div className="case-amount">
          {amount && <b>{money(amount)}</b>}
          {amount && baseRate && (
            <div className="muted small">
              ≈ {money({ amount: Math.round(amount.amount * baseRate.rateToBase * 100) / 100, currency: a.fx.base })} at 1{" "}
              {amount.currency} = {baseRate.rateToBase.toFixed(6)} {a.fx.base} ({baseRate.provider}, {day(baseRate.asOf)})
            </div>
          )}
        </div>
      </div>

      <div className="pill-row">
        <span className={`pill ${a.readiness.verdict === "ready" ? "pill-ok" : "pill-warn"}`}>
          {a.readiness.verdict === "ready" ? "Ready for processing" : "Not ready"}
        </span>
        <span className="pill">{a.classification.label} · {a.classification.confidence}%</span>
        {blocking > 0 && <span className="pill pill-bad">{blocking} blocking exception{blocking === 1 ? "" : "s"}</span>}
        <span className={`pill ${a.lifecycle.stale ? "pill-bad" : ""}`}>
          {a.lifecycle.stageLabel} · {a.lifecycle.businessDaysInStage} business day{a.lifecycle.businessDaysInStage === 1 ? "" : "s"}
          {a.lifecycle.stale && " · stale"}
        </span>
      </div>

      <div className="detail-grid">
        <div className="detail-main">
          <section className="card">
            <div className="section-title">
              <h3>Case summary</h3>
              <span className="tag">{narrative.source === "openai" ? `AI · ${narrative.model}` : "from the facts"}</span>
            </div>
            <p className="prose">{narrative.summary}</p>
          </section>

          <section className="card">
            <h3>Readiness</h3>
            <ul className="checks">
              {a.readiness.checks.map((c) => (
                <li key={c.id} className={c.passed ? "pass" : "fail"}>
                  <span className="check-mark" aria-hidden="true">
                    {c.passed ? "✓" : "✗"}
                  </span>
                  <div>
                    <b>{c.label}</b>
                    <div className="muted">{c.detail}</div>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="card">
            <div className="section-title">
              <h3>Recommended classification</h3>
              <span className="tag">{a.classification.confidence}% confidence</span>
            </div>
            <p className="classification-label">{a.classification.label}</p>
            <div className="bar" aria-hidden="true">
              <div style={{ width: `${a.classification.confidence}%` }} />
            </div>
            <p className="muted" style={{ marginTop: "0.75rem" }}>
              {a.classification.rule}
            </p>
            <ul className="checks compact">
              {a.classification.signals.map((s) => (
                <li key={s.id} className={s.satisfied ? "pass" : "fail"}>
                  <span className="check-mark" aria-hidden="true">
                    {s.satisfied ? "✓" : "✗"}
                  </span>
                  <div>
                    <b>{s.label}</b> <span className="muted small">({s.weight})</span>
                    <div className="muted">{s.detail}</div>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="card">
            <h3>Exceptions</h3>
            {a.exceptions.length === 0 ? (
              <p className="muted">None.</p>
            ) : (
              <ul className="exceptions">
                {a.exceptions.map((e) => (
                  <li key={e.id} className={`sev-${e.severity}`}>
                    <div className="exception-head">
                      <span className="tag">{e.severity}</span>
                      <b>{e.title}</b>
                    </div>
                    <p className="muted">{e.detail}</p>
                    <p className="action">
                      <b>Action required:</b> {e.actionRequired}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            {a.lifecycle.escalation && <p className="action stale">{a.lifecycle.escalation}</p>}
          </section>

          <section className="card">
            <h3>Evidence</h3>
            {[...bySource].map(([sourceId, items]) => (
              <div key={sourceId} className="evidence-source">
                <h4>{SOURCE_LABELS[sourceId] ?? sourceId}</h4>
                <div className="evidence-grid">
                  {items.map((item) => (
                    <EvidenceCard key={`${item.sourceId}/${item.recordType}/${item.recordId}`} item={item} />
                  ))}
                </div>
              </div>
            ))}
            <h4>Documents</h4>
            {evidence.documents.length === 0 ? (
              <p className="muted">No supporting documents on file.</p>
            ) : (
              <ul className="docs">
                {evidence.documents.map((d) => (
                  <li key={d.documentId}>
                    <a href={d.url} target="_blank" rel="noreferrer">
                      {d.title}
                    </a>
                    <span className="muted small">
                      {" "}
                      · {d.kind} · {day(d.uploadedAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="detail-side">
          <section className="card">
            <h3>Your decision</h3>
            <p className="muted small">
              Recorded against {session?.email}. Nothing is written to any source system.
            </p>
            <form onSubmit={decide}>
              <label className="field">
                <span>Decision</span>
                <select value={action} onChange={(e) => setAction(e.target.value)}>
                  {Object.entries(data.decisionActions).map(([id, label]) => (
                    <option key={id} value={id}>
                      {label.replace(/^(Accepted|Overrode|Marked|Requested|Escalated)/, (w) =>
                        ({ Accepted: "Accept", Overrode: "Override", Marked: "Mark", Requested: "Request", Escalated: "Escalate" })[w] ?? w,
                      )}
                    </option>
                  ))}
                </select>
              </label>
              {action === "override" && (
                <label className="field">
                  <span>Classification to use</span>
                  <select value={classification} onChange={(e) => setClassification(e.target.value)} required>
                    <option value="">Choose…</option>
                    {Object.entries(data.classifications).map(([id, label]) => (
                      <option key={id} value={id}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label className="field">
                <span>Note</span>
                <textarea rows={4} value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} />
              </label>
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              {saved && (
                <p className="note" role="status">
                  {saved}
                </p>
              )}
              <div style={{ marginTop: "1rem" }}>
                <button className="btn btn-primary btn-block" type="submit" disabled={saving}>
                  {saving ? "Recording…" : "Record decision"}
                </button>
              </div>
            </form>
          </section>

          <section className="card">
            <h3>Decision history</h3>
            {decisions.length === 0 ? (
              <p className="muted">No decisions yet.</p>
            ) : (
              <ul className="history">
                {decisions.map((d) => (
                  <li key={d.at}>
                    <b>{d.actionLabel}</b>
                    {d.classification && <> → {data.classifications[d.classification] ?? d.classification}</>}
                    <div className="muted small">
                      {d.decidedByName ?? d.decidedBy} · {d.at.replace("T", " ").slice(0, 16)} UTC
                    </div>
                    {d.note && <p className="muted small">{d.note}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card">
            <h3>Assessment</h3>
            <p className="muted small">
              Run {a.assessedAt.replace("T", " ").slice(0, 16)} UTC, base currency {a.fx.base}. Rules are deterministic:
              the same evidence always gives the same answer.
            </p>
          </section>
        </aside>
      </div>
    </>
  );
}
