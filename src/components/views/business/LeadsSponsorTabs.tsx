import React, { useEffect, useState } from 'react';
import { MessageCircle, Upload } from 'lucide-react';
import { api, ApiError, formatEventDate, Lead, Sponsorship, SPONSORSHIP_STATUS_LABELS, timeAgo, TOPIC_LABELS, uploadFile } from '../../../lib/api';
import { Button, naira, Notice, Pill, selectClass } from '../../ui';

/** The conversation behind a lead. Replies go out as the business; the business sees who wrote each one. */
const LeadThread: React.FC<{ lead: Lead; onSent: () => void }> = ({ lead, onSent }) => {
  const [msgs, setMsgs] = useState<{ id: string; body: string; fromBusiness: boolean; sentBy: string; createdAt: string }[] | null>(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const load = () => api.get<{ messages: any[] }>(`/me/leads/${lead.id}/thread`).then((r) => setMsgs(r.messages)).catch((e: ApiError) => setError(e.message));
  useEffect(() => {
    load();
  }, [lead.id]);
  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.post(`/me/leads/${lead.id}/reply`, { body: text });
      setText('');
      await load();
      onSent();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Couldn’t send.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="mt-4 rounded-2xl bg-mist p-4">
      <ul className="space-y-2 max-h-72 overflow-y-auto" aria-live="polite">
        {msgs?.map((m) => (
          <li key={m.id} className={`flex ${m.fromBusiness ? 'justify-end' : ''}`}>
            <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-[13px] whitespace-pre-wrap ${m.fromBusiness ? 'bg-ink text-white' : 'bg-white'}`}>
              {m.body}
              <span className={`block mt-1 text-[10px] ${m.fromBusiness ? 'text-white/60' : 'text-slate-500'}`}>{m.sentBy} · {timeAgo(m.createdAt)}</span>
            </div>
          </li>
        ))}
      </ul>
      <form onSubmit={send} className="mt-3 flex gap-2">
        <label htmlFor={`lr-${lead.id}`} className="sr-only">Reply</label>
        <input id={`lr-${lead.id}`} className="flex-1 h-10 px-4 rounded-full border border-stone-300 bg-white text-[13px] focus:outline-none focus:border-ink" placeholder="Reply as the business" value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} />
        <Button type="submit" className="h-10" busy={busy} disabled={!text.trim()}>Send</Button>
      </form>
      {error && <Notice tone="error" className="mt-2">{error}</Notice>}
    </div>
  );
};

export const LeadsTab: React.FC<{ onNavigate: (v: string) => void }> = ({ onNavigate }) => {
  const [openId, setOpenId] = useState<string | null>(null);
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [filter, setFilter] = useState('');
  const load = () => api.get<{ leads: Lead[] }>('/me/leads').then((r) => setLeads(r.leads)).catch(() => setLeads([]));
  useEffect(() => {
    load();
  }, []);
  const shown = leads?.filter((l) => !filter || l.status === filter);
  const counts = (s: string) => leads?.filter((l) => l.status === s).length ?? 0;
  return (
    <div>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter leads">
        {([['', 'All'], ['new', `New (${counts('new')})`], ['contacted', 'Contacted'], ['won', 'Won'], ['closed', 'Closed']] as const).map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} aria-pressed={filter === v} className={`h-8 px-3 rounded-full text-[12px] border ${filter === v ? 'bg-ink text-white border-ink' : 'border-stone-300 hover:border-ink'}`}>{l}</button>
        ))}
      </div>
      <ul className="mt-5 space-y-3">
        {shown?.length === 0 && <li className="text-[13px] text-slate-500">No enquiries here yet. They arrive from your listings, adverts and public page.</li>}
        {shown?.map((l) => (
          <li key={l.id} className={`rounded-2xl border bg-white p-5 ${l.status === 'new' ? 'border-ink' : 'border-stone-200'}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[14px] font-medium">{l.from.name} <span className="font-normal text-slate-500">· {l.from.title || l.from.role}</span></p>
                <p className="text-[12px] text-slate-500">{timeAgo(l.createdAt)} · via {l.source.type === 'advert' ? 'advert' : l.source.type === 'listing' ? 'listing' : 'your page'}: {l.source.label}</p>
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor={`ld-${l.id}`} className="sr-only">Status</label>
                <select id={`ld-${l.id}`} className={`${selectClass} h-9 text-[12px]`} value={l.status} onChange={(e) => api.patch(`/me/leads/${l.id}`, { status: e.target.value }).then(load).catch(() => {})}>
                  <option value="new">New</option><option value="contacted">Contacted</option><option value="won">Won</option><option value="closed">Closed</option>
                </select>
                <Button variant="outline" className="h-9" aria-expanded={openId === l.id} onClick={() => setOpenId(openId === l.id ? null : l.id)}><MessageCircle className="w-3.5 h-3.5" /> {openId === l.id ? 'Hide conversation' : 'Reply'}</Button>
              </div>
            </div>
            <p className="mt-3 text-[14px] leading-relaxed whitespace-pre-wrap">{l.message}</p>
            {l.phone && <p className="mt-2 text-[13px]">Phone shared: <a href={`tel:${l.phone.replace(/\s/g, '')}`} className="underline">{l.phone}</a></p>}
            {openId === l.id && <LeadThread lead={l} onSent={load} />}
          </li>
        ))}
      </ul>
    </div>
  );
};

interface OpenEvent { id: string; title: string; topic: string; startsAt: string; fromPriceNgn: number; packages: number }

