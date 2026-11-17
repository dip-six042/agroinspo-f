import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api, ApiError, GOAL_LABELS, TOPIC_LABELS, timeAgo } from '../../lib/api';
import { Avatar, Button, Chip, Field, inputClass, Kicker, Notice, textareaClass } from '../ui';
import { EmailVerifyBanner } from './CommunityView';

type Tab = 'profile' | 'privacy' | 'notifications' | 'security' | 'safety' | 'moderation';
const TABS: { id: Tab; label: string }[] = [
  { id: 'profile', label: 'Profile' },
  { id: 'privacy', label: 'Privacy' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'security', label: 'Password & sessions' },
  { id: 'safety', label: 'Muted & blocked' },
  { id: 'moderation', label: 'Moderation' }
];

const Toggle: React.FC<{ id: string; label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }> = ({ id, label, hint, checked, onChange }) => (
  <div className="flex items-start justify-between gap-6 py-4 border-b border-stone-200">
    <div>
      <label htmlFor={id} className="text-[14px] font-medium cursor-pointer">
        {label}
      </label>
      <p className="text-[12px] text-slate-500 mt-0.5">{hint}</p>
    </div>
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full shrink-0 transition-colors ${checked ? 'bg-ink' : 'bg-stone-300'}`}
    >
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  </div>
);

export const SettingsView: React.FC<{ initialTab?: string; onNavigate: (v: string) => void }> = ({ initialTab, onNavigate }) => {
  const { user, updateMe, logout } = useAuth();
  const [tab, setTab] = useState<Tab>((TABS.find((t) => t.id === initialTab)?.id as Tab) || 'profile');
  const [msg, setMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-[32px]">Log in to manage your settings.</h1>
        <Button variant="lime" className="mt-6" onClick={() => onNavigate('auth:login')}>
          Log in
        </Button>
      </div>
    );
  }

  const save = async (patch: Record<string, unknown>, ok = 'Saved.') => {
    setMsg(null);
    try {
      await updateMe(patch);
      setMsg({ tone: 'success', text: ok });
    } catch (e) {
      setMsg({ tone: 'error', text: e instanceof ApiError ? e.message : 'Couldn’t save.' });
    }
  };

  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-8 lg:px-12 py-12 sm:py-16">
      <Kicker>Account</Kicker>
      <h1 className="mt-4 font-display text-[34px] sm:text-[48px] font-normal leading-[1.05] tracking-[-0.03em]">Settings</h1>

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-10">
        <nav aria-label="Settings sections" className="flex lg:flex-col gap-1 overflow-x-auto -mx-1 px-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => (setTab(t.id), setMsg(null))}
              aria-current={tab === t.id ? 'page' : undefined}
              className={`text-left whitespace-nowrap h-10 px-4 rounded-full text-[13px] transition-colors ${
                tab === t.id ? 'bg-ink text-white' : 'hover:bg-stone-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="min-w-0 max-w-2xl">
          <div className="mb-6">
            <EmailVerifyBanner />
          </div>
          {msg && <Notice tone={msg.tone} className="mb-6">{msg.text}</Notice>}
          {tab === 'profile' && <ProfileTab save={save} />}
          {tab === 'privacy' && (
            <section>
              <h2 className="font-display text-[24px]">Privacy</h2>
              <div className="mt-4">
                <div className="py-4 border-b border-stone-200">
                  <p className="text-[14px] font-medium">Who can see your profile</p>
                  <div className="mt-3 flex gap-2">
                    {(['members', 'public'] as const).map((v) => (
                      <Chip key={v} selected={user.privacy.profileVisibility === v} onClick={() => save({ privacy: { profileVisibility: v } })}>
                        {v === 'members' ? 'Signed-in members' : 'Anyone'}
                      </Chip>
                    ))}
                  </div>
                </div>
                <Toggle id="pv-loc" label="Show my location" hint="Others see your town and state on your profile." checked={user.privacy.showLocation} onChange={(v) => save({ privacy: { showLocation: v } })} />
                <Toggle id="pv-act" label="Show my interests" hint="Others see the topics you follow." checked={user.privacy.showActivity} onChange={(v) => save({ privacy: { showActivity: v } })} />
              </div>
              <p className="mt-6 text-[12px] text-slate-500">Your email and phone number are never shown to other members.</p>
            </section>
          )}
          {tab === 'notifications' && (
            <section>
              <h2 className="font-display text-[24px]">Notifications</h2>
              <div className="mt-4">
                <Toggle id="n-com" label="Comments and replies" hint="When someone comments on your post or replies to you." checked={user.notificationPrefs.comments} onChange={(v) => save({ notificationPrefs: { comments: v } })} />
                <Toggle id="n-like" label="Likes" hint="When someone likes your post." checked={user.notificationPrefs.likes} onChange={(v) => save({ notificationPrefs: { likes: v } })} />
                <Toggle id="n-fol" label="New followers" hint="When someone follows you." checked={user.notificationPrefs.follows} onChange={(v) => save({ notificationPrefs: { follows: v } })} />
                <Toggle id="n-email" label="Email me too" hint="Send important updates to your inbox as well as in the app." checked={user.notificationPrefs.email} onChange={(v) => save({ notificationPrefs: { email: v } })} />
              </div>
              <p className="mt-6 text-[12px] text-slate-500">Account, security and moderation notices are always sent.</p>
            </section>
          )}
          {tab === 'security' && <SecurityTab onLogout={async () => (await logout(), onNavigate('landing'))} />}
          {tab === 'safety' && <SafetyTab />}
          {tab === 'moderation' && <ModerationTab />}
        </div>
      </div>
    </div>
  );
};

