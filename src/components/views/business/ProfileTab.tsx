import React, { useEffect, useState } from 'react';
import { FileText, Trash2, Upload } from 'lucide-react';
import { api, ApiError, BusinessProfile, uploadFile } from '../../../lib/api';
import { Button, Field, inputClass, Notice, Pill, selectClass, textareaClass } from '../../ui';

const STATUS: Record<string, [string, 'neutral' | 'warn' | 'good' | 'bad']> = {
  unverified: ['Not verified', 'neutral'], pending: ['Being checked', 'warn'], verified: ['Verified', 'good'], rejected: ['Not approved', 'bad']
};

export const ProfileTab: React.FC<{ profile: BusinessProfile; categories: Record<string, string>; onSaved: () => void; onNavigate: (v: string) => void }> = ({ profile: p, categories, onSaved, onNavigate }) => {
  const [f, setF] = useState({
    legalName: p.legalName, tradingName: p.tradingName, category: p.category, rcNumber: p.rcNumber ?? '', address: p.address ?? '', region: p.region,
    serviceArea: p.serviceArea, contactName: p.contactName ?? '', contactRole: p.contactRole ?? '', phone: p.phone ?? '', website: p.website, about: p.about
  });
  const [label, setLabel] = useState('CAC certificate');
  const [authorised, setAuthorised] = useState(false);
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState<{ tone: 'success' | 'error' | 'info'; text: string } | null>(null);
  useEffect(() => setMsg(null), [p.verification.status]);
  const locked = p.verification.status === 'pending';
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  const run = async (key: string, fn: () => Promise<any>, ok: (r: any) => string) => {
    setBusy(key);
    setMsg(null);
    try {
      const r = await fn();
      setMsg({ tone: 'success', text: ok(r) });
      onSaved();
    } catch (e) {
      setMsg({ tone: 'error', text: e instanceof ApiError ? e.message : 'Something went wrong.' });
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-10">
      <form onSubmit={(e) => (e.preventDefault(), run('save', () => api.put<any>('/me/business', f), (r) => r.reverify ? 'Saved. Because the registered name or number changed, verification was withdrawn. Submit again when ready.' : 'Saved.'))}>
        <fieldset disabled={locked} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field id="bp-legal" label="Registered (legal) name" hint="Exactly as on your CAC certificate"><input id="bp-legal" className={inputClass} value={f.legalName} onChange={set('legalName')} /></Field>
            <Field id="bp-trade" label="Trading name" hint="What customers know you as"><input id="bp-trade" className={inputClass} value={f.tradingName} onChange={set('tradingName')} /></Field>
            <Field id="bp-rc" label="CAC registration number" hint="RC, BN or cooperative number"><input id="bp-rc" className={inputClass} value={f.rcNumber} onChange={set('rcNumber')} /></Field>
            <Field id="bp-cat" label="Category"><select id="bp-cat" className={`${selectClass} w-full`} value={f.category} onChange={set('category')}>{Object.entries(categories).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
            <Field id="bp-addr" label="Business address" hint="Private: only our reviewers see it"><input id="bp-addr" className={inputClass} value={f.address} onChange={set('address')} /></Field>
            <Field id="bp-region" label="State"><input id="bp-region" className={inputClass} value={f.region} onChange={set('region')} /></Field>
            <Field id="bp-area" label="Where you supply or serve"><input id="bp-area" className={inputClass} value={f.serviceArea} onChange={set('serviceArea')} /></Field>
            <Field id="bp-web" label="Website"><input id="bp-web" className={inputClass} value={f.website} onChange={set('website')} placeholder="https://" /></Field>
            <Field id="bp-contact" label="Authorised contact"><input id="bp-contact" className={inputClass} value={f.contactName} onChange={set('contactName')} /></Field>
            <Field id="bp-crole" label="Their role"><input id="bp-crole" className={inputClass} value={f.contactRole} onChange={set('contactRole')} placeholder="Director, sales manager…" /></Field>
            <Field id="bp-phone" label="Phone" hint="Private: for verification only"><input id="bp-phone" className={inputClass} value={f.phone} onChange={set('phone')} inputMode="tel" /></Field>
          </div>
          <Field id="bp-about" label="About the business"><textarea id="bp-about" rows={4} className={textareaClass} value={f.about} onChange={set('about')} /></Field>
          <Button type="submit" busy={busy === 'save'}>Save details</Button>
        </fieldset>
      </form>

      <aside className="space-y-4">
        <div className="rounded-3xl border border-stone-200 bg-white p-6">
          <div className="flex items-center justify-between gap-2"><h2 className="text-[15px] font-medium">Verification</h2><Pill tone={STATUS[p.verification.status][1]}>{STATUS[p.verification.status][0]}</Pill></div>
          {p.verification.status === 'verified' && <p className="mt-3 text-[13px] text-slate-700">What we checked: {p.verification.scope}</p>}
          {p.verificationNote && p.verification.status !== 'verified' && <Notice tone={p.verification.status === 'rejected' ? 'error' : 'info'} className="mt-3">{p.verificationNote}</Notice>}
          {p.verification.status === 'pending' && <p className="mt-3 text-[13px] text-slate-600">We usually finish within two working days. You can’t edit details while we check them.</p>}
          {['unverified', 'rejected'].includes(p.verification.status) && <p className="mt-3 text-[13px] text-slate-600">Verification lets you advertise, sponsor events and appear in Suppliers. We check your CAC registration and that you’re authorised to act for the business.</p>}

          <p className="mt-5 text-[13px] font-medium">Supporting documents</p>
          <ul className="mt-2 space-y-1.5">
            {p.evidence?.map((e) => (
              <li key={e.fileId} className="flex items-center justify-between gap-2 text-[13px] rounded-xl bg-mist px-3 py-2">
                <a href={`/api/files/${e.fileId}`} className="flex items-center gap-2 min-w-0 underline-offset-2 hover:underline"><FileText className="w-4 h-4 shrink-0" /><span className="truncate">{e.label}</span></a>
                {!locked && p.verification.status !== 'verified' && (
                  <button aria-label={`Remove ${e.label}`} onClick={() => run('del', () => api.del(`/me/business/evidence/${e.fileId}`), () => 'Removed.')}><Trash2 className="w-4 h-4 text-slate-500" /></button>
                )}
              </li>
            ))}
            {!p.evidence?.length && <li className="text-[12px] text-slate-500">None yet. Add your CAC certificate, plus a licence if your products need one (e.g. NASC seed dealer, NAFDAC).</li>}
          </ul>
          {!locked && p.verification.status !== 'verified' && (
            <div className="mt-3 flex gap-2">
              <label htmlFor="ev-label" className="sr-only">Document name</label>
              <select id="ev-label" className={`${selectClass} h-10 flex-1 text-[13px]`} value={label} onChange={(e) => setLabel(e.target.value)}>
                {['CAC certificate', 'Director’s ID', 'NASC seed dealer licence', 'NAFDAC registration', 'Cooperative registration', 'Utility bill (address)', 'Other licence'].map((l) => <option key={l}>{l}</option>)}
              </select>
              <label className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full border border-stone-300 hover:border-ink text-[13px] cursor-pointer">
                <Upload className="w-4 h-4" /> Upload
                <input type="file" accept=".pdf,image/jpeg,image/png,image/webp" className="sr-only"
                  onChange={(e) => { const file = e.target.files?.[0]; if (file) run('up', () => uploadFile(`/me/business/evidence?label=${encodeURIComponent(label)}`, file), () => `${label} uploaded.`); e.target.value = ''; }} />
              </label>
            </div>
          )}
          {['unverified', 'rejected'].includes(p.verification.status) && (
            <div className="mt-5 border-t border-stone-100 pt-4">
              <label className="flex items-start gap-3 text-[13px]">
                <input type="checkbox" className="mt-1 w-4 h-4 accent-[#141414]" checked={authorised} onChange={(e) => setAuthorised(e.target.checked)} />
                <span>I’m authorised to act for this business, and the details and documents are genuine.</span>
              </label>
              <Button className="mt-3 w-full" variant="lime" disabled={!authorised} busy={busy === 'submit'}
                onClick={() => run('submit', () => api.post('/me/business/submit', { authorised: true }), () => 'Submitted. We’ll let you know when it’s done.')}>Submit for verification</Button>
            </div>
          )}
          {msg && <Notice tone={msg.tone} className="mt-3">{msg.text}</Notice>}
        </div>
        {p.verification.status === 'verified' && <Button variant="outline" className="w-full" onClick={() => onNavigate(`suppliers:${p.id}`)}>View your public page</Button>}
      </aside>
    </div>
  );
};
