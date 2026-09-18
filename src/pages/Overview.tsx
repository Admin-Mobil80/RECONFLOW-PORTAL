import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Overview() {
  const { session } = useAuth();

  return (
    <>
      <div className="page-head">
        <h2>Overview</h2>
        <p>
          Signed in to {session?.organisationId}. Cases are assessed from your
          connected systems each time you open them; every decision is yours.
        </p>
      </div>

      <div className="grid grid-3">
        <article className="card">
          <h3>Connect your systems</h3>
          <p>
            An administrator chooses which interfaces ReconFlow reads from.
          </p>
          <p style={{ marginTop: "0.9rem" }}>
            <Link to="/app/interfaces">Manage interfaces →</Link>
          </p>
        </article>

        <article className="card">
          <h3>Review cases</h3>
          <p>
            Each refund case with its readiness, recommended classification,
            exceptions and the evidence behind them.
          </p>
          <p style={{ marginTop: "0.9rem" }}>
            <Link to="/app/cases">Open the case list →</Link>
          </p>
        </article>

        <article className="card">
          <h3>Decide and record</h3>
          <p>
            Proposed resolutions await a person. Nothing is applied until
            someone accepts it, and every decision is attributed.
          </p>
        </article>
      </div>
    </>
  );
}
