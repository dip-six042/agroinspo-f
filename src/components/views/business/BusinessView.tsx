import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { api, ApiError, BusinessInvite, BusinessProfile, getActingBusiness, Listing, MyBusinessLink, setActingBusiness, TEAM_ROLE_LABELS } from '../../../lib/api';
import { Button, Kicker, Notice, Pill, selectClass, WRAP } from '../../ui';
import { ProfileTab } from './ProfileTab';
import { ListingsTab } from './ListingsTab';
import { AdsTab } from './AdsTab';
import { LeadsTab, SponsorshipsTab } from './LeadsSponsorTabs';
import { InvitesPanel, TeamTab } from './TeamTab';

interface MyBusiness { profile: BusinessProfile; listings: Listing[]; newLeads: number; canAdvertise: boolean; categories: Record<string, string>; myRole: string; permissions: string[] }
interface Memberships { businesses: MyBusinessLink[]; invites: BusinessInvite[]; emailVerified: boolean }

const TAB_PERMS: [string, string, string][] = [
  ['profile', 'Profile & verification', 'profile'],
  ['listings', 'Products & services', 'listings'],
  ['ads', 'Adverts', 'ads'],
  ['leads', 'Leads', 'leads'],
  ['sponsorships', 'Sponsorships', 'sponsorships'],
  ['team', 'Team', 'team']
];

/**
 * Business dashboard for the business account, its team members (acting for the business within
 * their role), and specialists promoting their own practice.
 */
export const BusinessView: React.FC<{ sub?: string; businessId?: string; onNavigate: (v: string) => void }> = ({ sub, businessId, onNavigate }) => {
  const { user, reloadMe } = useAuth();
  const [mem, setMem] = useState<Memberships | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [d, setD] = useState<MyBusiness | null>(null);
  const [error, setError] = useState('');

  const loadMemberships = () => api.get<Memberships>('/me/businesses').then((m) => {
    // Specialists act for their own practice (adverts, leads, sponsorships).
    const list = user?.role === 'specialist' ? [{ id: user.id, name: user.name, role: 'owner' as const, permissions: ['view', 'ads', 'sponsorships', 'leads'] }, ...m.businesses] : m.businesses;
    setMem({ ...m, businesses: list });
    const pick = list.find((b) => b.id === businessId) ?? list.find((b) => b.id === getActingBusiness()) ?? list[0];
    setActiveId(pick?.id ?? null);
  }).catch((e: ApiError) => setError(e.message));
  useEffect(() => {
    if (user) loadMemberships();
  }, [user?.id, businessId]);

  const active = mem?.businesses.find((b) => b.id === activeId) ?? null;
  // Requests now act for this business (the server re-checks membership and role on each one).
  // Set during render, before the tabs mount: child components fetch in their own effects, which run first.
  if (active && user) setActingBusiness(active.id === user.id ? null : active.id);
  useEffect(() => {
    if (!active || !user) return;
    setD(null);
    if (active.permissions.includes('view') && (active.role !== 'owner' || user.role === 'business'))
      api.get<MyBusiness>('/me/business').then(setD).catch((e: ApiError) => setError(e.message));
  }, [active?.id]);
  const reload = () => api.get<MyBusiness>('/me/business').then(setD).catch(() => {});

  if (!user) return <div className={`${WRAP} py-20`}><Notice>Log in to manage a business.</Notice></div>;
  if (!mem) return <div className={`${WRAP} py-20 text-[13px] text-slate-500`}>{error || 'Loading…'}</div>;

  const invitesPanel = (
    <InvitesPanel invites={mem.invites} emailVerified={mem.emailVerified}
      onDone={(joined) => { reloadMe(); if (joined) onNavigate(`business:leads:${joined}`); else loadMemberships(); }} />
  );
  if (!active) {
    return (
      <div className={`${WRAP} py-12 sm:py-16 space-y-6`}>
        <Kicker>Business</Kicker>
        <h1 className="font-display text-[34px] sm:text-[48px] font-normal leading-[1.05] tracking-[-0.03em]">Business team</h1>
        {invitesPanel}
        {!mem.invites.length && <Notice>You’re not on a business team. When a business invites your email address, the invitation appears here.</Notice>}
      </div>
    );
  }

  const tabs = TAB_PERMS.filter(([, , perm]) => active.permissions.includes(perm) && !(user.role === 'specialist' && active.id === user.id && ['profile', 'listings', 'team'].includes(perm)))
    .map(([id, label]) => ({ id, label: id === 'leads' && d?.newLeads ? `Leads (${d.newLeads} new)` : label }));
  const tab = tabs.find((t) => t.id === sub)?.id ?? tabs[0]?.id;
  const isStaff = active.id !== user.id;
  const go = (t: string) => onNavigate(isStaff ? `business:${t}:${active.id}` : `business:${t}`);

  return (
    <div className={`${WRAP} py-12 sm:py-16`}>
      {mem.invites.length > 0 && <div className="mb-8">{invitesPanel}</div>}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Kicker>{user.role === 'specialist' && !isStaff ? 'Promote your practice' : 'Business'}</Kicker>
          <h1 className="mt-4 font-display text-[34px] sm:text-[48px] font-normal leading-[1.05] tracking-[-0.03em]">{user.role === 'specialist' && !isStaff ? 'Adverts & sponsorship' : d?.profile.name || active.name}</h1>
        </div>
        {(mem.businesses.length > 1 || isStaff) && (
          <div className="flex flex-wrap items-center gap-2 text-[13px]">
            <label htmlFor="biz-switch" className="text-slate-600">Working for</label>
            <select id="biz-switch" className={`${selectClass} h-10`} value={active.id} onChange={(e) => onNavigate(`business:${tab}:${e.target.value}`)}>
              {mem.businesses.map((b) => <option key={b.id} value={b.id}>{b.id === user.id ? `${b.name} (you)` : b.name}</option>)}
            </select>
            <Pill tone="lime">{TEAM_ROLE_LABELS[active.role]}</Pill>
            {isStaff && (
              <Button variant="ghost" className="h-10" onClick={async () => { await api.post(`/me/businesses/${active.id}/leave`).catch(() => {}); setActingBusiness(null); reloadMe(); onNavigate('business'); }}>Leave team</Button>
            )}
          </div>
        )}
      </div>
      {isStaff && <p className="mt-3 text-[12px] text-slate-500">You’re acting for {active.name}. What you do here is recorded under your name.</p>}
      <div className="mt-8 flex border-b border-stone-200 gap-6 text-[13px] font-medium overflow-x-auto whitespace-nowrap [scrollbar-width:none]" role="tablist">
        {tabs.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => go(t.id)} className={`pb-3 ${tab === t.id ? 'text-ink border-b-2 border-ink' : 'text-slate-500 hover:text-ink'}`}>{t.label}</button>
        ))}
      </div>
      {error && <Notice tone="error" className="mt-6">{error}</Notice>}
      <div className="mt-8" key={active.id}>
        {tab === 'profile' && d && <ProfileTab key={d.profile.verification.status + d.profile.legalName} profile={d.profile} categories={d.categories} onSaved={reload} onNavigate={onNavigate} />}
        {tab === 'listings' && d && <ListingsTab listings={d.listings} verified={d.profile.verification.status === 'verified'} onChanged={reload} />}
        {tab === 'ads' && <AdsTab listings={d?.listings ?? []} />}
        {tab === 'leads' && <LeadsTab onNavigate={onNavigate} />}
        {tab === 'sponsorships' && <SponsorshipsTab onNavigate={onNavigate} />}
        {tab === 'team' && <TeamTab myRole={active.role} />}
      </div>
    </div>
  );
};
