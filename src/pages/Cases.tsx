import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiError, day, money, type CaseSummary } from "../api";
import { useAuth } from "../auth/AuthContext";

type ReadinessFilter = "all" | "ready" | "not-ready";

export default function Cases() {
  const { idToken } = useAuth();
  const [cases, setCases] = useState<CaseSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [readiness, setReadiness] = useState<ReadinessFilter>("all");
  const [stage, setStage] = useState<string>("all");

  useEffect(() => {
    let active = true;
    api<{ cases: CaseSummary[] }>("/cases", idToken())
      .then((result) => {
        if (active) setCases(result.cases);
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

  const stages = useMemo(() => {
    const seen = new Map<string, string>();
    for (const c of cases ?? []) seen.set(c.stage, c.stageLabel);
    return [...seen];
  }, [cases]);

  const visible = (cases ?? []).filter(
    (c) => (readiness === "all" || c.readiness === readiness) && (stage === "all" || c.stage === stage),
  );

  const counts = {
    ready: (cases ?? []).filter((c) => c.readiness === "ready").length,
    blocking: (cases ?? []).filter((c) => c.blockingExceptions > 0).length,
    stale: (cases ?? []).filter((c) => c.stale).length,
  };

  return (
    <>
      <div className="page-head">
        <h2>Refund cases</h2>
        <p>
          Every credit note in Disbursement, assessed just now against Procurement, Treasury, the Cash Room
          and the document repository. Nothing here has been applied anywhere — each case waits for a person.
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
          <div className="stat-row">
            <div className="stat">
              <b>{cases.length}</b>
              <span>cases</span>
            </div>
            <div className="stat">
              <b>{counts.ready}</b>
              <span>ready for review</span>
            </div>
            <div className="stat">
              <b>{counts.blocking}</b>
              <span>with a blocking exception</span>
            </div>
            <div className="stat">
              <b>{counts.stale}</b>
              <span>stale</span>
            </div>
          </div>

          <div className="iface-toolbar">
            <div className="filters">
              <label className="filter">
                <span>Readiness</span>
                <select value={readiness} onChange={(e) => setReadiness(e.target.value as ReadinessFilter)}>
                  <option value="all">All</option>
                  <option value="ready">Ready</option>
                  <option value="not-ready">Not ready</option>
                </select>
              </label>
              <label className="filter">
                <span>Stage</span>
                <select value={stage} onChange={(e) => setStage(e.target.value)}>
                  <option value="all">All</option>
                  {stages.map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <span className="count">
              {visible.length} of {cases.length}
            </span>
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Case</th>
                  <th>Supplier</th>
                  <th className="num">Amount</th>
                  <th>Readiness</th>
                  <th>Classification</th>
                  <th>Exceptions</th>
                  <th>Stage</th>
                  <th>Decision</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((c) => (
                  <tr key={c.caseId}>
                    <td>
                      <Link to={`/app/cases/${encodeURIComponent(c.caseId)}`}>
                        <b>{c.caseId}</b>
                      </Link>
                      <div className="muted small">issued {day(c.issuedDate)}</div>
                    </td>
                    <td>
                      {c.supplier}
                      <div className="muted small">{c.reason}</div>
                    </td>
                    <td className="num">
                      {money(c.amount)}
                      {c.amountInBase && c.amountInBase.currency !== c.amount.currency && (
                        <div className="muted small">≈ {money(c.amountInBase)}</div>
                      )}
                    </td>
                    <td>
                      <span className={`pill ${c.readiness === "ready" ? "pill-ok" : "pill-warn"}`}>
                        {c.readiness === "ready" ? "Ready" : "Not ready"}
                      </span>
                    </td>
                    <td>
                      {c.classificationLabel}
                      <div className="muted small">{c.confidence}% confidence</div>
                    </td>
                    <td>
                      {c.exceptions === 0 ? (
                        <span className="muted">none</span>
                      ) : (
                        <span className={`pill ${c.blockingExceptions > 0 ? "pill-bad" : "pill-warn"}`}>
                          {c.exceptions}
                          {c.blockingExceptions > 0 && ` · ${c.blockingExceptions} blocking`}
                        </span>
                      )}
                    </td>
                    <td>
                      {c.stageLabel}
                      <div className={`small ${c.stale ? "stale" : "muted"}`}>
                        {c.businessDaysInStage} business day{c.businessDaysInStage === 1 ? "" : "s"}
                        {c.stale && " · stale"}
                      </div>
                    </td>
                    <td>
                      {c.latestDecision ? (
                        <>
                          {c.latestDecision.actionLabel}
                          <div className="muted small">
                            {c.latestDecision.decidedByName ?? c.latestDecision.decidedBy}, {day(c.latestDecision.at)}
                          </div>
                        </>
                      ) : (
                        <span className="muted">awaiting</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
