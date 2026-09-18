/**
 * Authentication seam.
 *
 * ReconFlow accounts are provisioned from the BMS — there is no sign-up path
 * anywhere in this app, by design.
 *
 * Cognito is not wired up yet, so `mockAuth` stands in. Everything outside this
 * folder talks to the `AuthClient` interface, so swapping in Cognito means
 * writing one more implementation of it and changing the line in
 * AuthContext.tsx that picks the client — no page or component changes.
 */

export interface Session {
  readonly email: string;
  readonly organisation: string;
  /** Only administrators may enable or disable interfaces. */
  readonly isAdministrator: boolean;
}

export interface AuthClient {
  /** Returns the persisted session, or null when signed out. */
  restore(): Promise<Session | null>;
  signIn(email: string, password: string): Promise<Session>;
  signOut(): Promise<void>;
  /** True while no real identity provider is connected. */
  readonly isMock: boolean;
}

export class AuthError extends Error {}

const STORAGE_KEY = "reconflow.session";

function readStored(): Session | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    // Private browsing, cleared site data, or blocked storage: treat as signed
    // out rather than breaking the app.
    return null;
  }
}

function writeStored(session: Session | null): void {
  try {
    if (session) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Non-fatal: the session simply will not survive a reload.
  }
}

/**
 * Stand-in for Cognito. It validates the shape of what is typed and nothing
 * else — no credential is actually checked, which is why every signed-in screen
 * shows a banner saying so.
 */
export const mockAuth: AuthClient = {
  isMock: true,

  async restore() {
    return readStored();
  },

  async signIn(email, password) {
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      throw new AuthError("Enter a valid work email address.");
    }
    if (password.length < 8) {
      throw new AuthError("Password must be at least 8 characters.");
    }

    const domain = trimmed.slice(trimmed.indexOf("@") + 1);
    const session: Session = {
      email: trimmed,
      // Real sessions will carry the organisation from the token; deriving it
      // from the email domain keeps the mock plausible without inventing a
      // directory.
      organisation: domain.split(".")[0].replace(/^./, (c) => c.toUpperCase()),
      isAdministrator: true,
    };
    writeStored(session);
    return session;
  },

  async signOut() {
    writeStored(null);
  },
};
