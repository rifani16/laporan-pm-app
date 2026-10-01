import { useState } from 'react';
import { AuthContext } from './AuthContext';
import { loginUser as loginApi } from '../services/api';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('pm_auth_user');
      return savedUser ? JSON.parse(savedUser) : null;
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

  const logout = () => {
    setUser(null);
    localStorage.removeItem('pm_auth_user');
  };

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
