import { useState, useEffect, useCallback } from 'react';
import { AuthContext } from './AuthContext';
import {
  loginUser as loginApi,
  logoutUser,
  setSessionToken,
  getSessionToken,
  SESSION_EXPIRED_EVENT,
} from '../services/api';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('pm_auth_user');
      return savedUser && getSessionToken() ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const userData = await loginApi(username, password);
      setUser(userData);
      localStorage.setItem('pm_auth_user', JSON.stringify(userData));
      return { success: true, user: userData };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(() => {
    logoutUser();
    setUser(null);
    localStorage.removeItem('pm_auth_user');
  }, []);

  useEffect(() => {
    const onExpired = () => {
      setSessionToken('');
      setUser(null);
      localStorage.removeItem('pm_auth_user');
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  const isSuperAdmin = user?.role === 'super_admin';
  const isAdminDaerah = user?.role === 'admin_daerah';
  const userDaerah = user?.daerah || '';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isSuperAdmin,
        isAdminDaerah,
        userDaerah
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
