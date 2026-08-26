import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { authApi } from "../services/api";

const AuthContext = createContext(null);

const getSafeStorage = () => {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }
  if (typeof localStorage !== "undefined") {
    return localStorage;
  }
  return {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  };
};

export function AuthProvider({ children }) {
  const storage = getSafeStorage();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => {
    try {
      return storage.getItem("token") || null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const userData = await authApi.getMe();
      setUser(userData);
      try {
        storage.setItem("user", JSON.stringify(userData));
      } catch {}
    } catch (err) {
      console.error("Failed to authenticate stored token:", err);
      try {
        storage.removeItem("token");
        storage.removeItem("user");
      } catch {}
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [storage]);

  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, [token, fetchCurrentUser]);

  const login = async (email, password) => {
    setError(null);
    try {
      const data = await authApi.login({ email, password });
      try {
        storage.setItem("token", data.access_token);
        storage.setItem("user", JSON.stringify(data.user));
      } catch {}
      setToken(data.access_token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      const msg = err.response?.data?.detail || "Invalid email or password";
      setError(msg);
      throw new Error(msg);
    }
  };

  const register = async (email, password, role = "Employee") => {
    setError(null);
    try {
      await authApi.register({ email, password, role });
      return await login(email, password);
    } catch (err) {
      const msg = err.response?.data?.detail || "Registration failed";
      setError(msg);
      throw new Error(msg);
    }
  };

  const logout = () => {
    try {
      storage.removeItem("token");
      storage.removeItem("user");
    } catch {}
    setToken(null);
    setUser(null);
    setError(null);
  };

  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated: !!token && !!user,
    isManager: user?.role === "Manager",
    isEmployee: user?.role === "Employee",
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
