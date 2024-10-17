"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, createContext, useContext } from "react";
import { useDispatch } from 'react-redux';
import { setEmail } from '@/store/ChatSlice';
import { Provider } from 'react-redux';
import store from '@/store/store';

const AuthContext = createContext();

const headers = { "Content-Type": "application/json" };

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  async function loadUserFromToken() {
    const token = localStorage.getItem("access");
    if (token) {
      try {
        const response = await fetch("/api/auth/me/", {
          method: "POST",
          body: JSON.stringify({ token }),
          headers,
        });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          dispatch(setEmail(userData.email));
          console.log(userData);
        } else {
          localStorage.removeItem("access");
          localStorage.removeItem("refresh");
        }
      } catch (error) {
        console.error("Failed to load user", error);
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    loadUserFromToken();
  }, []);

  const login = async ({ username, password }) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
      headers,
    });
    if (response.ok) {
      const { refresh, access } = await response.json();

      if (refresh && access) {
        localStorage.setItem("refresh", refresh);
        localStorage.setItem("access", access);

        await loadUserFromToken();
        router.push("/");
      }
    } else {
      throw new Error("Login failed");
    }
  };

  const logout = async () => {
    const token = localStorage.getItem("access");
    if (token) {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        body: JSON.stringify({ token }),
        headers,
      });
      const data = await response.json();
      console.log("Logout res: ");
      console.log(data);
    }

    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setUser(null);
    router.push("/login");
  };

  const register = async ({
    first_name,
    last_name,
    username,
    email,
    password,
    re_password,
  }) => {
    const response = await fetch("/api/auth/register", {
      headers,
      method: "POST",
      body: JSON.stringify({
        first_name,
        last_name,
        username,
        email,
        password,
        re_password,
      }),
    });
    if (response.ok) {
      router.push("/login");
    } else {
      throw new Error("Registration failed");
    }
  };

  const resetPassword = async (email) => {
    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers,
      body: JSON.stringify({ email }),
    });
    if (!response.ok) {
      throw new Error("Password reset request failed");
    }
  };

  const resetPasswordConfirm = async (uid, token, new_password) => {
    const response = await fetch("/api/auth/reset-password-confirm", {
      method: "POST",
      body: JSON.stringify({ uid, token, new_password }),
      headers,
    });
    if (!response.ok) {
      throw new Error("Password reset confirmation failed");
    }
  };
  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        register,
        resetPassword,
        resetPasswordConfirm,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

const ClientAuthProvider = ({ children }) => {
  return (
    <Provider store={store}>
      <AuthProvider>{children}</AuthProvider>
    </Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return <div>Loading...</div>;
  }

  return children;
};
export default ClientAuthProvider;