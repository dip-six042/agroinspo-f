import React, { useEffect, useState } from 'react';
import { UserPlus } from 'lucide-react';
import { api, ApiError, BusinessInvite, TeamData, TEAM_ROLE_LABELS } from '../../../lib/api';
import { Avatar, Button, Field, inputClass, Notice, Pill, selectClass } from '../../ui';

/** Team management for the business owner and its admins. */
export const TeamTab: React.FC<{ myRole: string }> = ({ myRole }) => {
  const [t, setT] = useState<TeamData | null>(null);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('sales');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const load = () => api.get<TeamData>('/business/team').then(setT).catch((e: ApiError) => setMsg({ tone: 'error', text: e.message }));
  useEffect(() => {
    load();
  }, []);
  const isOwner = myRole === 'owner';
  const run = async (fn: () => Promise<TeamData>, ok: string) => {
    setMsg(null);
    try {
      setT({ ...(await fn()), myRole });
      setMsg({ tone: 'success', text: ok });
    } catch (e) {
      setMsg({ tone: 'error', text: e instanceof ApiError ? e.message : 'Something went wrong.' });
    }
  };
  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    await run(() => api.post<TeamData>('/business/team/invites', { email, role }), `Invitation sent to ${email}. They accept it from their Business dashboard after logging in with that address.`);
    setEmail('');
    setBusy(false);
  };
  if (!t) return msg ? <Notice tone={msg.tone}>{msg.text}</Notice> : <p className="text-[13px] text-slate-500">Loading…</p>;

  const roleOptions = Object.entries(t.roles).filter(([k]) => isOwner || k !== 'admin');
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-10">
      <section>
        <h2 className="text-[15px] font-medium">People who can act for this business</h2>
        <p className="mt-1 text-[13px] text-slate-600">Each person uses their own login. Everything they do is recorded under their name.</p>
        {msg && <Notice tone={msg.tone} className="mt-4">{msg.text}</Notice>}
        <ul className="mt-4 rounded-3xl border border-stone-200 bg-white divide-y divide-stone-100">
          <li className="p-4 flex flex-wrap items-center gap-3">
            <Avatar name={t.owner.name} size={36} />
            <span className="flex-1 min-w-0"><span className="block text-[14px] font-medium">{t.owner.name}</span><span className="block text-[12px] text-slate-500 truncate">{t.owner.email} · the business account</span></span>
            <Pill tone="lime">Owner</Pill>
          </li>
          {t.members.map((m) => {
            const canEdit = isOwner || m.role !== 'admin';
            return (
              <li key={m.id} className="p-4 flex flex-wrap items-center gap-3">
                <Avatar name={m.name} size={36} />
                <span className="flex-1 min-w-0">
                  <span className="block text-[14px] font-medium">{m.name}{m.status !== 'active' && <span className="text-rose-700 font-normal"> · suspended</span>}</span>
                  <span className="block text-[12px] text-slate-500 truncate">{m.email} · since {new Date(m.since).toLocaleDateString('en-NG', { month: 'short', year: 'numeric' })}{m.addedBy ? ` · added by ${m.addedBy}` : ''}</span>
                </span>
                {canEdit ? (
                  <>
                    <label htmlFor={`role-${m.id}`} className="sr-only">Role for {m.name}</label>
                    <select id={`role-${m.id}`} className={`${selectClass} h-9 text-[12px]`} value={m.role}
                      onChange={(e) => run(() => api.patch<TeamData>(`/business/team/${m.id}`, { role: e.target.value }), `${m.name} is now ${TEAM_ROLE_LABELS[e.target.value]}.`)}>
                      {roleOptions.map(([k, r]) => <option key={k} value={k}>{r.label}</option>)}
                    </select>
                    <Button variant="ghost" className="h-9" onClick={() => run(() => api.del<TeamData>(`/business/team/${m.id}`), `${m.name} was removed. Their access ended immediately.`)}>Remove</Button>
                  </>
                ) : <Pill>{TEAM_ROLE_LABELS[m.role]}</Pill>}
              </li>
            );
          })}
        </ul>
        {t.invites.length > 0 && (
          <>
            <h3 className="mt-8 text-[14px] font-medium">Pending invitations</h3>
            <ul className="mt-2 space-y-2">
              {t.invites.map((i) => (
                <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-mist px-4 py-3 text-[13px]">
                  <span>{i.email} · {TEAM_ROLE_LABELS[i.role]} <span className="text-slate-500">· {i.expired ? 'expired' : `expires ${new Date(i.expiresAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}`}</span></span>
                  <button className="text-[12px] underline" onClick={() => run(() => api.del<TeamData>(`/business/team/invites/${i.id}`), 'Invitation cancelled.')}>Cancel</button>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
      <aside className="space-y-4">
        <form onSubmit={invite} className="rounded-3xl border border-stone-200 bg-white p-6 space-y-3">
          <div className="flex items-center gap-2"><UserPlus className="w-4 h-4" /><h2 className="text-[15px] font-medium">Invite someone</h2></div>
          <Field id="tm-email" label="Their email address"><input id="tm-email" type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
          <fieldset>
            <legend className="text-[13px] font-medium">Role</legend>
            <div className="mt-2 space-y-2">
              {roleOptions.map(([k, r]) => (
                <label key={k} className={`block rounded-2xl border p-3 cursor-pointer text-[12px] ${role === k ? 'border-ink bg-mist' : 'border-stone-200'}`}>
                  <input type="radio" name="tm-role" className="sr-only" checked={role === k} onChange={() => setRole(k)} />
                  <span className="block text-[13px] font-medium">{r.label}</span><span className="text-slate-600">{r.description}</span>
                </label>
              ))}
            </div>
          </fieldset>
          {!isOwner && <p className="text-[11px] text-slate-500">Only the owner can add or change admins.</p>}
          <Button type="submit" variant="lime" busy={busy} className="w-full">Send invitation</Button>
        </form>
        <p className="text-[12px] text-slate-500 px-1">The invitation only works for someone signed in with that exact, confirmed email address. It expires after 14 days.</p>
      </aside>
    </div>
  );
};

/** Invitations addressed to the signed-in person. */
export const InvitesPanel: React.FC<{ invites: BusinessInvite[]; emailVerified: boolean; onDone: (businessId?: string) => void }> = ({ invites, emailVerified, onDone }) => {
  const [error, setError] = useState('');
  const decide = async (i: BusinessInvite, action: 'accept' | 'decline') => {
    setError('');
    try {
      await api.post(`/business-invites/${i.id}/${action}`);
      onDone(action === 'accept' ? i.business.id : undefined);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong.');
    }
  };
  if (!emailVerified) return <Notice>Confirm your email address to see business invitations sent to it.</Notice>;
  if (!invites.length) return null;
  return (
    <div className="rounded-3xl border border-ink bg-white p-6">
      <h2 className="text-[15px] font-medium">Invitations</h2>
      <ul className="mt-3 space-y-3">
        {invites.map((i) => (
          <li key={i.id} className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-[14px]"><span className="font-medium">{i.business.name}</span> invited you as <span className="font-medium">{i.roleLabel}</span>{i.invitedBy ? ` (from ${i.invitedBy})` : ''}</span>
            <span className="flex gap-2">
              <Button variant="lime" className="h-9" onClick={() => decide(i, 'accept')}>Accept</Button>
              <Button variant="ghost" className="h-9" onClick={() => decide(i, 'decline')}>Decline</Button>
            </span>
          </li>
        ))}
      </ul>
      {error && <Notice tone="error" className="mt-3">{error}</Notice>}
    </div>
  );
};
