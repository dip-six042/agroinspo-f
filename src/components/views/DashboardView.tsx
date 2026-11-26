import React, { useEffect, useState } from 'react';
import {
  ArrowRight, Bell, Briefcase, CalendarDays, Inbox, Mail, Radio, Sparkles, UserSearch, Video, Wallet, type LucideIcon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  api, Balances, Booking, BOOKING_STATUS_LABELS, EventItem, firstName, Job, JOB_STATUS_LABELS, APPLICATION_STATUS_LABELS,
  Lead, Post, TOPIC_LABELS, timeAgo
} from '../../lib/api';
import { naira, Pill } from '../ui';

type Application = { id: string; jobId: string; title: string; employer: string; location: string; status: string; createdAt: string };

interface Data {
  bookings: Booking[];
  events: EventItem[];
  hosting: EventItem[];
  balances: Balances | null;
  unreadMessages: number;
  jobs: Job[];
  applications: Application[];
  leads: Lead[];
  posts: Post[];
}

const EMPTY: Data = { bookings: [], events: [], hosting: [], balances: null, unreadMessages: 0, jobs: [], applications: [], leads: [], posts: [] };

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};
const dayTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

/** Fetches what the dashboard needs. A failing call leaves its section empty instead of breaking the page. */
function useDashboardData(role: string) {
  const [data, setData] = useState<Data | null>(null);
  useEffect(() => {
    let live = true;
    const get = <T,>(path: string, pick: (r: any) => T, fallback: T) => api.get<any>(path).then(pick).catch(() => fallback);
    const earns = role !== 'enthusiast';
    const hosts = role === 'specialist' || role === 'business';
    Promise.all([
      get('/me/bookings', (r) => r.bookings as Booking[], []),
      get('/events?when=mine', (r) => r.events as EventItem[], []),
      hosts ? get('/events?when=hosting', (r) => r.events as EventItem[], []) : Promise.resolve([] as EventItem[]),
      earns ? get('/me/earnings', (r) => r.balances as Balances, null) : Promise.resolve(null),
      get('/conversations', (r) => Number(r.unreadTotal) || 0, 0),
      role === 'farmer' || role === 'business' ? get('/me/jobs', (r) => r.jobs as Job[], []) : Promise.resolve([] as Job[]),
      role === 'enthusiast' || role === 'farmer' ? get('/me/applications', (r) => r.applications as Application[], []) : Promise.resolve([] as Application[]),
      role === 'business' ? get('/me/leads', (r) => r.leads as Lead[], []) : Promise.resolve([] as Lead[]),
      get('/posts', (r) => (r.posts as Post[]).slice(0, 3), [])
    ]).then(([bookings, events, hosting, balances, unreadMessages, jobs, applications, leads, posts]) => {
      if (live) setData({ bookings, events, hosting, balances, unreadMessages, jobs, applications, leads, posts });
    });
    return () => {
      live = false;
    };
  }, [role]);
  return data;
}

