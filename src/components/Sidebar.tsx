import React from 'react';
import {
  Award, BarChart3, BookOpen, Briefcase, CalendarDays, ClipboardCheck, FileSearch, Flag, Handshake, UserSearch, Inbox,
  LayoutGrid, LifeBuoy, LogOut, Mail, Megaphone, MessagesSquare, Radio, ScrollText, Settings, ShieldCheck, Sprout, Store,
  Users, Video, Wallet, type LucideIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { Me } from '../lib/api';
import { Avatar } from './ui';

type Item = { icon: LucideIcon; label: string; view: string; badge?: number };
type Group = { title: string; items: Item[] };

const ROLE_LABEL: Record<string, string> = {
  farmer: 'Farmer', enthusiast: 'Enthusiast', specialist: 'Specialist', business: 'Business', admin: 'Admin'
};

/** What each kind of member needs, grouped. Shared by the desktop sidebar and the mobile menu. */
export function sidebarGroups(user: Me): Group[] {
  const role = user.role;
  const inTeam = role === 'business' || Boolean(user.team?.memberOf);
  const groups: Group[] = [
    {
      title: 'Home',
      items: [
        { icon: LayoutGrid, label: role === 'admin' ? 'Admin console' : 'Dashboard', view: 'portal' },
        { icon: MessagesSquare, label: 'Community', view: 'community' },
        { icon: Mail, label: 'Messages', view: 'messages' }
      ]
    }
  ];

  if (role === 'admin') {
    groups.push(
      {
        title: 'Moderation',
        items: [
          { icon: Users, label: 'Members', view: 'portal:users' },
          { icon: Flag, label: 'Reports & appeals', view: 'portal:reports' },
          { icon: LifeBuoy, label: 'Support & disputes', view: 'portal:support' },
          { icon: Briefcase, label: 'Job listings', view: 'portal:jobs' }
        ]
      },
      {
        title: 'Checks',
        items: [
          { icon: ShieldCheck, label: 'Specialist checks', view: 'portal:specialists' },
          { icon: ClipboardCheck, label: 'Business checks', view: 'portal:businesses' },
          { icon: Award, label: 'Creator screening', view: 'portal:creators' },
          { icon: BookOpen, label: 'Books', view: 'portal:books' },
          { icon: Megaphone, label: 'Adverts & sponsorship', view: 'portal:ads' }
        ]
      },
      {
        title: 'Money',
        items: [
          { icon: Wallet, label: 'Finance & payouts', view: 'portal:finance' },
          { icon: BarChart3, label: 'Payments', view: 'portal:payments' },
          { icon: Sprout, label: 'Investment portal', view: 'portal:opportunities' },
          { icon: ScrollText, label: 'Audit log', view: 'portal:audit' }
        ]
      }
    );
  } else {
    const work: Item[] = [];
    if (role === 'specialist') {
      work.push(
        { icon: Video, label: 'Consultations', view: 'consultations' },
        { icon: Wallet, label: 'Earnings & payouts', view: 'earnings' },
        { icon: Radio, label: 'Webinars I host', view: 'events:hosting' },
        { icon: BookOpen, label: 'My books', view: 'books:mine' },
        { icon: Megaphone, label: 'Adverts & sponsorship', view: 'business:ads' }
      );
    } else if (inTeam) {
      work.push(
        { icon: Store, label: 'Business dashboard', view: 'business' },
        { icon: Inbox, label: 'Leads', view: 'business:leads' },
        { icon: Megaphone, label: 'Adverts', view: 'business:ads' },
        { icon: Briefcase, label: 'My job listings', view: 'jobs:mine' },
        { icon: Radio, label: 'Webinars I host', view: 'events:hosting' },
        { icon: Wallet, label: 'Earnings & payouts', view: 'earnings' }
      );
    } else if (role === 'farmer') {
      work.push(
        { icon: Video, label: 'My consultations', view: 'consultations' },
        { icon: Briefcase, label: 'My job listings', view: 'jobs:mine' },
        { icon: CalendarDays, label: 'My events', view: 'events:mine' },
        { icon: Wallet, label: 'Earnings & payouts', view: 'earnings' }
      );
    } else {
      work.push(
        { icon: Video, label: 'My consultations', view: 'consultations' },
        { icon: FileSearch, label: 'My applications', view: 'jobs:applications' },
        { icon: CalendarDays, label: 'My events', view: 'events:mine' }
      );
    }
    if (role !== 'business' && user.team?.invites) work.push({ icon: Handshake, label: 'Business invitations', view: 'business', badge: user.team.invites });
    work.push({ icon: BookOpen, label: 'My library', view: 'books:library' });
    if (role !== 'business') work.push({ icon: Award, label: 'Creator screening', view: 'creator' });
    groups.push({ title: role === 'business' ? 'My business' : 'My work', items: work });

    groups.push({
      title: 'Explore',
      items: [
        { icon: UserSearch, label: 'Find an expert', view: 'specialists' },
        { icon: CalendarDays, label: 'Events', view: 'events' },
        { icon: Briefcase, label: 'Jobs', view: 'jobs' },
        { icon: Store, label: 'Suppliers', view: 'suppliers' },
        { icon: BookOpen, label: 'Bookstore', view: 'books' },
        { icon: Sprout, label: 'Investment portal', view: 'opportunities' }
      ]
    });
  }

  groups.push({
    title: 'Account',
    items: [
      { icon: LifeBuoy, label: 'Help & support', view: 'support' },
      { icon: Settings, label: 'Settings', view: 'settings' }
    ]
  });
  return groups;
}

/** The link is current when it matches the view exactly, or is the closest parent of it (events:mine → events). */
function activeView(groups: Group[], current: string) {
  const views = groups.flatMap((g) => g.items.map((i) => i.view));
  if (views.includes(current)) return current;
  const parts = current.split(':');
  for (let n = parts.length - 1; n > 0; n--) {
    const v = parts.slice(0, n).join(':');
    if (views.includes(v)) return v;
  }
  return '';
}

export const SidebarNav: React.FC<{ currentView: string; onNavigate: (v: string) => void; compact?: boolean }> = ({ currentView, onNavigate, compact }) => {
  const auth = useAuth();
  const user = auth.user;
  if (!user) return null;
  const groups = sidebarGroups(user);
  const active = activeView(groups, currentView);

  return (
    <nav aria-label="Account" className="flex flex-col gap-5">
      {groups.map((g) => (
        <div key={g.title}>
          <p className="px-3 mb-1.5 text-[11px] uppercase tracking-[0.08em] text-slate-400">{g.title}</p>
          <ul className="space-y-0.5">
            {g.items.map(({ icon: Icon, label, view, badge }) => {
              const on = active === view;
              return (
                <li key={view + label}>
                  <button
                    onClick={() => onNavigate(view)}
                    aria-current={on ? 'page' : undefined}
                    className={`w-full flex items-center gap-3 px-3 ${compact ? 'h-11' : 'h-10'} rounded-xl text-[13px] text-left transition-colors ${
                      on ? 'bg-ink text-white' : 'text-slate-600 hover:bg-white hover:text-ink'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${on ? 'text-lime' : ''}`} aria-hidden="true" />
                    <span className="flex-1 truncate">{label}</span>
                    {badge ? (
                      <span className="min-w-5 h-5 px-1.5 rounded-full text-[11px] font-medium inline-flex items-center justify-center bg-lime text-ink">
                        {badge > 99 ? '99+' : badge}
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
};

/** Left sidebar shown on every signed-in page (desktop). On smaller screens the same links live in the top menu. */
export const Sidebar: React.FC<{ currentView: string; onNavigate: (v: string) => void }> = ({ currentView, onNavigate }) => {
  const auth = useAuth();
  const user = auth.user;
  if (!user) return null;
  return (
    <aside className="hidden lg:block w-64 shrink-0 border-r border-stone-200/80 bg-mist/40">
      <div className="sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto px-3 py-6 flex flex-col">
        <button
          onClick={() => onNavigate('settings')}
          className="flex items-center gap-3 px-3 py-3 mb-5 rounded-2xl bg-white border border-stone-200 text-left hover:border-ink transition-colors"
        >
          <Avatar name={user.name} src={user.avatarUrl} size={36} className="!bg-lime" />
          <span className="min-w-0">
            <span className="block text-[13px] font-medium truncate">{user.name}</span>
            <span className="block text-[11px] text-slate-500 truncate">
              {ROLE_LABEL[user.role] ?? user.role}{user.country ? ` · ${user.country}` : ''}
            </span>
          </span>
        </button>
        <SidebarNav currentView={currentView} onNavigate={onNavigate} />
        <div className="mt-6 pt-3 border-t border-stone-200/80">
          <button
            onClick={async () => {
              await auth.logout();
              onNavigate('landing');
            }}
            className="w-full flex items-center gap-3 px-3 h-10 rounded-xl text-[13px] text-slate-600 hover:bg-white hover:text-ink"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" /> Log out
          </button>
        </div>
      </div>
    </aside>
  );
};
