import React, { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { Button, Field, inputClass, Kicker, Notice, selectClass, WRAP } from '../ui';

const SECTORS: { id: string; label: string }[] = [
  { id: 'crops', label: 'Crop production' },
  { id: 'livestock', label: 'Livestock' },
  { id: 'poultry', label: 'Poultry' },
  { id: 'aquaculture', label: 'Aquaculture' },
  { id: 'processing', label: 'Processing and value addition' },
  { id: 'agribusiness', label: 'Agribusiness' },
  { id: 'technology', label: 'Agricultural technology' },
  { id: 'farm-management', label: 'Farm management' }
];

interface Portal {
  phase: 'waiting_list';
  acceptingFunds: boolean;
  readyForReview: boolean;
  officialLaunchAt: string | null;
  plannedOpenAt: string | null;
  announcement: string;
}

const dateLabel = (iso: string) =>
  new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' });

export const OpportunitiesView: React.FC = () => {
  const [portal, setPortal] = useState<Portal | null>(null);
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', sector: '', capacityNgn: '', country: 'Nigeria', location: '', updatesOptIn: true, consent: false
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    api.get<Portal>('/investment/portal').then(setPortal).catch(() => setPortal(null));
  }, []);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [key]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.post('/investment/waitlist', {
        ...form,
        capacityNgn: form.capacityNgn === '' ? null : Number(form.capacityNgn.replace(/,/g, ''))
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Couldn’t save your registration.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`${WRAP} py-12 sm:py-16`}>
      <Kicker>Opportunities · Investment portal</Kicker>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-2 h-8 px-3 rounded-full bg-ink text-lime text-[12px] font-medium">
          <ShieldCheck className="w-3.5 h-3.5" /> Coming soon
        </span>
        <span className="inline-flex items-center h-8 px-3 rounded-full border border-stone-300 text-[12px]">Join the waiting list</span>
      </div>
      <h1 className="mt-5 font-display text-[34px] sm:text-[52px] font-normal leading-[1.05] tracking-[-0.03em] max-w-4xl">
        Agro Inspo Investment Portal — coming soon.
      </h1>
      <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-slate-600">
        {portal?.announcement ||
          'Interested in future agricultural investment opportunities across Nigeria and Africa? Join the waiting list to hear when the portal is being prepared. Nothing on this page takes money.'}
      </p>

      <div className="mt-8 grid lg:grid-cols-2 gap-4">
        <div className="rounded-3xl border border-stone-200 bg-white p-6">
          <p className="text-[13px] font-medium">When it can open</p>
          <p className="mt-2 text-[14px] leading-relaxed text-slate-600">
            The two-year waiting period starts on the official public launch of Agro Inspo, not on the day development began.
            {portal?.officialLaunchAt
              ? ` Launch is recorded as ${dateLabel(portal.officialLaunchAt)}. The earliest planned review date is ${portal.plannedOpenAt ? dateLabel(portal.plannedOpenAt) : 'not calculated yet'}.`
              : ' An administrator has not recorded the official launch date yet, so the two-year clock has not started.'}
          </p>
          <p className="mt-3 text-[14px] leading-relaxed text-slate-600">
            Reaching that date does not open the portal. An authorised administrator has to turn investment features on only after the legal, regulatory, financial and operational checks are done.
          </p>
        </div>
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-[14px] leading-relaxed text-amber-950">
          Joining this list is not an investment, a reservation, an offer, or a guarantee that you will be able to take part. Agro Inspo is not accepting deposits, subscriptions or funding commitments on this page.
        </div>
      </div>

      <div className="mt-10 max-w-xl">
        <h2 className="font-display text-[28px] font-normal tracking-[-0.02em]">Register your interest</h2>
        <p className="mt-2 text-[13px] text-slate-500">
          We store your name, contact details, sector and location so the team can tell you about the portal. Administrators can see this list. We don’t sell it.
          {form.updatesOptIn ? ' You can opt out of emails below.' : ''}
        </p>

        {done ? (
          <Notice tone="success" className="mt-6">
            You’re on the waiting list. A confirmation has been sent to your email. It is not an investment or a place in any opportunity.
          </Notice>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <Field id="wl-name" label="Full name"><input id="wl-name" className={inputClass} value={form.fullName} onChange={set('fullName')} required maxLength={120} /></Field>
            <Field id="wl-email" label="Email"><input id="wl-email" type="email" className={inputClass} value={form.email} onChange={set('email')} required /></Field>
            <Field id="wl-phone" label="Phone number"><input id="wl-phone" className={inputClass} value={form.phone} onChange={set('phone')} required minLength={7} /></Field>
            <Field id="wl-sector" label="Preferred sector">
              <select id="wl-sector" className={`${selectClass} w-full`} value={form.sector} onChange={set('sector')} required>
                <option value="">Choose…</option>
                {SECTORS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </Field>
            <Field id="wl-capacity" label="Estimated investment capacity (optional)" hint="Whole naira. You can leave this blank.">
              <input id="wl-capacity" inputMode="numeric" className={inputClass} value={form.capacityNgn} onChange={set('capacityNgn')} placeholder="0" />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field id="wl-country" label="Country"><input id="wl-country" className={inputClass} value={form.country} onChange={set('country')} required /></Field>
              <Field id="wl-location" label="State or location"><input id="wl-location" className={inputClass} value={form.location} onChange={set('location')} required /></Field>
            </div>
            <label className="flex items-start gap-3 text-[13px] leading-relaxed">
              <input type="checkbox" className="mt-1" checked={form.updatesOptIn} onChange={set('updatesOptIn')} />
              Email me when Agro Inspo has an approved update about this portal.
            </label>
            <label className="flex items-start gap-3 text-[13px] leading-relaxed">
              <input type="checkbox" className="mt-1" checked={form.consent} onChange={set('consent')} required />
              I understand that joining is not an investment, reservation, offer or guarantee of access.
            </label>
            {error && <Notice tone="error">{error}</Notice>}
            <Button type="submit" variant="lime" busy={busy} disabled={!form.consent}>Join the waiting list</Button>
          </form>
        )}
      </div>
    </div>
  );
};
