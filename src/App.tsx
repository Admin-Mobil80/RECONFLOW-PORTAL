import { Link, Route, Routes } from 'react-router-dom';

/** Public marketing page. ReconFlow has no separate landing-page repo by design. */
function Landing() {
  return (
    <main>
      <span className="badge">ReconFlow</span>
      <h1>Reconciliation, automated.</h1>
      <p>
        Placeholder landing page. This repo serves both the public site and the
        customer portal, so the copy below is the only thing standing in for
        real marketing content.
      </p>
      <p>
        <Link to="/app">Go to the portal →</Link>
      </p>
    </main>
  );
}

/** Signed-in portal shell. */
function Portal() {
  return (
    <main>
      <span className="badge">Portal</span>
      <h1>Portal</h1>
      <p>Placeholder for the customer portal. No auth wired up yet.</p>
      <p>
        <Link to="/">← Back to the site</Link>
      </p>
    </main>
  );
}

function NotFound() {
  return (
    <main>
      <span className="badge">404</span>
      <h1>Page not found</h1>
      <p>
        CloudFront rewrites unknown paths to this app, so this is React Router
        answering — not S3.
      </p>
      <p>
        <Link to="/">← Back to the site</Link>
      </p>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/app" element={<Portal />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
