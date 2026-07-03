import { createContext, useContext, useState, useEffect } from "react";
import SHA256 from "crypto-js/sha256";
import { apiRequest } from "../utils/api";

const AuthContext = createContext(null);

/**
 * Provides global authentication state.
 * – Persists the logged-in user in localStorage
 * – Exposes login / signup / logout helpers
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("eldawly_user");
      if (stored) setUser(JSON.parse(stored));
    } catch {
      localStorage.removeItem("eldawly_user");
    } finally {
      setLoading(false);
    }
  }, []);

  /** Persist user object whenever it changes */
  const persist = (u) => {
    setUser(u);
    if (u) {
      localStorage.setItem("eldawly_user", JSON.stringify(u));
    } else {
      localStorage.removeItem("eldawly_user");
    }
  };

  /** Login – hash password client-side, then call Apps Script */
  const login = async (username, password) => {
    const password_hash = SHA256(password).toString();
    const data = await apiRequest("login", { username, password_hash });
    persist(data);
    return data;
  };

  /** Signup – hash password, send along with whatsapp_number */
  const signup = async (username, password, whatsapp_number) => {
    const password_hash = SHA256(password).toString();
    await apiRequest("signup", { username, password_hash, whatsapp_number });
    // Attempt auto-login after signup (will throw if account requires approval)
    return login(username, password);
  };

  /** Logout – clear state and storage */
  const logout = () => persist(null);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth state from any component.
 * @returns {{ user: object|null, loading: boolean, login: Function, signup: Function, logout: Function }}
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
