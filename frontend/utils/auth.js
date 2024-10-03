import { useRouter } from 'next/router';
import { useState, useEffect, createContext, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadUserFromToken() {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await fetch('/api/users/me/', {
            headers: {
              'Authorization': `Token ${token}`
            }
          });
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else {
            localStorage.removeItem('token');
          }
        } catch (error) {
          console.error('Failed to load user', error);
        }
      }
      setLoading(false);
    }
    loadUserFromToken();
  }, []);

  const login = async (username, password) => {
    const response = await fetch('/api/token/login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (response.ok) {
      const { auth_token } = await response.json();
      localStorage.setItem('token', auth_token);
      router.push('/dashboard');
    } else {
      throw new Error('Login failed');
    }
  };

  const logout = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      await fetch('/api/token/logout/', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`
        }
      });
    }
    localStorage.removeItem('token');
    setUser(null);
    router.push('/login');
  };

  const register = async (email, username, password) => {
    const response = await fetch('/api/users/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, password }),
    });
    if (response.ok) {
      router.push('/login');
    } else {
      throw new Error('Registration failed');
    }
  };

  const resetPassword = async (email) => {
    const response = await fetch('/api/users/reset_password/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!response.ok) {
      throw new Error('Password reset request failed');
    }
  };

  const resetPasswordConfirm = async (uid, token, new_password) => {
    const response = await fetch('/api/users/reset_password_confirm/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, token, new_password }),
    });
    if (!response.ok) {
      throw new Error('Password reset confirmation failed');
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, resetPassword, resetPasswordConfirm, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return <div>Loading...</div>;
  }

  return children;
};