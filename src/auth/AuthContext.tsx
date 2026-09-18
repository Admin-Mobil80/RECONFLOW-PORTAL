import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { mockAuth, type AuthClient, type Session } from "./auth";

// The single place that picks an implementation. Swapping to Cognito is a
// change to this line.
const client: AuthClient = mockAuth;

interface AuthState {
  session: Session | null;
  /** True until the stored session has been read, so routes do not flash. */
  loading: boolean;
  isMock: boolean;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    client
      .restore()
      .then((restored) => {
        if (active) setSession(restored);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setSession(await client.signIn(email, password));
  }, []);

  const signOut = useCallback(async () => {
    await client.signOut();
    setSession(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({ session, loading, isMock: client.isMock, signIn, signOut }),
    [session, loading, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
