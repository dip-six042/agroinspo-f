// Live admin tools for Phase 4: business verification, advert review, sponsorship overview.
import React, { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { api, ApiError, Advert, AD_STATUS_LABELS, BusinessProfile, Sponsorship, SPONSORSHIP_STATUS_LABELS, TOPIC_LABELS, formatEventDate } from '../../lib/api';
import { Button, inputClass, naira, Notice, Pill, textareaClass } from '../ui';

const Filter: React.FC<{ value: string; options: [string, string][]; onChange: (v: string) => void }> = ({ value, options, onChange }) => (
  <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter">
    {options.map(([v, l]) => (
      <button key={v} onClick={() => onChange(v)} aria-pressed={value === v} className={`h-8 px-3 rounded-full text-[12px] border ${value === v ? 'bg-ink text-white border-ink' : 'border-stone-300 hover:border-ink'}`}>{l}</button>
    ))}
  </div>
);

/* ---------- business verification ---------- */
export const AdminBusinesses: React.FC = () => {
  const [status, setStatus] = useState('pending');
  const [list, setList] = useState<BusinessProfile[] | null>(null);
  const [scope, setScope] = useState<Record<string, string>>({});
  const [note, setNote] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const load = () => api.get<{ businesses: BusinessProfile[] }>(`/admin/businesses?status=${status}`).then((r) => setList(r.businesses)).catch(() => setList([]));
  useEffect(() => {
    setList(null);
    load();
  }, [status]);
  const decide = async (id: string, decision: string) => {
    setMsg(null);
    try {
      await api.post(`/admin/businesses/${id}/verify`, { decision, scope: scope[id] ?? '', note: note[id] ?? '' });
      setMsg({ tone: 'success', text: { verified: 'Verified. The scope you wrote is shown on their public page.', rejected: 'Not approved. They’ve been told why.', unverified: 'Verification withdrawn; their running adverts were suspended.' }[decision]! });
      load();
    } catch (e) {
      setMsg({ tone: 'error', text: e instanceof ApiError ? e.message : 'Failed.' });
    }
  };
  return (
    <div className="space-y-4">
      <Filter value={status} onChange={setStatus} options={[['pending', 'Waiting for checks'], ['verified', 'Verified'], ['rejected', 'Not approved'], ['unverified', 'Not submitted']]} />
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
      {list?.length === 0 && <p className="text-[13px] text-slate-500">Nothing here.</p>}
      <ul className="space-y-3">
        {list?.map((b) => (
          <li key={b.id} className="rounded-2xl border border-stone-200 bg-white p-5">
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                <p className="text-[15px] font-medium">{b.legalName || b.accountName}</p>
                <p className="text-[12px] text-slate-500">Trading as {b.tradingName || '—'} · account {b.accountName} ({b.email})</p>
              </div>
              {b.submittedAt && <span className="text-[12px] text-slate-500">Submitted {new Date(b.submittedAt).toLocaleDateString('en-NG')}</span>}
            </div>
            <dl className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-[13px]">
              {([['CAC number', b.rcNumber], ['Address', b.address], ['State', b.region], ['Serves', b.serviceArea], ['Authorised contact', `${b.contactName ?? ''}${b.contactRole ? `, ${b.contactRole}` : ''}`], ['Phone', b.phone], ['Website', b.website]] as [string, string | undefined][]).map(([l, v]) => (
                <div key={l} className="flex gap-2"><dt className="text-slate-500 w-36 shrink-0">{l}</dt><dd className="break-words min-w-0">{v || '—'}</dd></div>
              ))}
            </dl>
            <div className="mt-3 flex flex-wrap gap-2">
              {b.evidence?.map((e) => <a key={e.fileId} href={`/api/files/${e.fileId}`} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-stone-300 text-[12px] hover:border-ink"><FileText className="w-3.5 h-3.5" /> {e.label}</a>)}
            </div>
            {b.verification.status === 'pending' && (
              <div className="mt-4 rounded-2xl bg-mist p-4 space-y-2">
                <p className="text-[12px] text-slate-600">Check the CAC public search for the name and number, that the contact is a director or has a letter of authority, and any licence their products need. Write exactly what you checked: it’s shown publicly.</p>
                <textarea aria-label="What was checked" rows={2} className={textareaClass} placeholder="e.g. CAC registration RC1234567 confirmed on the CAC public search; director’s ID matched." value={scope[b.id] ?? ''} onChange={(e) => setScope({ ...scope, [b.id]: e.target.value })} />
                <input aria-label="Reason if not approving" className={inputClass} placeholder="Reason, if not approving (sent to the business)" value={note[b.id] ?? ''} onChange={(e) => setNote({ ...note, [b.id]: e.target.value })} />
                <div className="flex gap-2">
                  <Button variant="lime" className="h-9" onClick={() => decide(b.id, 'verified')}>Verify</Button>
                  <Button variant="outline" className="h-9" onClick={() => decide(b.id, 'rejected')}>Don’t approve</Button>
                </div>
              </div>
            )}
            {b.verification.status === 'verified' && (
              <div className="mt-4 space-y-2">
                <p className="text-[13px]"><span className="text-slate-500">Scope shown publicly:</span> {b.verification.scope}</p>
                <div className="flex gap-2">
                  <input aria-label="Reason for withdrawing" className={`${inputClass} h-9`} placeholder="Reason, if withdrawing verification" value={note[b.id] ?? ''} onChange={(e) => setNote({ ...note, [b.id]: e.target.value })} />
                  <Button variant="danger" className="h-9 shrink-0" onClick={() => decide(b.id, 'unverified')}>Withdraw</Button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

/* ---------- advert review ---------- */
export const AdminAds: React.FC = () => {
  const [status, setStatus] = useState('in_review');
  const [ads, setAds] = useState<Advert[] | null>(null);
  const [sponsorships, setSponsorships] = useState<Sponsorship[] | null>(null);
  const [note, setNote] = useState<Record<string, string>>({});
  const [refund, setRefund] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const load = () => {
    if (status === 'sponsorships') api.get<{ sponsorships: Sponsorship[] }>('/admin/sponsorships').then((r) => setSponsorships(r.sponsorships)).catch(() => setSponsorships([]));
    else api.get<{ ads: Advert[] }>(`/admin/ads?status=${status}`).then((r) => setAds(r.ads)).catch(() => setAds([]));
  };
  useEffect(() => {
    setAds(null);
    load();
  }, [status]);
  const decide = async (a: Advert, decision: string) => {
    setMsg(null);
    try {
      await api.post(`/admin/ads/${a.id}/review`, { decision, note: note[a.id] ?? '', refundNgn: Number(refund[a.id] || 0) });
      setMsg({ tone: 'success', text: { approve: 'Approved.', reject: 'Sent back, with a full refund.', suspend: 'Suspended.' }[decision]! });
      load();
    } catch (e) {
      setMsg({ tone: 'error', text: e instanceof ApiError ? e.message : 'Failed.' });
    }
  };
  return (
    <div className="space-y-4">
      <Filter value={status} onChange={setStatus} options={[['in_review', 'To review'], ['approved', 'Approved'], ['paused', 'Paused'], ['rejected', 'Sent back'], ['suspended', 'Suspended'], ['ended', 'Ended'], ['sponsorships', 'Event sponsorships']]} />
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
      {status === 'sponsorships' ? (
        <ul className="space-y-2">
          {sponsorships?.length === 0 && <li className="text-[13px] text-slate-500">No sponsorships yet.</li>}
          {sponsorships?.map((s) => (
            <li key={s.id} className="rounded-2xl border border-stone-200 bg-white p-4 text-[13px] flex flex-wrap justify-between gap-3">
              <span><span className="font-medium">{s.displayName}</span> ({s.business.name}) → {s.event.title}<span className="block text-[12px] text-slate-500">{s.package.name} · {naira(s.package.priceNgn)} · {formatEventDate(s.event.startsAt)} · {s.deliverables.filter((d) => d.done).length}/{s.deliverables.length} delivered</span></span>
              <Pill>{SPONSORSHIP_STATUS_LABELS[s.status]}</Pill>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="space-y-3">
          {ads?.length === 0 && <li className="text-[13px] text-slate-500">Nothing here.</li>}
          {ads?.map((a) => (
            <li key={a.id} className="rounded-2xl border border-stone-200 bg-white p-5 grid grid-cols-1 sm:grid-cols-[160px_minmax(0,1fr)] gap-4">
              {a.imageUrl ? <img src={a.imageUrl} alt="" className="w-full sm:w-40 h-28 object-cover rounded-xl" /> : <div className="w-full sm:w-40 h-28 rounded-xl bg-mist" />}
              <div>
                <div className="flex flex-wrap gap-1.5"><Pill>{AD_STATUS_LABELS[a.status]}</Pill><Pill>{a.placement}</Pill>{a.targetTopic && <Pill>{TOPIC_LABELS[a.targetTopic]}</Pill>}<Pill>{naira(a.priceNgn)}</Pill></div>
                <p className="mt-2 text-[15px] font-medium">{a.headline}</p>
                <p className="mt-1 text-[13px] text-slate-700">{a.body}</p>
                <p className="mt-2 text-[12px] text-slate-500">{a.advertiser.name} · {a.startsOn} to {a.endsOn} · button: {a.cta === 'website' ? a.url : 'enquire'}</p>
                <p className="text-[12px] text-slate-500">Advertiser checks: {a.advertiserVerification}</p>
                {a.flags && a.flags.length > 0 && <Notice tone="error" className="mt-2">Automatic flags: {a.flags.join('; ')}</Notice>}
                {a.metrics && a.status !== 'in_review' && <p className="mt-2 text-[12px] text-slate-600">{a.metrics.impressions} impressions · {a.metrics.clicks} clicks · {a.metrics.enquiries} enquiries</p>}
                {['in_review', 'approved', 'paused'].includes(a.status) && (
                  <div className="mt-3 space-y-2">
                    <input aria-label="Note to the advertiser" className={`${inputClass} h-9`} placeholder="Note to the advertiser (required to send back or suspend)" value={note[a.id] ?? ''} onChange={(e) => setNote({ ...note, [a.id]: e.target.value })} />
                    {a.status === 'in_review' ? (
                      <div className="flex gap-2">
                        <Button variant="lime" className="h-9" onClick={() => decide(a, 'approve')}>Approve</Button>
                        <Button variant="outline" className="h-9" onClick={() => decide(a, 'reject')}>Send back and refund</Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input aria-label="Refund amount" type="number" min={0} className={`${inputClass} h-9`} placeholder="Refund ₦ (optional)" value={refund[a.id] ?? ''} onChange={(e) => setRefund({ ...refund, [a.id]: e.target.value })} />
                        <Button variant="danger" className="h-9 shrink-0" onClick={() => decide(a, 'suspend')}>Suspend</Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
