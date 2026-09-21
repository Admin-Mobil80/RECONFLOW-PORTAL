import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api, ApiError, day, type OrganisationUser } from "../api";
import { useAuth } from "../auth/AuthContext";

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  administrator: "Administrator",
  reviewer: "Reviewer",
};

/**
 * The organisation's people. Owners and administrators create accounts -
 * there is no self sign-up - and disable them rather than delete them, so
 * decisions keep their attribution.
 */
export default function Users() {
  const { idToken, session } = useAuth();
  const [users, setUsers] = useState<OrganisationUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [created, setCreated] = useState<OrganisationUser | null>(null);

  const load = useCallback(async () => {
    try {
      setUsers((await api<{ users: OrganisationUser[] }>("/users", idToken())).users);
    } catch (cause) {
      setUsers([]);
      setError(cause instanceof ApiError ? cause.message : "Could not load users.");
    }
  }, [idToken]);

  useEffect(() => {
    void load();
  }, [load]);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    setSaving("create");
    setError(null);
    setCreated(null);
    try {
      const result = await api<{ user: OrganisationUser }>("/users", idToken(), { method: "POST", body: data });
      setCreated(result.user);
      form.reset();
      await load();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Could not create the user.");
    } finally {
      setSaving(null);
    }
  }

  async function setEnabled(user: OrganisationUser, enabled: boolean) {
    setSaving(user.email);
    setError(null);
    try {
      await api(`/users/${encodeURIComponent(user.email)}/${enabled ? "enable" : "disable"}`, idToken(), { method: "POST" });
      await load();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Could not update the user.");
    } finally {
      setSaving(null);
    }
  }

  return (
    <>
      <div className="page-head compact">
        <h2>Users</h2>
        <p>
          People who can sign in to {session?.organisationId?.toUpperCase()}&rsquo;s ReconFlow. Administrators manage
          interfaces and users; reviewers decide cases. A new user signs in straight away with an emailed code.
        </p>
      </div>

      <section className="card" style={{ marginBottom: "1.25rem" }}>
        <h3>Add a user</h3>
        <form onSubmit={create} noValidate>
          <div className="contact-grid">
            <label className="field">
              <span>Name</span>
              <input name="name" type="text" required maxLength={120} />
            </label>
            <label className="field">
              <span>Work email</span>
              <input name="email" type="email" required maxLength={320} />
            </label>
            <label className="field">
              <span>Role</span>
              <select name="role" defaultValue="reviewer">
                <option value="reviewer">Reviewer — decides cases</option>
                <option value="administrator">Administrator — also manages interfaces and users</option>
              </select>
            </label>
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          {created && (
            <p className="note" role="status">
              Added <b>{created.name}</b> ({created.email}) as {ROLE_LABELS[created.role].toLowerCase()}. They can sign in now.
            </p>
          )}
          <div className="contact-actions">
            <button className="btn btn-primary" type="submit" disabled={saving !== null}>
              {saving === "create" ? "Adding…" : "Add user"}
            </button>
          </div>
        </form>
      </section>

      {users === null ? (
        <p className="count">Loading users…</p>
      ) : (
        <div className="iface-list">
          {users.map((u) => (
            <div className="iface-row" key={u.email}>
              <div>
                <div className="iface-name">
                  {u.name}
                  <span className="tag">{ROLE_LABELS[u.role] ?? u.role}</span>
                  {u.status === "disabled" && <span className="tag tag-proprietary">Disabled</span>}
                  {u.email === session?.email && <span className="tag">You</span>}
                </div>
                <p className="iface-meta">
                  {u.email}
                  {u.createdAt && ` · added ${day(u.createdAt)}`}
                  {u.createdBy && u.createdBy !== "bms" && ` by ${u.createdBy}`}
                </p>
              </div>
              {u.role !== "owner" && u.email !== session?.email && (
                <button
                  className="btn btn-secondary btn-sm"
                  type="button"
                  disabled={saving !== null}
                  onClick={() => void setEnabled(u, u.status === "disabled")}
                >
                  {saving === u.email ? "Saving…" : u.status === "disabled" ? "Enable" : "Disable"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
