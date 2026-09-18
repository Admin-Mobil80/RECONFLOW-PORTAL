import { Link } from "react-router-dom";

export function BrandMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 24 24" aria-hidden="true">
      {/* Two streams converging on a single reviewed point. */}
      <path
        d="M3 5h7a5 5 0 0 1 5 5v4a5 5 0 0 0 5 5h1M3 19h7a5 5 0 0 0 5-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="20.5" cy="9.5" r="2.2" fill="currentColor" />
    </svg>
  );
}

export function SiteHeader({ showSignIn = true }: { showSignIn?: boolean }) {
  return (
    <header className="site-header">
      <div className="wrap">
        <Link className="brand" to="/">
          <BrandMark />
          ReconFlow
        </Link>
        <nav className="nav">
          <a className="nav-hide-sm" href="/#how-it-works">
            How it works
          </a>
          <a className="nav-hide-sm" href="/#interfaces">
            Interfaces
          </a>
          {showSignIn && (
            <Link className="btn btn-primary" to="/signin">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <span>© {new Date().getFullYear()} ReconFlow</span>
        <span>Decision support for reconciliation — a human always decides.</span>
      </div>
    </footer>
  );
}
