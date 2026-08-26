import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const userData = await authAPI.getMe();
      setUser(userData);
      setError(null);
    } catch (err) {
      setUser(null);
      setToken(null);
      localStorage.removeItem("token");
      setError("Session expired or invalid.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    } else {
      setUser(null);
      setLoading(false);
    }
  }, [token, fetchCurrentUser]);

  const login = async (email, password) => {
    setError(null);
    const data = await authAPI.login({ email, password });
    const receivedToken = data.access_token;
    localStorage.setItem("token", receivedToken);
    setToken(receivedToken);

    // Fetch user details immediately
    try {
      const userData = await authAPI.getMe();
      setUser(userData);
      return userData;
    } catch (err) {
      setUser(null);
      throw err;
    }
  };

  const register = async (email, password, role = "Employee") => {
    setError(null);
    const data = await authAPI.register({ email, password, role });
    return data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isManager: user?.role === "Manager",
    isEmployee: user?.role === "Employee",
    refetchUser: fetchCurrentUser,
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
