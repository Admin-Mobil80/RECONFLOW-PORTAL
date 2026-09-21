import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError, type CaseSummary } from "../api";
import { useAuth } from "../auth/AuthContext";

/**
 * The organisation's cases, assessed by the API on every fetch.
 *
 * Refreshes on demand, and whenever the tab regains focus - that is the
 * moment someone comes back from another system (or the BMS) expecting to
 * see what just arrived. No background polling: an assessment runs the
 * engine over every case, and it should run when a person is looking.
 */
export function useCases() {
  const { idToken } = useAuth();
  const [cases, setCases] = useState<CaseSummary[] | null>(null);
  const [assessedAt, setAssessedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    try {
      const result = await api<{ cases: CaseSummary[] }>("/cases", idToken());
      setCases(result.cases);
      setAssessedAt(new Date());
      setError(null);
    } catch (cause) {
      setCases((current) => current ?? []);
      setError(cause instanceof ApiError ? cause.message : "Could not load cases.");
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, [idToken]);

  useEffect(() => {
    void refresh();
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [refresh]);

  return { cases, assessedAt, loading, error, refresh };
}

export function RefreshControl({
  assessedAt,
  loading,
  onRefresh,
}: {
  assessedAt: Date | null;
  loading: boolean;
  onRefresh: () => void;
}) {
  return (
    <span className="refresh">
      {assessedAt && (
        <span className="muted small">assessed {assessedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
      )}
      <button className="btn btn-secondary btn-sm" type="button" onClick={onRefresh} disabled={loading}>
        {loading ? "Assessing…" : "Refresh"}
      </button>
    </span>
  );
}
