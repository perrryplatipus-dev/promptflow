import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (email: string, password?: string, isGoogleLogin?: boolean, name?: string) => Promise<boolean>;
  register: (name: string, email: string, company: string, password?: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('promptflow_user');
    return saved ? JSON.parse(saved) : null;
  });

  const isAuthenticated = !!user;

  // Initialize registered user accounts list
  

  useEffect(() => {
    if (user) {
      localStorage.setItem('promptflow_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('promptflow_user');
    }
  }, [user]);

 const login = async (
  email: string,
  password?: string,
  isGoogleLogin = false,
  name?: string
): Promise<boolean> => {
  const formattedEmail = email.trim().toLowerCase();

  // Google login keeps the existing frontend behavior for now
  if (isGoogleLogin) {
    const role: 'user' | 'admin' =
      formattedEmail === 'admin@promptflow.ai' ? 'admin' : 'user';

    const googleUser: UserProfile = {
      name: name || 'Google User',
      email: formattedEmail,
      company: role === 'admin' ? 'PromptFlow HQ' : 'Google Cloud Dev',
      avatar:
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=256&h=256',
      role
    };

    setUser(googleUser);
    return true;
  }

  if (!password) {
    throw new Error('Password is required.');
  }

  const response = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: formattedEmail,
      password
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Login failed.');
  }

  const loggedInUser: UserProfile = {
    name: data.user.name,
    email: data.user.email,
    company: data.user.company,
    avatar:
      data.user.role === 'admin'
        ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=256&h=256'
        : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256&h=256',
    role: data.user.role
  };

  setUser(loggedInUser);
  return true;
};

 const register = async (
  name: string,
  email: string,
  company: string,
  password?: string
): Promise<boolean> => {
  if (!password) {
    throw new Error('Password is required.');
  }

  const formattedEmail = email.trim().toLowerCase();

  const response = await fetch('http://localhost:3001/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: name.trim(),
      email: formattedEmail,
      company: company || 'Indie Builder',
      password
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Registration failed.');
  }

  const newUser: UserProfile = {
    name: data.user.name,
    email: data.user.email,
    company: data.user.company,
    avatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256&h=256',
    role: data.user.role
  };

  setUser(newUser);
  return true;
};

  const logout = () => {
    setUser(null);
  };

  const updateProfile = (profile: Partial<UserProfile>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...profile };
      
      // Update in registered user list as well to persist password changes/names
      const savedUsers = localStorage.getItem('promptflow_registered_users');
      if (savedUsers) {
        const usersList = JSON.parse(savedUsers);
        const idx = usersList.findIndex((u: any) => u.email === prev.email);
        if (idx !== -1) {
          usersList[idx] = { ...usersList[idx], ...profile };
          localStorage.setItem('promptflow_registered_users', JSON.stringify(usersList));
        }
      }
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