const ProfileTab: React.FC<{ save: (p: Record<string, unknown>, ok?: string) => Promise<void> }> = ({ save }) => {
  const { user } = useAuth();
  const [f, setF] = useState({
    name: user!.name,
    title: user!.title,
    location: user!.location,
    bio: user!.bio,
    interests: user!.interests,
    goals: user!.goals
  });
  const [busy, setBusy] = useState(false);
  const toggle = (k: 'interests' | 'goals', v: string) =>
    setF((s) => ({ ...s, [k]: s[k].includes(v) ? s[k].filter((x) => x !== v) : [...s[k], v] }));
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        await save(f, 'Profile saved.');
        setBusy(false);
      }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4">
        <Avatar name={f.name} src={user!.avatarUrl} size={64} />
        <div>
          <p className="text-[15px] font-medium">{user!.email}</p>
          <p className="text-[12px] text-slate-500 capitalize">{user!.role} account · joined {timeAgo(user!.createdAt)}</p>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-5">
        <Field id="p-name" label="Name">
          <input id="p-name" className={inputClass} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} maxLength={80} />
        </Field>
        <Field id="p-title" label="Headline">
          <input id="p-title" className={inputClass} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} maxLength={120} />
        </Field>
        <Field id="p-loc" label="Location">
          <input id="p-loc" className={inputClass} value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} maxLength={120} />
        </Field>
      </div>
      <Field id="p-bio" label="About you" hint="Up to 1,000 characters.">
        <textarea id="p-bio" rows={4} className={textareaClass} value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} maxLength={1000} />
      </Field>
      <div>
        <p className="text-[13px] font-medium mb-2">Interests</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(TOPIC_LABELS).map(([k, l]) => (
            <Chip key={k} selected={f.interests.includes(k)} onClick={() => toggle('interests', k)}>
              {l}
            </Chip>
          ))}
        </div>
      </div>
      <div>
        <p className="text-[13px] font-medium mb-2">Goals</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(GOAL_LABELS).map(([k, l]) => (
            <Chip key={k} selected={f.goals.includes(k)} onClick={() => toggle('goals', k)}>
              {l}
            </Chip>
          ))}
        </div>
      </div>
      <Button type="submit" variant="lime" busy={busy}>
        Save profile
      </Button>
    </form>
  );
};

const SecurityTab: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  return (
    <section>
      <h2 className="font-display text-[24px]">Password &amp; sessions</h2>
      <form
        className="mt-6 space-y-5 max-w-md"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setMsg(null);
          try {
            await api.post('/me/password', { currentPassword: cur, newPassword: next });
            setMsg({ tone: 'success', text: 'Password changed. Other devices have been signed out.' });
            setCur('');
            setNext('');
          } catch (err) {
            setMsg({ tone: 'error', text: err instanceof ApiError ? err.message : 'Couldn’t change password.' });
          } finally {
            setBusy(false);
          }
        }}
      >
        <Field id="pw-cur" label="Current password">
          <input id="pw-cur" type="password" autoComplete="current-password" className={inputClass} value={cur} onChange={(e) => setCur(e.target.value)} />
        </Field>
        <Field id="pw-new" label="New password" hint="At least 10 characters.">
          <input id="pw-new" type="password" autoComplete="new-password" className={inputClass} value={next} onChange={(e) => setNext(e.target.value)} />
        </Field>
        {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
        <Button type="submit" busy={busy}>
          Change password
        </Button>
      </form>
      <div className="mt-10 pt-6 border-t border-stone-200">
        <Button variant="outline" onClick={onLogout}>
          Log out on this device
        </Button>
      </div>
    </section>
  );
};

