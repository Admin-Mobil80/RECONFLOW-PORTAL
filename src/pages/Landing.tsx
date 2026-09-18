import { Link } from "react-router-dom";
import { SiteHeader, SiteFooter } from "../components/Chrome";

const STEPS = [
  {
    title: "Connect what you already run",
    body: "Adaptors for standard enterprise systems, or a proprietary adaptor for anything in-house. ReconFlow reads from them; it does not replace them.",
  },
  {
    title: "Find what does not agree",
    body: "AI models compare records across systems and surface the discrepancies that matter, each with the underlying evidence and why it was flagged.",
  },
  {
    title: "A person decides",
    body: "Your team reviews the evidence and chooses the resolution. ReconFlow records who decided, what they saw, and why — a complete audit trail.",
  },
];

const CATEGORIES = [
  "ERP",
  "Procurement",
  "Expense management",
  "Travel management",
  "Workflow",
  "Disbursement",
  "Vendor management",
  "Financial systems",
];

const ADAPTORS = [
  "SAP",
  "Microsoft Dynamics",
  "Oracle",
  "Salesforce",
  "Workday",
  "Coupa",
  "Concur",
  "Your in-house systems",
];

function Tick() {
  return (
    <svg className="tick" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M2 8.5l4 4 8-9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Landing() {
  return (
    <>
      <SiteHeader />

      <main>
        <section className="hero">
          <div className="wrap">
            <span className="eyebrow">Agentic decision support</span>
            <h1>
              Reconciliation decisions,
              <br />
              made faster — by people.
            </h1>
            <p className="lede">
              ReconFlow draws data from the enterprise systems you already run,
              uses AI to identify the discrepancies that matter, and gives your
              team the evidence to act. It assists the decision. It never makes
              it.
            </p>
            <div className="hero-actions">
              <Link className="btn btn-primary" to="/signin">
                Sign in
              </Link>
              <a className="btn btn-secondary" href="#how-it-works">
                How it works
              </a>
            </div>
          </div>
        </section>

        <section className="section" id="how-it-works">
          <div className="wrap">
            <div className="section-head">
              <h2>Data in, discrepancies out, decisions with a name on them</h2>
              <p>
                Reconciliation breaks down when the same transaction is
                represented differently in four systems and someone has to work
                out which one is right. ReconFlow does the comparing and the
                assembling of evidence, so the human effort goes into judgement
                rather than retrieval.
              </p>
            </div>
            <div className="grid grid-3">
              {STEPS.map((step, index) => (
                <article className="card" key={step.title}>
                  <span className="step-n">{index + 1}</span>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="human-in-the-loop">
          <div className="wrap">
            <div className="boundary">
              <h2>The human stays in the loop — by design</h2>
              <p style={{ marginTop: "0.75rem", color: "var(--fg-muted)" }}>
                Plenty of tools promise to reconcile your books automatically.
                ReconFlow deliberately does not, because the cost of a confident
                wrong posting is far higher than the cost of a review.
              </p>
              <ul>
                <li>
                  <Tick />
                  <span>
                    <b>Every resolution is proposed, never applied.</b> Nothing
                    is posted, approved or written back without a person
                    accepting it.
                  </span>
                </li>
                <li>
                  <Tick />
                  <span>
                    <b>Every flag carries its evidence.</b> The records
                    compared, the fields that differ and the reasoning are shown
                    together — no unexplained scores.
                  </span>
                </li>
                <li>
                  <Tick />
                  <span>
                    <b>Every decision is attributable.</b> Who decided, what
                    they were shown and when, retained for audit.
                  </span>
                </li>
                <li>
                  <Tick />
                  <span>
                    <b>Uncertainty is surfaced, not hidden.</b> Where the
                    evidence is thin, ReconFlow says so instead of guessing.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="section" id="interfaces">
          <div className="wrap">
            <div className="section-head">
              <h2>Neutral about where the data comes from</h2>
              <p>
                ReconFlow sits above the landscape rather than inside it. Plug in
                standard adaptors, or a proprietary adaptor for a system only
                your organisation runs — ReconFlow treats them the same way.
                Administrators choose which interfaces are active.
              </p>
            </div>

            <h3 style={{ marginBottom: "0.75rem" }}>Systems it reconciles across</h3>
            <div className="pill-grid" style={{ marginBottom: "2rem" }}>
              {CATEGORIES.map((category) => (
                <span className="pill" key={category}>
                  {category}
                </span>
              ))}
            </div>

            <h3 style={{ marginBottom: "0.75rem" }}>Adaptors</h3>
            <div className="pill-grid">
              {ADAPTORS.map((adaptor) => (
                <span className="pill" key={adaptor}>
                  {adaptor}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="wrap" style={{ textAlign: "center" }}>
            <h2>Already have a ReconFlow account?</h2>
            <p
              style={{
                margin: "0.75rem auto 1.75rem",
                color: "var(--fg-muted)",
                maxWidth: "36rem",
              }}
            >
              Accounts are provisioned for your organisation by ReconFlow. There
              is no self-service sign-up.
            </p>
            <Link className="btn btn-primary" to="/signin">
              Sign in to ReconFlow
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
