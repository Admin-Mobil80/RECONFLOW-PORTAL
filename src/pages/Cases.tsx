import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, ApiError, day, money, type CaseSummary } from "../api";
import { useAuth } from "../auth/AuthContext";

type ReadinessFilter = "all" | "ready" | "not-ready";

/**
 * One line per case, no wrapping: the point of the list is to scan many
 * cases at once. Long text is clipped with an ellipsis and shown in full on
 * hover; the detail page has everything.
 */
export default function Cases() {
  const { idToken } = useAuth();
  const navigate = useNavigate();
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
      <div className="page-head compact">
        <h2>Refund cases</h2>
        <p>
          Every credit note in Disbursement, assessed just now across your connected systems. Nothing has been
          applied anywhere — each case waits for a person.
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
          <div className="toolbar">
            <div className="stat-row compact">
              <div className="stat">
                <b>{cases.length}</b>
                <span>cases</span>
              </div>
              <div className="stat">
                <b>{counts.ready}</b>
                <span>ready</span>
              </div>
              <div className="stat">
                <b>{counts.blocking}</b>
                <span>blocked</span>
              </div>
              <div className="stat">
                <b>{counts.stale}</b>
                <span>stale</span>
              </div>
            </div>
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
              <span className="count">
                {visible.length} of {cases.length}
              </span>
            </div>
          </div>

          <div className="table-wrap">
            <table className="table dense">
              <thead>
                <tr>
                  <th>Case</th>
                  <th>Issued</th>
                  <th>Supplier</th>
                  <th>Reason</th>
                  <th className="num">Amount</th>
                  <th>Readiness</th>
                  <th>Classification</th>
                  <th className="num">Conf.</th>
                  <th>Exceptions</th>
                  <th>Stage</th>
                  <th className="num">Days</th>
                  <th>Decision</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((c) => {
                  const href = `/app/cases/${encodeURIComponent(c.caseId)}`;
                  return (
                    <tr key={c.caseId} className="row-link" onClick={() => navigate(href)}>
                      <td>
                        <Link to={href} onClick={(e) => e.stopPropagation()}>
                          <b>{c.caseId}</b>
                        </Link>
                      </td>
                      <td className="muted">{day(c.issuedDate)}</td>
                      <td className="clip" title={c.supplier}>
                        {c.supplier}
                      </td>
                      <td className="clip muted" title={c.reason}>
                        {c.reason}
                      </td>
                      <td className="num" title={c.amountInBase ? `≈ ${money(c.amountInBase)}` : undefined}>
                        {money(c.amount)}
                        {c.amountInBase && c.amountInBase.currency !== c.amount.currency && (
                          <span className="muted"> ≈ {money(c.amountInBase)}</span>
                        )}
                      </td>
                      <td>
                        <span className={`pill pill-sm ${c.readiness === "ready" ? "pill-ok" : "pill-warn"}`}>
                          {c.readiness === "ready" ? "Ready" : "Not ready"}
                        </span>
                      </td>
                      <td>{c.classificationLabel}</td>
                      <td className="num muted">{c.confidence}%</td>
                      <td>
                        {c.exceptions === 0 ? (
                          <span className="muted">—</span>
                        ) : c.blockingExceptions > 0 ? (
                          <span className="pill pill-sm pill-bad">
                            {c.blockingExceptions} blocking{c.exceptions > c.blockingExceptions ? ` +${c.exceptions - c.blockingExceptions}` : ""}
                          </span>
                        ) : (
                          <span className="pill pill-sm pill-warn">{c.exceptions}</span>
                        )}
                      </td>
                      <td>{c.stageLabel}</td>
                      <td className={`num ${c.stale ? "stale" : "muted"}`} title={c.stale ? "Stale" : undefined}>
                        {c.businessDaysInStage}
                        {c.stale && " !"}
                      </td>
                      <td className="clip" title={c.latestDecision ? `${c.latestDecision.decidedByName ?? c.latestDecision.decidedBy}, ${day(c.latestDecision.at)}` : undefined}>
                        {c.latestDecision ? c.latestDecision.actionLabel : <span className="muted">awaiting</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
