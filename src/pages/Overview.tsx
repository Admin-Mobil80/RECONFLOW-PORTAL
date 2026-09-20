import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiError, day, money, type CaseSummary, type Money } from "../api";
import { useAuth } from "../auth/AuthContext";

function sum(cases: readonly CaseSummary[], currency: string): Money {
  return {
    amount: Math.round(cases.reduce((total, c) => total + (c.amountInBase?.amount ?? 0), 0) * 100) / 100,
    currency,
  };
}

function breakdown<K extends string>(cases: readonly CaseSummary[], key: (c: CaseSummary) => K) {
  const counts = new Map<K, { count: number; value: number }>();
  for (const c of cases) {
    const k = key(c);
    const entry = counts.get(k) ?? { count: 0, value: 0 };
    entry.count += 1;
    entry.value += c.amountInBase?.amount ?? 0;
    counts.set(k, entry);
  }
  return [...counts].map(([label, v]) => ({ label, ...v })).sort((a, b) => b.count - a.count);
}

/** Horizontal bars for one measure: a single hue, counts labelled in text ink. */
function Bars({ rows, currency }: { rows: { label: string; count: number; value: number }[]; currency: string }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <ul className="bars">
      {rows.map((r) => (
        <li key={r.label}>
          <span className="bar-label">{r.label}</span>
          <span className="bar-track" aria-hidden="true">
            <span className="bar-fill" style={{ width: `${(r.count / max) * 100}%` }} />
          </span>
          <span className="bar-value">
            {r.count} <span className="muted">· {money({ amount: Math.round(r.value), currency })}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function Overview() {
  const { session, idToken } = useAuth();
  const [cases, setCases] = useState<CaseSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api<{ cases: CaseSummary[] }>("/cases", idToken())
      .then((r) => {
        if (active) setCases(r.cases);
      })
      .catch((cause) => {
        if (!active) return;
        setCases([]);
        setError(cause instanceof ApiError ? cause.message : "Could not load cases.");
      });
    return () => {
      active = false;
    };
  }, [idToken]);

  const view = useMemo(() => {
    const all = cases ?? [];
    const currency = all.find((c) => c.amountInBase)?.amountInBase?.currency ?? "USD";
    const ready = all.filter((c) => c.readiness === "ready");
    const blocked = all.filter((c) => c.blockingExceptions > 0);
    const stale = all.filter((c) => c.stale).sort((a, b) => b.businessDaysInStage - a.businessDaysInStage);
    const decided = all.filter((c) => c.latestDecision);
    const awaiting = ready.filter((c) => !c.latestDecision);
    const recentDecisions = decided
      .map((c) => ({ caseId: c.caseId, decision: c.latestDecision! }))
      .sort((a, b) => b.decision.at.localeCompare(a.decision.at))
      .slice(0, 6);
    return {
      currency,
      total: all.length,
      value: sum(all, currency),
      ready,
      readyValue: sum(ready, currency),
      notReady: all.length - ready.length,
      blocked,
      stale,
      decided,
      awaiting,
      awaitingValue: sum(awaiting, currency),
      byClassification: breakdown(all, (c) => c.classificationLabel),
      byStage: breakdown(all, (c) => c.stageLabel),
      recentDecisions,
      avgConfidence: all.length ? Math.round(all.reduce((t, c) => t + c.confidence, 0) / all.length) : 0,
    };
  }, [cases]);

  return (
    <>
      <div className="page-head compact">
        <h2>Overview</h2>
        <p>
          {session?.organisationId?.toUpperCase()} · every case assessed just now from your connected systems.
          Nothing has been applied anywhere; each case waits for a person.
        </p>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {cases === null ? (
        <p className="count">Assessing cases…</p>
      ) : (
        <>
          <div className="tiles">
            <Link className="tile" to="/app/cases">
              <span className="tile-label">Open cases</span>
              <b>{view.total}</b>
              <span className="tile-sub">{money(view.value)} in play</span>
            </Link>
            <Link className="tile" to="/app/cases">
              <span className="tile-label">Ready for review</span>
              <b className="ok">{view.ready.length}</b>
              <span className="tile-sub">{money(view.readyValue)} · {view.awaiting.length} awaiting a decision</span>
            </Link>
            <Link className="tile" to="/app/cases">
              <span className="tile-label">Not ready</span>
              <b className="warn">{view.notReady}</b>
              <span className="tile-sub">{view.blocked.length} with a blocking exception</span>
            </Link>
            <Link className="tile" to="/app/cases">
              <span className="tile-label">Stale</span>
              <b className={view.stale.length ? "bad" : ""}>{view.stale.length}</b>
              <span className="tile-sub">
                {view.stale.length ? `oldest ${view.stale[0].businessDaysInStage} business days` : "nothing over threshold"}
              </span>
            </Link>
            <div className="tile">
              <span className="tile-label">Decided</span>
              <b>{view.decided.length}</b>
              <span className="tile-sub">of {view.total} · by a person, recorded</span>
            </div>
            <div className="tile">
              <span className="tile-label">Average confidence</span>
              <b>{view.avgConfidence}%</b>
              <span className="tile-sub">in the recommended classification</span>
            </div>
          </div>

          <div className="dash-grid">
            <section className="card">
              <h3>By recommended classification</h3>
              <Bars rows={view.byClassification} currency={view.currency} />
            </section>
            <section className="card">
              <h3>By stage</h3>
              <Bars rows={view.byStage} currency={view.currency} />
            </section>
            <section className="card">
              <h3>Needs attention</h3>
              {view.stale.length === 0 && view.blocked.length === 0 ? (
                <p className="muted">Nothing is stale or blocked.</p>
              ) : (
                <ul className="attention">
                  {view.stale.map((c) => (
                    <li key={`s-${c.caseId}`}>
                      <Link to={`/app/cases/${encodeURIComponent(c.caseId)}`}>
                        <b>{c.caseId}</b>
                      </Link>{" "}
                      <span className="stale">{c.businessDaysInStage} business days</span>
                      <span className="muted"> in {c.stageLabel.toLowerCase()} · {c.supplier}</span>
                    </li>
                  ))}
                  {view.blocked
                    .filter((c) => !c.stale)
                    .slice(0, 6)
                    .map((c) => (
                      <li key={`b-${c.caseId}`}>
                        <Link to={`/app/cases/${encodeURIComponent(c.caseId)}`}>
                          <b>{c.caseId}</b>
                        </Link>{" "}
                        <span className="pill pill-sm pill-bad">{c.blockingExceptions} blocking</span>
                        <span className="muted"> · {c.supplier}</span>
                      </li>
                    ))}
                </ul>
              )}
            </section>
            <section className="card">
              <h3>Recent decisions</h3>
              {view.recentDecisions.length === 0 ? (
                <p className="muted">No decisions recorded yet.</p>
              ) : (
                <ul className="attention">
                  {view.recentDecisions.map(({ caseId, decision }) => (
                    <li key={caseId}>
                      <Link to={`/app/cases/${encodeURIComponent(caseId)}`}>
                        <b>{caseId}</b>
                      </Link>{" "}
                      {decision.actionLabel.toLowerCase()}
                      <span className="muted">
                        {" "}
                        · {decision.decidedByName ?? decision.decidedBy}, {day(decision.at)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <p className="muted small" style={{ margin: "1.25rem 0 2rem" }}>
            An administrator chooses which interfaces ReconFlow reads from under{" "}
            <Link to="/app/interfaces">Interfaces</Link>. Values are converted to {view.currency} at the rates shown on each
            case.
          </p>
        </>
      )}
    </>
  );
}