const SafetyTab: React.FC = () => {
  const [data, setData] = useState<{ muted: { id: string; name: string }[]; blocked: { id: string; name: string }[] } | null>(null);
  const load = () => api.get<any>('/me/follows').then(setData).catch(() => setData({ muted: [], blocked: [] }));
  useEffect(() => {
    load();
  }, []);
  const undo = async (id: string, kind: 'mute' | 'block') => {
    await api.post('/blocks', { userId: id, kind }).catch(() => {});
    load();
  };
  const List = ({ title, items, kind }: { title: string; items: { id: string; name: string }[]; kind: 'mute' | 'block' }) => (
    <div className="mt-6">
      <h3 className="text-[14px] font-medium">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-2 text-[13px] text-slate-500">Nobody yet.</p>
      ) : (
        <ul className="mt-2 border-t border-stone-200">
          {items.map((u) => (
            <li key={u.id} className="flex items-center justify-between py-3 border-b border-stone-200">
              <span className="flex items-center gap-3 text-[14px]">
                <Avatar name={u.name} size={32} />
                {u.name}
              </span>
              <Button variant="outline" className="h-9" onClick={() => undo(u.id, kind)}>
                {kind === 'mute' ? 'Unmute' : 'Unblock'}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
  return (
    <section>
      <h2 className="font-display text-[24px]">Muted &amp; blocked</h2>
      <p className="mt-2 text-[13px] text-slate-500">Muting hides someone’s posts from you. Blocking also stops them seeing your posts or replying to you.</p>
      {data ? (
        <>
          <List title="Muted" items={data.muted} kind="mute" />
          <List title="Blocked" items={data.blocked} kind="block" />
        </>
      ) : (
        <p className="mt-6 text-[13px] text-slate-500">Loading…</p>
      )}
    </section>
  );
};

interface Decision {
  reportId: string;
  targetType: string;
  reason: string;
  action: string;
  note: string;
  decidedAt: string;
  appeal: { id: string; status: string; note: string } | null;
}

const ModerationTab: React.FC = () => {
  const [items, setItems] = useState<Decision[] | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const load = () => api.get<{ decisions: Decision[] }>('/me/moderation').then((r) => setItems(r.decisions)).catch(() => setItems([]));
  useEffect(() => {
    load();
  }, []);
  const appeal = async (id: string) => {
    try {
      await api.post('/appeals', { reportId: id, message: drafts[id] || '' });
      load();
    } catch (e) {
      setErrors({ ...errors, [id]: e instanceof ApiError ? e.message : 'Couldn’t submit.' });
    }
  };
  const label: Record<string, string> = { remove_content: 'Content removed', suspend_user: 'Account suspended' };
  return (
    <section>
      <h2 className="font-display text-[24px]">Moderation decisions</h2>
      <p className="mt-2 text-[13px] text-slate-500">Actions our moderators took on your content or account. You can appeal each decision once.</p>
      {items === null ? (
        <p className="mt-6 text-[13px] text-slate-500">Loading…</p>
      ) : items.length === 0 ? (
        <Notice className="mt-6">You have no moderation decisions. Thanks for keeping the community useful.</Notice>
      ) : (
        <ul className="mt-6 space-y-4">
          {items.map((d) => (
            <li key={d.reportId} className="rounded-2xl border border-stone-200 p-5">
              <p className="text-[14px] font-medium">{label[d.action] ?? d.action}</p>
              <p className="text-[12px] text-slate-500 mt-0.5">
                Reason: {d.reason} · {timeAgo(d.decidedAt)}
              </p>
              <p className="mt-3 text-[13px] leading-relaxed">{d.note}</p>
              {d.appeal ? (
                <Notice className="mt-4" tone={d.appeal.status === 'overturned' ? 'success' : 'info'}>
                  Appeal {d.appeal.status === 'open' ? 'under review' : d.appeal.status === 'overturned' ? 'successful' : 'not successful'}.
                  {d.appeal.note && ` ${d.appeal.note}`}
                </Notice>
              ) : (
                <div className="mt-4">
                  <label htmlFor={`ap-${d.reportId}`} className="text-[13px] font-medium">
                    Appeal this decision
                  </label>
                  <textarea
                    id={`ap-${d.reportId}`}
                    rows={3}
                    className={`${textareaClass} mt-1.5`}
                    placeholder="Explain why you think this decision was wrong (at least 10 characters)"
                    value={drafts[d.reportId] || ''}
                    onChange={(e) => setDrafts({ ...drafts, [d.reportId]: e.target.value })}
                  />
                  {errors[d.reportId] && <Notice tone="error" className="mt-2">{errors[d.reportId]}</Notice>}
                  <Button className="mt-3" onClick={() => appeal(d.reportId)}>
                    Submit appeal
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