export const SponsorshipsTab: React.FC<{ onNavigate: (v: string) => void }> = ({ onNavigate }) => {
  const [d, setD] = useState<{ sponsorships: Sponsorship[]; canSponsor: boolean; open: OpenEvent[] } | null>(null);
  const [msg, setMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const load = () => api.get<any>('/me/sponsorships').then(setD).catch(() => {});
  useEffect(() => {
    load();
  }, []);
  const run = async (fn: () => Promise<any>, ok?: string) => {
    setMsg(null);
    try {
      const r = await fn();
      if (r?.checkoutUrl) return window.location.assign(r.checkoutUrl);
      if (ok) setMsg({ tone: 'success', text: ok });
      load();
    } catch (e) {
      setMsg({ tone: 'error', text: e instanceof ApiError ? e.message : 'Something went wrong.' });
    }
  };
  if (!d) return <p className="text-[13px] text-slate-500">Loading…</p>;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-10">
      <section>
        <h2 className="text-[15px] font-medium">Your sponsorships</h2>
        {msg && <Notice tone={msg.tone} className="mt-3">{msg.text}</Notice>}
        <ul className="mt-3 space-y-3">
          {d.sponsorships.length === 0 && <li className="text-[13px] text-slate-500">None yet. Pick an event on the right, or open any upcoming event to see its packages.</li>}
          {d.sponsorships.map((s) => (
            <li key={s.id} className="rounded-3xl border border-stone-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <button className="text-left text-[15px] font-medium hover:underline" onClick={() => onNavigate(`events:${s.event.id}`)}>{s.event.title}</button>
                  <p className="text-[12px] text-slate-500">{formatEventDate(s.event.startsAt)} · {s.package.name} · {naira(s.package.priceNgn)}</p>
                </div>
                <Pill tone={s.status === 'confirmed' || s.status === 'completed' ? 'good' : s.status === 'accepted' ? 'lime' : ['declined', 'cancelled', 'refunded'].includes(s.status) ? 'neutral' : 'warn'}>{SPONSORSHIP_STATUS_LABELS[s.status]}</Pill>
              </div>
              {s.declineNote && <p className="mt-2 text-[12px] text-slate-600">Note: {s.declineNote}</p>}
              {['confirmed', 'completed'].includes(s.status) && (
                <ul className="mt-3 space-y-1.5 text-[13px]">
                  {s.deliverables.map((x, i) => (
                    <li key={i} className="flex gap-2"><span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${x.done ? 'bg-emerald-600' : 'bg-stone-300'}`} aria-hidden="true" />
                      <span>{x.item}{x.done ? <span className="block text-[12px] text-slate-500">Done: {x.evidence}</span> : <span className="text-slate-500"> · not yet recorded</span>}</span></li>
                  ))}
                </ul>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {s.status === 'accepted' && <Button variant="lime" className="h-9" onClick={() => run(() => api.post(`/sponsorships/${s.id}/checkout`))}>Pay {naira(s.package.priceNgn)} to confirm</Button>}
                {['requested', 'accepted', 'confirmed'].includes(s.status) && (
                  <label className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-stone-300 hover:border-ink text-[12px] cursor-pointer">
                    <Upload className="w-3.5 h-3.5" /> {s.logoUrl ? 'Replace logo' : 'Add your logo'}
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) run(() => uploadFile(`/sponsorships/${s.id}/logo`, f), 'Logo uploaded.'); }} />
                  </label>
                )}
                {['requested', 'accepted'].includes(s.status) && <Button variant="ghost" className="h-9" onClick={() => run(() => api.post(`/sponsorships/${s.id}/cancel`, { reason: '' }), 'Request withdrawn.')}>Withdraw</Button>}
                {s.status === 'confirmed' && s.canCancelWithRefund && <Button variant="ghost" className="h-9" onClick={() => run(() => api.post(`/sponsorships/${s.id}/cancel`, { reason: 'Cancelled by sponsor' }), 'Cancelled and refunded.')}>Cancel for a full refund</Button>}
                {['confirmed', 'completed'].includes(s.status) && (
                  <Button variant="ghost" className="h-9" onClick={() => onNavigate('support')}>Something not delivered?</Button>
                )}
              </div>
              {s.status === 'confirmed' && <p className="mt-2 text-[11px] text-slate-500">{s.package.cancellation}</p>}
            </li>
          ))}
        </ul>
      </section>
      <aside>
        <div className="rounded-3xl bg-mist p-6">
          <h2 className="text-[15px] font-medium">Events looking for sponsors</h2>
          {!d.canSponsor && <Notice className="mt-3">Verify your business to sponsor events.</Notice>}
          <ul className="mt-3 space-y-3">
            {d.open.length === 0 && <li className="text-[13px] text-slate-500">No open packages right now.</li>}
            {d.open.map((e) => (
              <li key={e.id}>
                <button onClick={() => onNavigate(`events:${e.id}`)} className="w-full text-left rounded-2xl bg-white p-4 hover:ring-1 hover:ring-ink">
                  <p className="text-[14px] font-medium leading-snug">{e.title}</p>
                  <p className="mt-1 text-[12px] text-slate-500">{formatEventDate(e.startsAt)} · {TOPIC_LABELS[e.topic]}</p>
                  <p className="mt-1 text-[12px]">{e.packages} package{e.packages > 1 ? 's' : ''} from {naira(e.fromPriceNgn)}</p>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
};
