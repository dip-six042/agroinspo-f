import React, { useEffect, useState } from 'react';
import { useRole } from '../context/RoleContext';
import { useCurrency } from '../context/CurrencyContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, ChevronDown, Menu, X, Settings, LogOut, LayoutGrid, MessagesSquare, Briefcase, CalendarDays, Video, Wallet, Mail, LifeBuoy, Award, BookOpen, Store, Megaphone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { firstName, timeAgo } from '../lib/api';
import { Avatar } from './ui';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

const NAV_LINKS: { view: string; label: string }[] = [
  { view: 'landing', label: 'Home' },
  { view: 'community', label: 'Community' },
  { view: 'specialists', label: 'Experts' },
  { view: 'events', label: 'Events' },
  { view: 'jobs', label: 'Jobs' },
  { view: 'opportunities', label: 'Opportunities' },
  { view: 'suppliers', label: 'Suppliers' },
  { view: 'books', label: 'Bookstore' }
];

export const BrandMark: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className={className}>
    {/* Two offset leaf strokes, echoing the reference's double-slash mark */}
    <path d="M7 22.5C7 14 12.5 8 22 7.5c.4 8.6-5.4 15-15 15Z" fill="currentColor" />
    <path d="M12.5 26.5C13.2 21 17 16.6 25 15.6c-.1 6.4-4.7 10.9-12.5 10.9Z" fill="currentColor" opacity=".55" />
  </svg>
);

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate }) => {
  const { markNotificationRead } = useRole();
  const auth = useAuth();
  const { user } = auth;
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const { currency, setCurrency } = useCurrency();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // On the landing page the bar floats over the hero photo, as in the reference.
  const overlay = currentView === 'landing';
  const notifications = user
    ? auth.notifications.map((n) => ({ id: n.id, title: n.title, message: n.body, timestamp: timeAgo(n.createdAt), read: n.read, link: n.link }))
    : [];
  const unreadCount = user ? auth.unread : 0;
  const openNotification = (n: { id: string; link: string }) => {
    if (user) {
      auth.markRead(n.id);
      setIsNotifOpen(false);
      const [kind, ref] = n.link.split(/:(.*)/s);
      const routes: Record<string, string> = {
        post: 'community',
        settings: n.link,
        job: `jobs:view:${ref}`,
        jobs: n.link,
        event: `events:${ref}`,
        payment: `payment:${ref}`,
        booking: `consultations:${ref}`,
        consultations: n.link,
        earnings: 'earnings',
        books: n.link,
        creator: 'creator',
        messages: n.link,
        support: n.link,
        business: n.link,
        suppliers: n.link,
        user: `specialists:${ref}`,
        admin: ref ? `portal:${ref}` : 'portal'
      };
      if (routes[kind]) go(routes[kind]);
    } else markNotificationRead(n.id);
  };

  useEffect(() => {
    setIsMobileOpen(false);
    setIsNotifOpen(false);
    setIsAccountOpen(false);
  }, [currentView]);

  const go = (view: string) => {
    onNavigate(view);
    setIsMobileOpen(false);
  };

  const tone = overlay
    ? {
        bar: 'absolute inset-x-0 top-0 bg-transparent text-white',
        muted: 'text-white/70',
        link: 'text-white/80 hover:text-white',
        linkActive: 'text-white',
        chip: 'border-white/25 bg-white/10 text-white backdrop-blur-md',
        chipActive: 'bg-white text-ink',
        icon: 'text-white/85 hover:bg-white/15'
      }
    : {
        bar: 'sticky top-0 bg-canvas/90 backdrop-blur-md border-b border-stone-200/80 text-ink',
        muted: 'text-slate-500',
        link: 'text-slate-500 hover:text-ink',
        linkActive: 'text-ink',
        chip: 'border-stone-200 bg-white text-ink',
        chipActive: 'bg-ink text-white',
        icon: 'text-slate-600 hover:bg-stone-100'
      };

  return (
    <header className={`${tone.bar} z-40`}>
      <div className="max-w-[1320px] mx-auto px-4 sm:px-8 lg:px-12 h-20 flex items-center justify-between gap-4">
        {/* Brand + contact */}
        <div className="flex items-center gap-10 shrink-0">
          <button onClick={() => go('landing')} className="flex items-center gap-2.5 rounded-full" aria-label="Agro Inspo home">
            <BrandMark className="w-7 h-7" />
            <span className="font-display text-[19px] font-medium tracking-tight">Agro Inspo</span>
          </button>
        </div>

        {/* Center links */}
        <nav className="hidden xl:flex items-center gap-6 text-[13px]" aria-label="Primary">
          {NAV_LINKS.filter((l) => l.view !== 'landing').map((l) => (
            <button
              key={l.view}
              onClick={() => go(l.view)}
              aria-current={currentView.split(':')[0] === l.view ? 'page' : undefined}
              className={`relative py-1 transition-colors ${currentView.split(':')[0] === l.view ? tone.linkActive : tone.link}`}
            >
              {l.label}
              {currentView.split(':')[0] === l.view && !overlay && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-ink" />
              )}
            </button>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Currency */}
          <div className={`hidden sm:flex items-center p-0.5 rounded-full border text-[11px] font-medium ${tone.chip}`}>
            {(['NGN', 'USD'] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                aria-pressed={currency === c}
                className={`px-2.5 py-1 rounded-full transition-colors ${currency === c ? tone.chipActive : 'opacity-70 hover:opacity-100'}`}
              >
                {c === 'NGN' ? '₦ NGN' : '$ USD'}
              </button>
            ))}
          </div>

          {/* Notifications: only for a signed-in member. Visitors were seeing demo alerts. */}
          {user && (
          <div className="relative">
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className={`relative p-2.5 rounded-full transition-colors ${tone.icon}`}
              aria-label={`Notifications, ${unreadCount} unread`}
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-lime ring-2 ring-ink/10" />
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white text-ink rounded-2xl shadow-xl border border-stone-200 p-2 z-50">
                <div className="flex items-center justify-between px-2.5 py-2">
                  <span className="text-xs font-medium">Notifications</span>
                  {user && unreadCount > 0 ? (
                    <button onClick={auth.markAllRead} className="text-[11px] text-slate-500 hover:text-ink underline underline-offset-2">
                      Mark all read
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-500 font-mono-numbers">{unreadCount} unread</span>
                  )}
                </div>
                {notifications.length === 0 && (
                  <p className="px-2.5 pb-3 text-[12px] text-slate-500">You’re all caught up. Replies, likes and account updates show up here.</p>
                )}
                <div className="max-h-72 overflow-y-auto">
                  {notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => openNotification(n)}
                      className="w-full text-left px-2.5 py-2.5 rounded-xl hover:bg-stone-50 transition-colors flex gap-2.5"
                    >
                      <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${n.read ? 'bg-transparent' : 'bg-ink'}`} />
                      <span className="min-w-0">
                        <span className="flex justify-between gap-2 text-[12px]">
                          <span className={n.read ? 'text-slate-600' : 'font-medium'}>{n.title}</span>
                          <span className="text-slate-400 font-mono-numbers shrink-0">{n.timestamp}</span>
                        </span>
                        <span className="block text-[11px] leading-relaxed text-slate-500 mt-0.5">{n.message}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          )}

          {/* Account menu (signed in) */}
          {user && (
            <div className="relative">
              <button
                onClick={() => {
                  setIsAccountOpen(!isAccountOpen);
                  setIsNotifOpen(false);
                }}
                aria-expanded={isAccountOpen}
                aria-label="Account menu"
                className={`flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full border transition-colors ${tone.chip}`}
              >
                <Avatar name={user.name} src={user.avatarUrl} size={28} className="!bg-lime" />
                <span className="hidden sm:inline text-xs font-medium max-w-[110px] truncate">{firstName(user.name)}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </button>
              {isAccountOpen && (
                <div className="absolute right-0 mt-2 w-64 max-h-[80vh] overflow-y-auto bg-white text-ink rounded-2xl shadow-xl border border-stone-200 p-2 z-50">
                  <div className="px-3 py-2.5">
                    <p className="text-[13px] font-medium truncate">{user.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user.email} · <span className="capitalize">{user.role}</span></p>
                  </div>
                  {[
                    { icon: LayoutGrid, label: 'My portal', view: 'portal' },
                    { icon: MessagesSquare, label: 'Community', view: 'community' },
                    ['farmer', 'business', 'admin'].includes(user.role)
                      ? { icon: Briefcase, label: 'My job listings', view: 'jobs:mine' }
                      : { icon: Briefcase, label: 'My applications', view: 'jobs:applications' },
                    { icon: CalendarDays, label: 'My events', view: 'events:mine' },
                    { icon: Video, label: 'Consultations', view: 'consultations' },
                    { icon: Mail, label: 'Messages', view: 'messages' },
                    ...(user.role !== 'admin' ? [{ icon: Wallet, label: 'Earnings & payouts', view: 'earnings' }] : []),
                    { icon: BookOpen, label: 'My library', view: 'books:library' },
                    ...(user.role !== 'admin' ? [{ icon: Award, label: 'Creator screening', view: 'creator' }] : []),
                    ...(user.role === 'business' || user.team?.memberOf ? [{ icon: Store, label: 'Business dashboard', view: 'business' }]
                      : user.team?.invites ? [{ icon: Store, label: `Business invitations (${user.team.invites})`, view: 'business' }] : []),
                    ...(user.role === 'specialist' ? [{ icon: Megaphone, label: 'Adverts & sponsorship', view: 'business:ads' }] : []),
                    { icon: LifeBuoy, label: 'Help & support', view: 'support' },
                    { icon: Settings, label: 'Settings', view: 'settings' }
                  ].map(({ icon: Icon, label, view }) => (
                    <button key={view} onClick={() => go(view)} className="w-full flex items-center gap-2.5 px-3 h-10 rounded-xl hover:bg-stone-50 text-[13px] text-left">
                      <Icon className="w-4 h-4" /> {label}
                    </button>
                  ))}
                  <button
                    onClick={async () => {
                      setIsAccountOpen(false);
                      await auth.logout();
                      go('landing');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 h-10 rounded-xl hover:bg-stone-50 text-[13px] text-left border-t border-stone-100 mt-1"
                  >
                    <LogOut className="w-4 h-4" /> Log out
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Primary: lime pill with dot, as in the reference "Log in" */}
          {!user && !auth.loading && (
            <button onClick={() => go('auth:login')} className={`hidden md:inline text-xs px-2 transition-colors ${tone.link}`}>
              Log in
            </button>
          )}
          <button
            onClick={() => go(user ? 'portal' : 'auth:signup')}
            className="hidden sm:flex items-center gap-2 h-9 pl-3.5 pr-4 bg-lime hover:bg-lime-deep text-ink text-xs font-medium rounded-full transition-colors whitespace-nowrap"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-ink" />
            {user ? 'My Portal' : 'Join'}
          </button>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className={`xl:hidden p-2.5 rounded-full transition-colors ${tone.icon}`}
            aria-label={isMobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileOpen}
          >
            {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile sheet */}
      {isMobileOpen && (
        <div className="xl:hidden absolute inset-x-3 top-[4.5rem] bg-white text-ink rounded-2xl border border-stone-200 shadow-xl p-2 z-50">
          {NAV_LINKS.map((l) => (
            <button
              key={l.view}
              onClick={() => go(l.view)}
              className={`w-full text-left px-4 py-3 rounded-xl text-[15px] ${
                currentView.split(':')[0] === l.view ? 'bg-stone-100 font-medium' : 'hover:bg-stone-50'
              }`}
            >
              {l.label}
            </button>
          ))}
          <div className="flex items-center justify-between gap-2 p-2 pt-3 mt-1 border-t border-stone-100">
            <div className="flex items-center p-0.5 rounded-full border border-stone-200 text-[11px] font-medium">
              {(['NGN', 'USD'] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={`px-3 py-1.5 rounded-full ${currency === c ? 'bg-ink text-white' : 'text-slate-500'}`}
                >
                  {c === 'NGN' ? '₦ NGN' : '$ USD'}
                </button>
              ))}
            </div>
            <button
              onClick={() => go(user ? 'portal' : 'auth:signup')}
              className="flex items-center gap-2 h-10 px-4 bg-lime text-ink text-sm font-medium rounded-full"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-ink" />
              {user ? 'My Portal' : 'Join'}
            </button>
          </div>
          <div className="flex gap-2 px-2 pb-2">
            {user ? (
              <>
                <button onClick={() => go('settings')} className="flex-1 h-10 rounded-full border border-stone-200 text-[13px]">
                  Settings
                </button>
                <button onClick={async () => (await auth.logout(), go('landing'))} className="flex-1 h-10 rounded-full border border-stone-200 text-[13px]">
                  Log out
                </button>
              </>
            ) : (
              <button onClick={() => go('auth:login')} className="flex-1 h-10 rounded-full border border-stone-200 text-[13px]">
                Log in
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
