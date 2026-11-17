import React, { useEffect, useState } from 'react';
import { ImagePlus, Megaphone } from 'lucide-react';
import { api, ApiError, Advert, AD_STATUS_LABELS, Listing, TOPIC_LABELS, uploadFile } from '../../../lib/api';
import { Button, Field, inputClass, Modal, naira, Notice, Pill, selectClass, textareaClass } from '../../ui';

interface Packages {
  placements: Record<string, { label: string; description: string }>;
  packages: Record<string, { label: string; days: number; prices: Record<string, number> }>;
  canAdvertise: boolean;
  rules: string[];
}
const tone = (s: string) => (({ live: 'lime', scheduled: 'good', in_review: 'warn', payment_pending: 'warn', rejected: 'bad', suspended: 'bad', paused: 'neutral' } as const)[s as 'live'] ?? 'neutral');
const tomorrow = () => new Date(Date.now() + 86400000).toISOString().slice(0, 10);
const fmtDay = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });

/* ---------- editor ---------- */
const AdEditor: React.FC<{ ad: Advert | null; pk: Packages; listings: Listing[]; onClose: () => void; onSaved: () => void }> = ({ ad, pk, listings, onClose, onSaved }) => {
  const [f, setF] = useState({
    placement: ad?.placement ?? 'feed', package: ad?.package ?? 'week', headline: ad?.headline ?? '', body: ad?.body ?? '', cta: ad?.cta ?? 'enquire',
    listingId: ad?.listingId ?? '', url: ad?.url ?? '', targetTopic: ad?.targetTopic ?? '', targetRegion: ad?.targetRegion ?? '', startsOn: ad?.startsOn ?? tomorrow()
  });
  const [saved, setSaved] = useState<Advert | null>(ad);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const price = pk.packages[f.package]?.prices[f.placement] ?? 0;
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  const save = async () => {
    setBusy('save');
    setError('');
    try {
      const body = { ...f, listingId: f.listingId || null };
      const r = saved ? await api.patch<{ ad: Advert }>(`/me/ads/${saved.id}`, body) : await api.post<{ ad: Advert }>('/me/ads', body);
      setSaved(r.ad);
      onSaved();
      return r.ad;
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Couldn’t save.');
      return null;
    } finally {
      setBusy('');
    }
  };
  const checkout = async () => {
    const a = await save();
    if (!a) return;
    setBusy('pay');
    try {
      const r = await api.post<{ checkoutUrl: string }>(`/me/ads/${a.id}/checkout`);
      window.location.assign(r.checkoutUrl);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Couldn’t start checkout.');
      setBusy('');
    }
  };

  return (
    <Modal title={saved ? 'Edit advert' : 'New advert'} onClose={onClose} wide>
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-6">
        <div className="space-y-4">
          <fieldset>
            <legend className="text-[13px] font-medium">Where it appears</legend>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
              {Object.entries(pk.placements).map(([k, p]) => (
                <label key={k} className={`rounded-2xl border p-3 cursor-pointer text-[12px] ${f.placement === k ? 'border-ink bg-mist' : 'border-stone-200'}`}>
                  <input type="radio" name="placement" className="sr-only" checked={f.placement === k} onChange={() => setF({ ...f, placement: k as Advert['placement'] })} />
                  <span className="block text-[13px] font-medium">{p.label}</span><span className="text-slate-600">{p.description}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field id="ad-pkg" label="How long"><select id="ad-pkg" className={`${selectClass} w-full`} value={f.package} onChange={set('package')}>
              {Object.entries(pk.packages).map(([k, p]) => <option key={k} value={k}>{p.label} · {naira(p.prices[f.placement])}</option>)}</select></Field>
            <Field id="ad-start" label="Start date"><input id="ad-start" type="date" min={new Date().toISOString().slice(0, 10)} className={inputClass} value={f.startsOn} onChange={set('startsOn')} /></Field>
          </div>
          <Field id="ad-head" label="Headline" hint={`${f.headline.length}/80`}><input id="ad-head" maxLength={80} className={inputClass} value={f.headline} onChange={set('headline')} /></Field>
          <Field id="ad-body" label="Advert text" hint={`${f.body.length}/300. Say what it is, who it’s for and where. No promises of returns or guaranteed results.`}>
            <textarea id="ad-body" rows={3} maxLength={300} className={textareaClass} value={f.body} onChange={set('body')} /></Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field id="ad-cta" label="Button" hint={f.cta === 'enquire' ? 'Enquiries arrive in your Leads' : undefined}><select id="ad-cta" className={`${selectClass} w-full`} value={f.cta} onChange={set('cta')}><option value="enquire">Enquire</option><option value="website">Visit website</option></select></Field>
            {f.cta === 'website' ? (
              <Field id="ad-url" label="Website link"><input id="ad-url" className={inputClass} value={f.url} onChange={set('url')} placeholder="https://" /></Field>
            ) : (
              <Field id="ad-listing" label="About which product (optional)"><select id="ad-listing" className={`${selectClass} w-full`} value={f.listingId} onChange={set('listingId')}>
                <option value="">General enquiry</option>{listings.filter((l) => l.status === 'published').map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}</select></Field>
            )}
            <Field id="ad-topic" label="Show first to readers of" hint="Optional. Untargeted adverts can appear anywhere in the placement."><select id="ad-topic" className={`${selectClass} w-full`} value={f.targetTopic} onChange={set('targetTopic')}>
              <option value="">Any topic</option>{Object.entries(TOPIC_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
            <Field id="ad-region" label="Region note (optional)"><input id="ad-region" className={inputClass} value={f.targetRegion} onChange={set('targetRegion')} placeholder="e.g. South-West" /></Field>
          </div>
          {saved && (
            <label className="inline-flex items-center gap-2 h-10 px-4 rounded-full border border-stone-300 hover:border-ink text-[13px] cursor-pointer">
              <ImagePlus className="w-4 h-4" /> {saved.imageUrl ? 'Replace image' : 'Add an image'}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadFile<{ imageUrl: string }>(`/me/ads/${saved.id}/image`, file).then((r) => (setSaved({ ...saved, imageUrl: r.imageUrl }), onSaved())).catch((er: ApiError) => setError(er.message)); }} />
            </label>
          )}
          {saved?.flags && saved.flags.length > 0 && <Notice>Our reviewer will look closely at: {saved.flags.join('; ')}.</Notice>}
          {saved?.reviewNote && saved.status === 'rejected' && <Notice tone="error">Reviewer’s note: {saved.reviewNote}</Notice>}
        </div>

        <aside className="space-y-3">
          <p className="text-[12px] text-slate-500">Preview</p>
          <div className="rounded-3xl border border-stone-200 bg-white overflow-hidden">
            {saved?.imageUrl && <img src={saved.imageUrl} alt="" className="w-full h-32 object-cover" />}
            <div className="p-4">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Sponsored · you</p>
              <p className="mt-1.5 text-[14px] font-medium">{f.headline || 'Your headline'}</p>
              <p className="mt-1 text-[12px] text-slate-600">{f.body || 'Your advert text'}</p>
            </div>
          </div>
          <dl className="rounded-2xl bg-mist p-4 text-[13px] space-y-1.5">
            <div className="flex justify-between"><dt className="text-slate-600">Runs</dt><dd>{fmtDay(f.startsOn)} – {fmtDay(new Date(new Date(`${f.startsOn}T12:00:00Z`).getTime() + ((pk.packages[f.package]?.days ?? 7) - 1) * 86400000).toISOString().slice(0, 10))}</dd></div>
            <div className="flex justify-between font-medium"><dt>Total to pay</dt><dd className="font-mono-numbers">{naira(price)}</dd></div>
          </dl>
          <p className="text-[11px] text-slate-500">Paid through Kora. Checked by a person before it runs; fully refunded if we don’t approve it.</p>
          {error && <Notice tone="error">{error}</Notice>}
          <Button variant="outline" className="w-full" busy={busy === 'save'} onClick={save}>{saved ? 'Save changes' : 'Save as draft'}</Button>
          <Button variant="lime" className="w-full" busy={busy === 'pay'} onClick={checkout}>Pay {naira(price)} and submit</Button>
        </aside>
      </div>
    </Modal>
  );
};

/* ---------- list + metrics ---------- */
export const AdsTab: React.FC<{ listings: Listing[] }> = ({ listings }) => {
  const [pk, setPk] = useState<Packages | null>(null);
  const [ads, setAds] = useState<Advert[] | null>(null);
  const [editing, setEditing] = useState<Advert | 'new' | null>(null);
  const [msg, setMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [confirmCancel, setConfirmCancel] = useState('');
  const load = () => api.get<{ ads: Advert[] }>('/me/ads').then((r) => setAds(r.ads)).catch(() => setAds([]));
  useEffect(() => {
    load();
    api.get<Packages>('/ads/packages').then(setPk).catch(() => {});
  }, []);

  const act = async (a: Advert, action: string, extra = {}) => {
    setMsg(null);
    try {
      const r = await api.post<any>(`/me/ads/${a.id}/status`, { action, ...extra });
      setMsg({ tone: 'success', text: action === 'cancel' ? (r.refundedNgn ? `Cancelled. ${naira(r.refundedNgn)} refunded.` : 'Cancelled.') : r.note ?? (action === 'pause' ? 'Paused.' : 'Resumed.') });
      setConfirmCancel('');
      load();
    } catch (e) {
      if (e instanceof ApiError && e.code === 'no_refund') setConfirmCancel(a.id);
      setMsg({ tone: 'error', text: e instanceof ApiError ? e.message : 'Something went wrong.' });
    }
  };
  const duplicate = async (a: Advert) => {
    const r = await api.post<{ ad: Advert }>(`/me/ads/${a.id}/duplicate`).catch(() => null);
    if (r) (load(), setEditing(r.ad));
  };

  if (!pk) return <p className="text-[13px] text-slate-500">Loading…</p>;
  return (
    <div>
      {!pk.canAdvertise ? <Notice>Adverts are open to verified businesses and to specialists whose credentials we’ve checked. Finish verification in the Profile tab first.</Notice> : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[13px] text-slate-600 max-w-xl">Every advert is labelled “Sponsored” and reviewed before it runs. Results show what we measured, nothing estimated.</p>
          <Button variant="lime" onClick={() => setEditing('new')}><Megaphone className="w-4 h-4" /> New advert</Button>
        </div>
      )}
      {msg && <Notice tone={msg.tone} className="mt-4">{msg.text}</Notice>}
      <ul className="mt-6 space-y-3">
        {ads?.length === 0 && <li className="text-[13px] text-slate-500">No adverts yet.</li>}
        {ads?.map((a) => (
          <li key={a.id} className="rounded-3xl border border-stone-200 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap gap-1.5"><Pill tone={tone(a.status)}>{AD_STATUS_LABELS[a.status]}</Pill><Pill>{pk.placements[a.placement]?.label}</Pill>{a.targetTopic && <Pill>{TOPIC_LABELS[a.targetTopic]}</Pill>}</div>
                <p className="mt-2 text-[15px] font-medium">{a.headline}</p>
                <p className="text-[12px] text-slate-500">{fmtDay(a.startsOn)} – {fmtDay(a.endsOn)} · {naira(a.priceNgn)}</p>
                {a.reviewNote && ['rejected', 'suspended'].includes(a.status) && <p className="mt-1 text-[12px] text-rose-700">{a.reviewNote}</p>}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {['draft', 'rejected', 'payment_pending'].includes(a.status) && <Button variant="outline" className="h-9" onClick={() => setEditing(a)}>{a.status === 'payment_pending' ? 'Finish payment' : 'Edit'}</Button>}
                {['live', 'scheduled'].includes(a.status) && <Button variant="ghost" className="h-9" onClick={() => act(a, 'pause')}>Pause</Button>}
                {a.status === 'paused' && <Button variant="outline" className="h-9" onClick={() => act(a, 'resume')}>Resume</Button>}
                {['ended', 'suspended'].includes(a.status) && <Button variant="outline" className="h-9" onClick={() => duplicate(a)}>Run again</Button>}
                {['in_review', 'scheduled', 'live', 'paused', 'draft', 'payment_pending'].includes(a.status) && (
                  confirmCancel === a.id
                    ? <Button variant="danger" className="h-9" onClick={() => act(a, 'cancel', { acceptNoRefund: true })}>Cancel without refund</Button>
                    : <Button variant="ghost" className="h-9" onClick={() => act(a, 'cancel')}>Cancel</Button>
                )}
              </div>
            </div>
            {a.metrics && !['draft', 'payment_pending', 'in_review', 'rejected'].includes(a.status) && (
              <dl className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-2 text-[13px]">
                {([['Impressions', a.metrics.impressions.toLocaleString('en-NG')], ['Clicks', a.metrics.clicks.toLocaleString('en-NG')],
                  ['Click rate', a.metrics.ctrPct === null ? '—' : `${a.metrics.ctrPct}%`], ['Enquiries', String(a.metrics.enquiries)], ['Spend', naira(a.metrics.spendNgn)]] as [string, string][]).map(([l, v]) => (
                  <div key={l} className="rounded-2xl bg-mist p-3"><dt className="text-[11px] text-slate-500">{l}</dt><dd className="mt-1 text-[17px] font-mono-numbers">{v}</dd></div>
                ))}
              </dl>
            )}
          </li>
        ))}
      </ul>
      <div className="mt-8 rounded-3xl bg-mist p-6 text-[13px]">
        <p className="font-medium">Advertising rules</p>
        <ul className="mt-2 space-y-1.5 text-slate-700 list-disc pl-5">{pk.rules.map((r) => <li key={r}>{r}</li>)}</ul>
        <p className="mt-3 text-[11px] text-slate-500">An impression is counted once per person per day when at least half the advert is on screen. A click is counted once per person per day.</p>
      </div>
      {editing && pk && <AdEditor ad={editing === 'new' ? null : editing} pk={pk} listings={listings} onClose={() => setEditing(null)} onSaved={load} />}
    </div>
  );
};
