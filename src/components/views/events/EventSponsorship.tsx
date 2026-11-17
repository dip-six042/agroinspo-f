import React, { useEffect, useState } from 'react';
import { Check, Plus } from 'lucide-react';
import { api, ApiError, SponsorPackage, Sponsorship, SPONSORSHIP_STATUS_LABELS } from '../../../lib/api';
import { Button, Field, inputClass, naira, Notice, Pill, textareaClass } from '../../ui';

interface Data {
  packages: SponsorPackage[];
  sponsors: { id: string; name: string; link: string; logoUrl: string; businessId: string; package: string }[];
  requests: Sponsorship[];
  mine: Sponsorship[];
  canSponsor: boolean;
  actingAs: string;
  isHost: boolean;
  commissionPct: number;
}

/** Labelled sponsors for everyone; packages for verified businesses; package and request management for the host. */
export const EventSponsorship: React.FC<{ eventId: string; eventStatus: string; onNavigate: (v: string) => void }> = ({ eventId, eventStatus, onNavigate }) => {
  const [d, setD] = useState<Data | null>(null);
  const [msg, setMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [requesting, setRequesting] = useState<SponsorPackage | null>(null);
  const [req, setReq] = useState({ displayName: '', link: '', message: '' });
  const [adding, setAdding] = useState(false);
  const [pkg, setPkg] = useState({ name: '', priceNgn: '', benefits: '', deliverables: '', slots: '1', speakingSlot: false, exclusive: false });
  const [evidence, setEvidence] = useState<Record<string, string>>({});
  const [declineNote, setDeclineNote] = useState<Record<string, string>>({});
  const load = () => api.get<Data>(`/events/${eventId}/sponsorship`).then(setD).catch(() => {});
  useEffect(() => {
    load();
  }, [eventId]);

  const run = async (fn: () => Promise<any>, ok: string) => {
    setMsg(null);
    try {
      await fn();
      setMsg({ tone: 'success', text: ok });
      load();
      return true;
    } catch (e) {
      setMsg({ tone: 'error', text: e instanceof ApiError ? e.message : 'Something went wrong.' });
      return false;
    }
  };
  if (!d) return null;
  const showPackages = d.packages.length > 0 && (d.isHost || d.canSponsor) && eventStatus === 'scheduled';
  if (!d.sponsors.length && !showPackages && !d.isHost && !d.mine.length) return null;

  return (
    <section className="mt-6 border-t border-stone-100 pt-5">
      {d.sponsors.length > 0 && (
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Sponsored by</p>
          <ul className="mt-2 flex flex-wrap gap-3">
            {d.sponsors.map((s) => (
              <li key={s.id}>
                <button onClick={() => onNavigate(`suppliers:${s.businessId}`)} className="flex items-center gap-2.5 rounded-2xl border border-stone-200 px-3 py-2 hover:border-ink">
                  {s.logoUrl ? <img src={s.logoUrl} alt="" className="w-8 h-8 rounded-lg object-cover" /> : <span className="w-8 h-8 rounded-lg bg-mist" />}
                  <span className="text-left"><span className="block text-[13px] font-medium">{s.name}</span><span className="block text-[11px] text-slate-500">{s.package}</span></span>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-slate-500">Sponsors support this event. They don’t decide what the speakers say.</p>
        </div>
      )}

      {d.mine.map((s) => (
        <Notice key={s.id} className="mt-4">Your sponsorship ({s.package.name}): {SPONSORSHIP_STATUS_LABELS[s.status]}. <button className="underline" onClick={() => onNavigate('business:sponsorships')}>Manage</button></Notice>
      ))}

      {showPackages && (
        <div className="mt-5">
          <p className="text-[14px] font-medium">Sponsorship packages</p>
          <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {d.packages.map((p) => (
              <li key={p.id} className={`rounded-2xl border p-4 ${p.active ? 'border-stone-200' : 'border-dashed border-stone-300 opacity-70'}`}>
                <div className="flex justify-between gap-2"><p className="text-[14px] font-medium">{p.name}</p><p className="font-mono-numbers text-[14px]">{naira(p.priceNgn)}</p></div>
                <p className="mt-1 text-[12px] text-slate-600">{p.benefits}</p>
                <ul className="mt-2 space-y-1 text-[12px]">{p.deliverables.map((x) => <li key={x} className="flex gap-1.5"><Check className="w-3.5 h-3.5 mt-0.5 shrink-0" />{x}</li>)}</ul>
                <div className="mt-2 flex flex-wrap gap-1.5">{p.exclusive && <Pill tone="warn">Exclusive</Pill>}{p.speakingSlot && <Pill>Speaking slot</Pill>}<Pill>{p.available} of {p.slots} left</Pill></div>
                {d.isHost ? (
                  <div className="mt-3 flex items-center justify-between gap-2 text-[11px] text-slate-500">
                    <span>You receive {naira(p.hostNetNgn)} after {d.commissionPct}% commission</span>
                    <button className="underline" onClick={() => run(() => api.patch(`/sponsorship-packages/${p.id}`, { active: !p.active }), p.active ? 'Package hidden.' : 'Package offered again.')}>{p.active ? 'Hide' : 'Offer again'}</button>
                  </div>
                ) : d.canSponsor && p.available > 0 && !d.mine.length && (
                  <Button variant="outline" className="mt-3 h-9" onClick={() => setRequesting(p)}>Request this package</Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {requesting && (
        <div className="mt-4 rounded-2xl bg-mist p-4 space-y-3">
          <p className="text-[13px] font-medium">Request “{requesting.name}” · {naira(requesting.priceNgn)}</p>
          {d.actingAs && <p className="text-[12px]">Requesting on behalf of <span className="font-medium">{d.actingAs}</span>.</p>}
          <p className="text-[12px] text-slate-600">The host reviews your request first. You pay only once they accept. {requesting.cancellation}</p>
          <Field id="sp-name" label="Name to show"><input id="sp-name" className={inputClass} value={req.displayName} onChange={(e) => setReq({ ...req, displayName: e.target.value })} /></Field>
          <Field id="sp-link" label="Link (optional)"><input id="sp-link" className={inputClass} value={req.link} onChange={(e) => setReq({ ...req, link: e.target.value })} placeholder="https://" /></Field>
          <Field id="sp-msg" label="Message to the host"><textarea id="sp-msg" rows={2} className={textareaClass} value={req.message} onChange={(e) => setReq({ ...req, message: e.target.value })} /></Field>
          <div className="flex gap-2">
            <Button variant="lime" onClick={async () => (await run(() => api.post(`/sponsorship-packages/${requesting.id}/request`, req), 'Request sent to the host.')) && setRequesting(null)}>Send request</Button>
            <Button variant="ghost" onClick={() => setRequesting(null)}>Cancel</Button>
          </div>
        </div>
      )}

      {d.isHost && (
        <div className="mt-5 rounded-3xl border border-stone-200 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[14px] font-medium">Sponsors</p>
            {eventStatus === 'scheduled' && <Button variant="outline" className="h-9" onClick={() => setAdding(!adding)}><Plus className="w-3.5 h-3.5" /> Offer a package</Button>}
          </div>
          {adding && (
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field id="pk-name" label="Package name"><input id="pk-name" className={inputClass} value={pkg.name} onChange={(e) => setPkg({ ...pkg, name: e.target.value })} placeholder="Session sponsor" /></Field>
                <Field id="pk-price" label="Price (₦)"><input id="pk-price" type="number" className={inputClass} value={pkg.priceNgn} onChange={(e) => setPkg({ ...pkg, priceNgn: e.target.value })} /></Field>
                <Field id="pk-slots" label="Sponsor places"><input id="pk-slots" type="number" min={1} max={20} className={inputClass} value={pkg.slots} disabled={pkg.exclusive} onChange={(e) => setPkg({ ...pkg, slots: e.target.value })} /></Field>
              </div>
              <Field id="pk-benefits" label="What the sponsor gets" hint="Placement, mentions, audience, dates"><textarea id="pk-benefits" rows={2} className={textareaClass} value={pkg.benefits} onChange={(e) => setPkg({ ...pkg, benefits: e.target.value })} /></Field>
              <Field id="pk-deliv" label="Deliverables, one per line" hint="You’ll record each one as done, with evidence"><textarea id="pk-deliv" rows={3} className={textareaClass} value={pkg.deliverables} onChange={(e) => setPkg({ ...pkg, deliverables: e.target.value })} placeholder={'Logo on the event page\nTwo verbal mentions'} /></Field>
              <div className="flex flex-wrap gap-4 text-[13px]">
                <label className="flex items-center gap-2"><input type="checkbox" className="w-4 h-4 accent-[#141414]" checked={pkg.speakingSlot} onChange={(e) => setPkg({ ...pkg, speakingSlot: e.target.checked })} /> Includes a speaking slot</label>
                <label className="flex items-center gap-2"><input type="checkbox" className="w-4 h-4 accent-[#141414]" checked={pkg.exclusive} onChange={(e) => setPkg({ ...pkg, exclusive: e.target.checked })} /> Exclusive (only sponsor)</label>
              </div>
              <Button onClick={async () => (await run(() => api.post(`/events/${eventId}/packages`, { ...pkg, priceNgn: Number(pkg.priceNgn), slots: Number(pkg.slots) }), 'Package offered.')) && setAdding(false)}>Offer package</Button>
            </div>
          )}
          <ul className="mt-4 space-y-3">
            {d.requests.length === 0 && <li className="text-[13px] text-slate-500">No sponsorship requests yet.</li>}
            {d.requests.map((s) => (
              <li key={s.id} className="rounded-2xl bg-mist p-4 text-[13px]">
                <div className="flex flex-wrap justify-between gap-2">
                  <span><span className="font-medium">{s.displayName}</span> · {s.package.name} · {naira(s.package.priceNgn)}</span>
                  <Pill tone={s.status === 'confirmed' ? 'good' : s.status === 'requested' ? 'warn' : 'neutral'}>{SPONSORSHIP_STATUS_LABELS[s.status]}</Pill>
                </div>
                {s.message && <p className="mt-1 text-slate-600">“{s.message}”</p>}
                {s.status === 'requested' && (
                  <div className="mt-3 flex flex-wrap gap-2 items-center">
                    <Button variant="lime" className="h-9" onClick={() => run(() => api.post(`/sponsorships/${s.id}/decide`, { decision: 'accept' }), 'Accepted. The sponsor has been asked to pay.')}>Accept</Button>
                    <input aria-label="Reason for declining" className={`${inputClass} h-9 flex-1 min-w-[160px]`} placeholder="Reason, if declining" value={declineNote[s.id] ?? ''} onChange={(e) => setDeclineNote({ ...declineNote, [s.id]: e.target.value })} />
                    <Button variant="ghost" className="h-9" onClick={() => run(() => api.post(`/sponsorships/${s.id}/decide`, { decision: 'decline', note: declineNote[s.id] ?? '' }), 'Declined.')}>Decline</Button>
                  </div>
                )}
                {['confirmed', 'completed'].includes(s.status) && (
                  <ul className="mt-3 space-y-2">
                    {s.deliverables.map((x, i) => (
                      <li key={i} className="flex flex-wrap items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${x.done ? 'bg-emerald-600' : 'bg-stone-300'}`} aria-hidden="true" />
                        <span className="flex-1 min-w-[140px]">{x.item}{x.done && <span className="block text-[11px] text-slate-500">{x.evidence}</span>}</span>
                        {!x.done && (
                          <>
                            <input aria-label={`Evidence for ${x.item}`} className={`${inputClass} h-9 flex-1 min-w-[160px]`} placeholder="Evidence: link, screenshot note, time" value={evidence[`${s.id}:${i}`] ?? ''} onChange={(e) => setEvidence({ ...evidence, [`${s.id}:${i}`]: e.target.value })} />
                            <Button variant="outline" className="h-9" onClick={() => run(() => api.post(`/sponsorships/${s.id}/deliverables`, { index: i, evidence: evidence[`${s.id}:${i}`] ?? '' }), 'Recorded. The sponsor has been told.')}>Mark done</Button>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {msg && <Notice tone={msg.tone} className="mt-3">{msg.text}</Notice>}
    </section>
  );
};
