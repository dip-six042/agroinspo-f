import React, { useEffect, useState } from 'react';
import { api, ApiError } from '../../lib/api';
import { Button, Field, inputClass, Notice, selectClass, textareaClass } from '../ui';

const SECTORS = ['crops', 'livestock', 'poultry', 'aquaculture', 'processing', 'agribusiness', 'technology', 'farm-management'];

interface Registration {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  sector: string;
  capacityNgn: number | null;
  country: string;
  location: string;
  updatesOptIn: boolean;
  createdAt: string;
}

interface Portal {
  acceptingFunds: boolean;
  readyForReview: boolean;
  officialLaunchAt: string | null;
  plannedOpenAt: string | null;
  announcement: string;
}

export const AdminInvestment: React.FC = () => {
  const [portal, setPortal] = useState<Portal | null>(null);
  const [rows, setRows] = useState<Registration[]>([]);
  const [q, setQ] = useState('');
  const [sector, setSector] = useState('');
  const [from, setFrom] = useState('');
  const [launch, setLaunch] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [ready, setReady] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => {
    const p = new URLSearchParams();
    if (q.trim()) p.set('q', q.trim());
    if (sector) p.set('sector', sector);
    if (from) p.set('from', from);
    api.get<{ portal: Portal; registrations: Registration[] }>(`/admin/investment?${p}`).then((r) => {
      setPortal(r.portal);
      setRows(r.registrations);
      setAnnouncement(r.portal.announcement);
      setLaunch(r.portal.officialLaunchAt ? r.portal.officialLaunchAt.slice(0, 10) : '');
      setReady(r.portal.readyForReview);
    }).catch((e: ApiError) => setError(e.message));
  };
  useEffect(load, []);

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    setError('');
    try {
      await fn();
      setNote(ok);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const exportCsv = () => {
    const p = new URLSearchParams();
    if (q.trim()) p.set('q', q.trim());
    if (sector) p.set('sector', sector);
    if (from) p.set('from', from);
    window.open(`/api/admin/investment/export?${p}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-[22px] font-normal tracking-[-0.02em]">Investment portal</h2>
        <p className="mt-1 text-[13px] text-slate-500">
          Waiting list only. {portal?.acceptingFunds ? 'Funding is open.' : 'Funding is off, including after the planned date, until you explicitly mark the portal ready. This release still has no checkout.'}
          {portal?.plannedOpenAt ? ` Earliest review date: ${new Date(portal.plannedOpenAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}.` : ' Set the official launch date to calculate the two-year mark.'}
        </p>
      </div>

      {error && <Notice tone="error">{error}</Notice>}
      {note && <Notice tone="success">{note}</Notice>}

      <form className="rounded-3xl border border-stone-200 bg-white p-6 space-y-4" onSubmit={(e) => {
        e.preventDefault();
        run(() => api.patch('/admin/investment/settings', {
          officialLaunchAt: launch ? new Date(launch).toISOString() : '',
          announcement,
          readyForReview: ready,
          readinessConfirmed: ready ? confirmed : undefined
        }), 'Portal settings saved. Deposits stay disabled.');
      }}>
        <Field id="inv-launch" label="Official public launch date" hint="The two-year wait is counted from this date.">
          <input id="inv-launch" type="date" className={inputClass} value={launch} onChange={(e) => setLaunch(e.target.value)} />
        </Field>
        <Field id="inv-copy" label="Public announcement">
          <textarea id="inv-copy" rows={4} className={textareaClass} value={announcement} onChange={(e) => setAnnouncement(e.target.value)} />
        </Field>
        <label className="flex items-start gap-3 text-[13px]">
          <input type="checkbox" className="mt-1" checked={ready} onChange={(e) => setReady(e.target.checked)} />
          Mark the portal ready for a later activation review. This does not accept funds.
        </label>
        {ready && (
          <label className="flex items-start gap-3 text-[13px]">
            <input type="checkbox" className="mt-1" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
            The legal, regulatory, financial and operational checks for this stage are complete.
          </label>
        )}
        <Button type="submit" variant="lime" busy={busy}>Save portal settings</Button>
      </form>

      <form className="rounded-3xl border border-stone-200 bg-white p-6 space-y-4" onSubmit={(e) => {
        e.preventDefault();
        run(() => api.post('/admin/investment/updates', { subject, message }), 'Update sent to people who opted in.');
      }}>
        <h3 className="text-[15px] font-medium">Email people who asked for updates</h3>
        <Field id="inv-subject" label="Subject"><input id="inv-subject" className={inputClass} value={subject} onChange={(e) => setSubject(e.target.value)} /></Field>
        <Field id="inv-message" label="Message"><textarea id="inv-message" rows={4} className={textareaClass} value={message} onChange={(e) => setMessage(e.target.value)} /></Field>
        <Button type="submit" variant="outline" busy={busy}>Send update</Button>
      </form>

      <div className="flex flex-wrap gap-3 items-end">
        <Field id="inv-q" label="Search"><input id="inv-q" className={inputClass} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, email, place" /></Field>
        <Field id="inv-sector" label="Sector">
          <select id="inv-sector" className={selectClass} value={sector} onChange={(e) => setSector(e.target.value)}>
            <option value="">Any</option>
            {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field id="inv-from" label="Registered from"><input id="inv-from" type="date" className={inputClass} value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
        <Button type="button" variant="outline" onClick={load}>Filter</Button>
        <Button type="button" variant="ghost" onClick={exportCsv}>Export</Button>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-stone-200 bg-white">
        <table className="w-full text-left text-[13px]">
          <thead className="text-slate-500 border-b border-stone-200">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Sector</th>
              <th className="px-4 py-3 font-medium">Place</th>
              <th className="px-4 py-3 font-medium">Registered</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-slate-500">No registrations match.</td></tr>}
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-stone-100">
                <td className="px-4 py-3">{r.fullName}{r.updatesOptIn ? '' : ' · no emails'}</td>
                <td className="px-4 py-3">{r.email}<br />{r.phone}</td>
                <td className="px-4 py-3">{r.sector}{r.capacityNgn != null ? ` · ₦${r.capacityNgn.toLocaleString('en-NG')}` : ''}</td>
                <td className="px-4 py-3">{r.location}, {r.country}</td>
                <td className="px-4 py-3">{new Date(r.createdAt).toLocaleDateString('en-NG')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
