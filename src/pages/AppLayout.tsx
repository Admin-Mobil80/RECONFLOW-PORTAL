import { NavLink, Navigate, Outlet, useLocation } from "react-router-dom";
import { BrandMark } from "../components/Chrome";
import { useAuth } from "../auth/AuthContext";

export default function AppLayout() {
  const { session, loading, signOut, isMock } = useAuth();
  const location = useLocation();

  // Wait for the stored session to be read, or every reload flashes the
  // sign-in page before landing back here.
  if (loading) return null;

  if (!session) {
    return <Navigate to="/signin" replace state={{ from: location.pathname }} />;
  }

  return (
    <>
      {isMock && (
        <div className="app-banner">
          <div className="wrap">
            Demo session — authentication is not connected yet, and interface
            settings are not saved to a backend.
          </div>
        </div>
      )}

      <header className="site-header">
        <div className="wrap">
          <span className="brand">
            <BrandMark />
            ReconFlow
          </span>
          <div className="who">
            <span>
              {session.email} · {session.organisation}
            </span>
            <button className="linklike" onClick={() => void signOut()}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="wrap">
        <nav className="app-nav">
          <NavLink to="/app" end>
            Overview
          </NavLink>
          {session.isAdministrator && (
            <NavLink to="/app/interfaces">Interfaces</NavLink>
          )}
        </nav>
      </div>

      <main className="wrap">
        <Outlet />
      </main>
    </>
  );
}