const Card: React.FC<{ title: string; action?: { label: string; onClick: () => void }; children: React.ReactNode; className?: string }> = ({
  title, action, children, className = ''
}) => (
  <section className={`min-w-0 rounded-3xl bg-white border border-stone-200 p-6 ${className}`}>
    <div className="flex items-center justify-between gap-3">
      <h2 className="font-display text-[18px] font-normal tracking-[-0.01em]">{title}</h2>
      {action && (
        <button onClick={action.onClick} className="inline-flex items-center gap-1 text-[12px] text-slate-500 hover:text-ink">
          {action.label} <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
    <div className="mt-4">{children}</div>
  </section>
);

const Empty: React.FC<{ children: React.ReactNode }> = ({ children }) => <p className="py-6 text-[13px] text-slate-500">{children}</p>;

const Stat: React.FC<{ icon: LucideIcon; label: string; value: string; hint?: string; onClick: () => void; accent?: boolean }> = ({
  icon: Icon, label, value, hint, onClick, accent
}) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-start justify-start text-left rounded-3xl p-5 border transition-colors ${accent ? 'bg-ink text-white border-ink hover:bg-ink-soft' : 'bg-white border-stone-200 hover:border-ink'}`}
  >
    <span className={`inline-flex w-9 h-9 rounded-full items-center justify-center ${accent ? 'bg-lime text-ink' : 'bg-mist text-ink'}`}>
      <Icon className="w-4 h-4" aria-hidden="true" />
    </span>
    <span className="mt-4 block font-mono-numbers text-[28px] leading-none tracking-[-0.02em]">{value}</span>
    <span className={`mt-2 block text-[13px] ${accent ? 'text-white/70' : 'text-slate-500'}`}>{label}</span>
    {hint && <span className={`mt-0.5 block text-[11px] ${accent ? 'text-white/50' : 'text-slate-400'}`}>{hint}</span>}
  </button>
);

const Skeleton = () => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" aria-hidden="true">
    {[0, 1, 2, 3].map((i) => <div key={i} className="h-[150px] rounded-3xl bg-stone-200/50 animate-pulse" />)}
  </div>
);

export const DashboardView: React.FC<{ onNavigate: (v: string) => void }> = ({ onNavigate }) => {
  const auth = useAuth();
  const user = auth.user!;
  const role = user.role;
  const data = useDashboardData(role);
  const d = data ?? EMPTY;
  const now = Date.now();

  const upcomingBookings = d.bookings
    .filter((b) => ['confirmed', 'in_progress', 'payment_pending'].includes(b.status) && new Date(b.endsAt).getTime() > now)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const upcomingEvents = [...d.events, ...d.hosting.filter((h) => !d.events.some((e) => e.id === h.id))]
    .filter((e) => e.status !== 'cancelled' && new Date(e.endsAt).getTime() > now)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const agenda = [
    ...upcomingBookings.map((b) => ({
      id: `b${b.id}`, when: b.startsAt, icon: Video, title: b.serviceTitle,
      sub: b.role === 'specialist' ? `With ${b.client.name}` : `With ${b.specialist.name}`,
      tag: BOOKING_STATUS_LABELS[b.status] ?? b.status, live: b.canJoin, go: `consultations:${b.id}`
    })),
    ...upcomingEvents.map((e) => ({
      id: `e${e.id}`, when: e.startsAt, icon: e.isHost ? Radio : CalendarDays, title: e.title,
      sub: e.isHost ? `You’re hosting · ${e.registeredCount} registered` : `Hosted by ${e.host.name}`,
      tag: e.status === 'live' ? 'Live now' : e.isHost ? 'Hosting' : 'Registered', live: e.status === 'live', go: `events:${e.id}`
    }))
  ].sort((a, b) => a.when.localeCompare(b.when)).slice(0, 5);

  const liveJobs = d.jobs.filter((j) => j.status === 'live');
  const applicants = d.jobs.reduce((n, j) => n + (j.applicantCount ?? 0), 0);
  const newLeads = d.leads.filter((l) => l.status === 'new').length;
  const missing = [!user.title && 'a headline', !user.country && 'your country', !user.avatarUrl && 'a photo', !user.bio && 'a short bio'].filter(Boolean) as string[];

  const stats: React.ComponentProps<typeof Stat>[] = [];
  if (d.balances) stats.push({ icon: Wallet, label: 'Available to pay out', value: naira(d.balances.availableNgn), hint: `${naira(d.balances.pendingNgn)} pending`, onClick: () => onNavigate('earnings'), accent: true });
  stats.push({ icon: Video, label: 'Upcoming consultations', value: String(upcomingBookings.length), onClick: () => onNavigate('consultations') });
  stats.push({ icon: CalendarDays, label: role === 'specialist' || role === 'business' ? 'Upcoming events & webinars' : 'Events you’re attending', value: String(upcomingEvents.length), onClick: () => onNavigate(role === 'specialist' || role === 'business' ? 'events:hosting' : 'events:mine') });
  if (role === 'business') stats.push({ icon: Inbox, label: 'New leads', value: String(newLeads), hint: `${d.leads.length} in total`, onClick: () => onNavigate('business:leads') });
  else if (role === 'farmer') stats.push({ icon: Briefcase, label: 'Live job listings', value: String(liveJobs.length), hint: `${applicants} applicant${applicants === 1 ? '' : 's'}`, onClick: () => onNavigate('jobs:mine') });
  else if (role === 'enthusiast') stats.push({ icon: Briefcase, label: 'Job applications', value: String(d.applications.length), onClick: () => onNavigate('jobs:applications') });
  stats.push({ icon: Mail, label: 'Unread messages', value: String(d.unreadMessages), onClick: () => onNavigate('messages') });
  if (stats.length < 4) stats.push({ icon: Bell, label: 'Unread notifications', value: String(auth.unread), onClick: () => onNavigate('community') });

  const actions: [string, string][] =
    role === 'specialist' ? [['Add open times', 'consultations:services'], ['Host a webinar', 'events:new']]
    : role === 'business' ? [['Add a product', 'business:listings'], ['Create an advert', 'business:ads']]
    : role === 'farmer' ? [['Find an expert', 'specialists'], ['Post a job', 'jobs:new']]
    : [['Find an expert', 'specialists'], ['Browse jobs', 'jobs']];

  return (
    <div className="px-4 sm:px-8 lg:px-10 py-10 max-w-[1240px]">
      {/* Greeting */}
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-[13px] text-slate-500">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
            {user.country ? ` · ${user.country}` : ''}
          </p>
          <h1 className="mt-2 font-display text-[34px] sm:text-[42px] font-normal leading-[1.05] tracking-[-0.03em]">
            {greeting()}, {firstName(user.name)}.
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {actions.map(([label, view], i) => (
            <button
              key={view}
              onClick={() => onNavigate(view)}
              className={`h-11 px-5 rounded-full text-[13px] font-medium transition-colors ${i === 0 ? 'bg-lime hover:bg-lime-deep text-ink' : 'border border-stone-300 hover:border-ink'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {missing.length > 0 && (
        <button
          onClick={() => onNavigate('settings')}
          className="mt-6 w-full flex items-center gap-3 rounded-2xl border border-dashed border-stone-300 bg-white/60 px-5 py-3.5 text-left text-[13px] hover:border-ink"
        >
          <Sparkles className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span className="flex-1">
            Complete your profile: add {missing.slice(0, -1).join(', ')}{missing.length > 1 ? ' and ' : ''}{missing[missing.length - 1]} so people know who they’re talking to.
          </span>
          <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
        </button>
      )}

      {/* Numbers */}
      <div className="mt-8">
        {!data ? <Skeleton /> : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.slice(0, 4).map((s) => <Stat key={s.label} {...s} />)}
          </div>
        )}
      </div>

      <div className="mt-4 grid lg:grid-cols-[1.4fr_1fr] gap-4">
        <Card title="Coming up" action={{ label: 'Calendar', onClick: () => onNavigate(upcomingBookings.length ? 'consultations' : 'events') }}>
          {agenda.length === 0 ? (
            <Empty>Nothing booked yet. Consultations and events you join will show here.</Empty>
          ) : (
            <ul className="divide-y divide-stone-100">
              {agenda.map((a) => (
                <li key={a.id}>
                  <button onClick={() => onNavigate(a.go)} className="w-full flex items-center gap-4 py-3 text-left group">
                    <span className="w-14 shrink-0 text-center">
                      <span className="block text-[11px] uppercase tracking-wide text-slate-400">{new Date(a.when).toLocaleDateString(undefined, { month: 'short' })}</span>
                      <span className="block font-display text-[24px] leading-none">{new Date(a.when).getDate()}</span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 text-[14px] font-medium truncate group-hover:underline underline-offset-4">
                        <a.icon className="w-3.5 h-3.5 shrink-0 text-slate-500" aria-hidden="true" />{a.title}
                      </span>
                      <span className="block text-[12px] text-slate-500 truncate">{dayTime(a.when)} · {a.sub}</span>
                    </span>
                    <Pill tone={a.live ? 'good' : 'neutral'}>{a.tag}</Pill>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Notifications">
          {auth.notifications.length === 0 ? (
            <Empty>You’re all caught up.</Empty>
          ) : (
            <ul className="space-y-3">
              {auth.notifications.slice(0, 5).map((n) => (
                <li key={n.id} className="flex gap-3">
                  <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${n.read ? 'bg-stone-300' : 'bg-ink'}`} />
                  <span className="min-w-0">
                    <span className={`block text-[13px] ${n.read ? 'text-slate-600' : 'font-medium'}`}>{n.title}</span>
                    <span className="block text-[12px] text-slate-500 line-clamp-2">{n.body}</span>
                    <span className="block text-[11px] text-slate-400 mt-0.5">{timeAgo(n.createdAt)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-4 grid lg:grid-cols-2 gap-4">
        {/* Role panel */}
        {role === 'specialist' && d.balances && (
          <Card title="Earnings" action={{ label: 'Statement', onClick: () => onNavigate('earnings') }}>
            <dl className="grid grid-cols-2 gap-4 text-[13px]">
              {[
                ['Earned (gross)', d.balances.grossNgn], ['Platform fee (10%)', d.balances.platformFeesNgn],
                ['Pending', d.balances.pendingNgn], ['Paid out', d.balances.paidOutNgn]
              ].map(([k, v]) => (
                <div key={k as string} className="rounded-2xl bg-mist/60 p-4">
                  <dt className="text-slate-500">{k}</dt>
                  <dd className="mt-1 font-mono-numbers text-[18px]">{naira(v as number)}</dd>
                </div>
              ))}
            </dl>
          </Card>
        )}
        {(role === 'farmer' || role === 'business') && (
          <Card title="Your job listings" action={{ label: 'Manage', onClick: () => onNavigate('jobs:mine') }}>
            {d.jobs.length === 0 ? <Empty>No vacancies yet. Post one to reach agricultural workers in any country.</Empty> : (
              <ul className="divide-y divide-stone-100">
                {d.jobs.slice(0, 4).map((j) => (
                  <li key={j.id} className="py-3 flex items-center justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block text-[14px] font-medium truncate">{j.title}</span>
                      <span className="block text-[12px] text-slate-500">{j.applicantCount ?? 0} applicant{j.applicantCount === 1 ? '' : 's'} · {j.location}</span>
                    </span>
                    <Pill tone={j.status === 'live' ? 'good' : 'neutral'}>{JOB_STATUS_LABELS[j.status] ?? j.status}</Pill>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}
        {role === 'enthusiast' && (
          <Card title="Your applications" action={{ label: 'All applications', onClick: () => onNavigate('jobs:applications') }}>
            {d.applications.length === 0 ? <Empty>You haven’t applied for a job yet. Applying is always free.</Empty> : (
              <ul className="divide-y divide-stone-100">
                {d.applications.slice(0, 4).map((a) => (
                  <li key={a.id} className="py-3 flex items-center justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block text-[14px] font-medium truncate">{a.title}</span>
                      <span className="block text-[12px] text-slate-500">{a.employer} · {timeAgo(a.createdAt)}</span>
                    </span>
                    <Pill>{APPLICATION_STATUS_LABELS[a.status] ?? a.status}</Pill>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}
        {role === 'business' && (
          <Card title="Latest leads" action={{ label: 'All leads', onClick: () => onNavigate('business:leads') }}>
            {d.leads.length === 0 ? <Empty>No enquiries yet. Listings and adverts bring leads here.</Empty> : (
              <ul className="divide-y divide-stone-100">
                {d.leads.slice(0, 4).map((l) => (
                  <li key={l.id} className="py-3 flex items-center justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block text-[14px] font-medium truncate">{l.from.name}</span>
                      <span className="block text-[12px] text-slate-500 truncate">{l.source.label} · {timeAgo(l.createdAt)}</span>
                    </span>
                    <Pill tone={l.status === 'new' ? 'warn' : 'neutral'}>{l.status}</Pill>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}

        {/* Community */}
        <Card title="From the community" action={{ label: 'Open feed', onClick: () => onNavigate('community') }}>
          {d.posts.length === 0 ? <Empty>No posts yet. Start a discussion.</Empty> : (
            <ul className="space-y-4">
              {d.posts.map((p) => (
                <li key={p.id}>
                  <button onClick={() => onNavigate('community')} className="w-full text-left group">
                    <span className="flex items-center gap-2 text-[12px] text-slate-500">
                      <span className="font-medium text-ink">{p.author.name}</span> · {TOPIC_LABELS[p.topic] ?? p.topic} · {timeAgo(p.createdAt)}
                    </span>
                    <span className="mt-1 block text-[13px] text-slate-700 line-clamp-2 group-hover:text-ink">{p.body}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Explore nudge for members without a role panel above */}
        {role === 'specialist' ? null : role === 'enthusiast' && (
          <Card title="Get advice from an expert">
            <p className="text-[13px] text-slate-600">Agronomists, vets and engineers from every country. See their rates first, then meet by video or audio.</p>
            <button onClick={() => onNavigate('specialists')} className="mt-4 inline-flex items-center gap-2 h-10 px-4 rounded-full bg-ink text-white text-[13px]">
              <UserSearch className="w-4 h-4" aria-hidden="true" /> Find an expert
            </button>
          </Card>
        )}
      </div>
    </div>
  );
};
