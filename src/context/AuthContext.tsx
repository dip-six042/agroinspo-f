import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { api, LiveNotification, Me, Role, setActingBusiness } from '../lib/api';

interface SignupInput {
  name: string;
  email: string;
  password: string;
  role: Exclude<Role, 'admin'>;
  acceptTerms: boolean;
}

interface AuthContextType {
  user: Me | null;
  loading: boolean;
  /** Dev-only link returned by the server while no email provider is configured. */
  devLink: string | null;
  login: (email: string, password: string) => Promise<Me>;
  signup: (input: SignupInput) => Promise<Me>;
  logout: () => Promise<void>;
  reloadMe: () => Promise<void>;
  updateMe: (patch: Record<string, unknown>) => Promise<Me>;
  setUser: (u: Me) => void;
  resendVerification: () => Promise<void>;
  notifications: LiveNotification[];
  unread: number;
  refreshNotifications: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<LiveNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    api
      .get<{ user: Me | null }>('/auth/me')
      .then((r) => setUser(r.user))
      .catch(() => setUser(null)) // server not running: the site still works in demo mode
      .finally(() => setLoading(false));
  }, []);

  const refreshNotifications = useCallback(async () => {
    try {
      const r = await api.get<{ notifications: LiveNotification[]; unread: number }>('/notifications');
      setNotifications(r.notifications);
      setUnread(r.unread);
    } catch {
      /* keep the last good list */
    }
  }, []);

  // Poll for notifications while signed in and the tab is visible.
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnread(0);
      return;
    }
    refreshNotifications();
    const tick = () => document.visibilityState === 'visible' && refreshNotifications();
    timer.current = window.setInterval(tick, 45_000);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [user?.id, refreshNotifications]);

  const login = async (email: string, password: string) => {
    const r = await api.post<{ user: Me }>('/auth/login', { email, password });
    setActingBusiness(null);
    // Reload the full profile (it includes team memberships and invitations).
    const me = await api.get<{ user: Me | null }>('/auth/me').catch(() => null);
    setUser(me?.user ?? r.user);
    return r.user;
  };

  const signup = async (input: SignupInput) => {
    const r = await api.post<{ user: Me; devVerifyLink?: string }>('/auth/signup', input);
    setDevLink(r.devVerifyLink ?? null);
    setUser(r.user);
    return r.user;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setActingBusiness(null);
      setUser(null);
      setDevLink(null);
    }
  };

  const reloadMe = async () => {
    const me = await api.get<{ user: Me | null }>('/auth/me').catch(() => null);
    if (me) setUser(me.user);
  };

  const updateMe = async (patch: Record<string, unknown>) => {
    const r = await api.patch<{ user: Me }>('/me', patch);
    setUser(r.user);
    return r.user;
  };

  const resendVerification = async () => {
    const r = await api.post<{ devVerifyLink?: string }>('/auth/resend-verification');
    if (r.devVerifyLink) setDevLink(r.devVerifyLink);
  };

  const markRead = async (id: string) => {
    setNotifications((ns) => ns.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnread((u) => Math.max(0, u - 1));
    await api.post(`/notifications/${id}/read`).catch(() => {});
  };

  const markAllRead = async () => {
    setNotifications((ns) => ns.map((n) => ({ ...n, read: true })));
    setUnread(0);
    await api.post('/notifications/read-all').catch(() => {});
  };

  return (
    <AuthContext.Provider
      value={{
        user, loading, devLink, login, signup, logout, updateMe, setUser, resendVerification, reloadMe,
        notifications, unread, refreshNotifications, markRead, markAllRead
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
