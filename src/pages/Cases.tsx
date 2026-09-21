import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { day, money } from "../api";
import { RefreshControl, useCases } from "../hooks/useCases";

type ReadinessFilter = "all" | "ready" | "not-ready";

/**
 * Two short lines per case and six columns, so the list fits any desktop
 * width without scrolling sideways and still shows twenty-odd cases on a
 * screen. Long text is clipped with an ellipsis and shown in full on hover;
 * the detail page has everything.
 */
export default function Cases() {
  const navigate = useNavigate();
  const { cases, assessedAt, loading, error, refresh } = useCases();
  const [readiness, setReadiness] = useState<ReadinessFilter>("all");
  const [stage, setStage] = useState<string>("all");

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
              <RefreshControl assessedAt={assessedAt} loading={loading} onRefresh={() => void refresh()} />
            </div>
          </div>

          <div className="table-wrap">
            <table className="table dense fit">
              <colgroup>
                <col style={{ width: "12%" }} />
                <col style={{ width: "26%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "21%" }} />
                <col style={{ width: "13%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Case</th>
                  <th>Supplier</th>
                  <th className="num">Amount</th>
                  <th>Readiness · stage</th>
                  <th>Classification</th>
                  <th>Exceptions · decision</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((c) => {
                  const href = `/app/cases/${encodeURIComponent(c.caseId)}`;
                  return (
                    <tr key={c.caseId} className="row-link" onClick={() => navigate(href)}>
                      <td>
                        <div className="l1">
                          <Link to={href} onClick={(e) => e.stopPropagation()}>
                            <b>{c.caseId}</b>
                          </Link>
                        </div>
                        <div className="l2">issued {day(c.issuedDate)}</div>
                      </td>
                      <td>
                        <div className="l1 clip" title={c.supplier}>
                          {c.supplier}
                        </div>
                        <div className="l2 clip" title={c.reason}>
                          {c.reason}
                        </div>
                      </td>
                      <td className="num">
                        <div className="l1">{money(c.amount)}</div>
                        <div className="l2">
                          {c.amountInBase && c.amountInBase.currency !== c.amount.currency ? `≈ ${money(c.amountInBase)}` : "\u00a0"}
                        </div>
                      </td>
                      <td>
                        <div className="l1">
                          <span className={`pill pill-sm ${c.readiness === "ready" ? "pill-ok" : "pill-warn"}`}>
                            {c.readiness === "ready" ? "Ready" : "Not ready"}
                          </span>
                        </div>
                        <div className={`l2 clip ${c.stale ? "stale" : ""}`} title={c.stageLabel}>
                          {c.stageLabel} · {c.businessDaysInStage}d{c.stale && " · stale"}
                        </div>
                      </td>
                      <td>
                        <div className="l1 clip" title={c.classificationLabel}>
                          {c.classificationLabel}
                        </div>
                        <div className="l2">{c.confidence}% confidence</div>
                      </td>
                      <td>
                        <div className="l1">
                          {c.exceptions === 0 ? (
                            <span className="muted">none</span>
                          ) : c.blockingExceptions > 0 ? (
                            <span className="pill pill-sm pill-bad" title={`${c.blockingExceptions} blocking of ${c.exceptions}`}>
                              {c.blockingExceptions} blocking
                            </span>
                          ) : (
                            <span className="pill pill-sm pill-warn">{c.exceptions} to note</span>
                          )}
                        </div>
                        <div
                          className="l2 clip"
                          title={c.latestDecision ? `${c.latestDecision.decidedByName ?? c.latestDecision.decidedBy}, ${day(c.latestDecision.at)}` : undefined}
                        >
                          {c.latestDecision ? c.latestDecision.actionLabel : "awaiting decision"}
                        </div>
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
