import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../../types';
import * as api from '../../services/localDbService'; // Renamed to apiService in spirit

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithSteam: () => void;
  logout: () => Promise<void>;
  registerUser: (name: string) => Promise<User>;
  loginWithUsername: (name: string) => Promise<User | null>;
  loginAsAdminForTesting: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);


export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const sessionUser = await api.checkSession();
        if (sessionUser) {
          setUser(sessionUser);
        }
      } catch (error) {
        console.warn("No active session found or server is unavailable.");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkUserSession();
  }, []);
  
  const registerUser = async (name: string): Promise<User> => {
      // The API service will handle the full registration flow
      return api.register(name);
  }

  const loginWithUsername = async (name: string): Promise<User | null> => {
    const userToLogin = await api.login(name);
    if (userToLogin) {
      setUser(userToLogin);
      return userToLogin;
    }
    return null;
  }

  const loginWithSteam = () => {
    // This part remains the same, it redirects to Steam.
    // The backend will handle the callback at /api/auth/steam/callback
    // After redirect back, the useEffect hook will check the session.
    window.location.href = '/api/auth/steam';
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };
  
  const loginAsAdminForTesting = async () => {
    setLoading(true);
    try {
        const adminUser = await api.loginAsAdmin();
        if (adminUser) {
          setUser(adminUser);
        }
    } catch(err) {
        console.error("Failed to login as admin:", err);
    } finally {
        setLoading(false);
    }
  };


  return (
    <AuthContext.Provider value={{ user, loading, loginWithSteam, logout, registerUser, loginWithUsername, loginAsAdminForTesting }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};