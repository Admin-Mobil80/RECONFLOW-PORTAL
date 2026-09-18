import { useState, type FormEvent } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { SiteHeader } from "../components/Chrome";
import { useAuth } from "../auth/AuthContext";
import { AuthError } from "../auth/auth";

export default function SignIn() {
  const { session, signIn, isMock, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Where the user was headed before being bounced here.
  const from = (location.state as { from?: string } | null)?.from ?? "/app";

  if (!loading && session) return <Navigate to={from} replace />;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email, password);
      navigate(from, { replace: true });
    } catch (cause) {
      setError(
        cause instanceof AuthError
          ? cause.message
          : "Could not sign in. Try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <SiteHeader showSignIn={false} />
      <main className="auth-main">
        <div className="auth-card">
          <h1>Sign in</h1>
          <p className="sub">Continue to your organisation&rsquo;s workspace.</p>

          <form onSubmit={handleSubmit} noValidate>
            <label className="field">
              <span>Work email</span>
              <input
                type="email"
                name="email"
                autoComplete="username"
                autoFocus
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>

            <label className="field">
              <span>Password</span>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>

            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}

            <div style={{ marginTop: "1.5rem" }}>
              <button
                className="btn btn-primary btn-block"
                type="submit"
                disabled={submitting}
              >
                {submitting ? "Signing in…" : "Sign in"}
              </button>
            </div>
          </form>

          <p className="note">
            ReconFlow accounts are created for your organisation by an
            administrator. There is no self-service sign-up.
            {isMock && (
              <>
                {" "}
                <b>
                  Authentication is not connected yet — no credentials are
                  checked.
                </b>
              </>
            )}
          </p>
        </div>
      </main>
    </>
  );
}
