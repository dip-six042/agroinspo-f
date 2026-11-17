import React, { useEffect, useState } from 'react';
import { ArrowLeft, Plus, Trash2, Video, Phone, Mic, MicOff, VideoOff } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { api, ApiError, Booking, BOOKING_STATUS_LABELS, Service, Slot, TOPIC_LABELS } from '../../../lib/api';
import { Button, Field, inputClass, Kicker, naira, Notice, Pill, selectClass, textareaClass, Toast, WRAP } from '../../ui';
import { EmailVerifyBanner } from '../CommunityView';
import { BookingDetail, bookingTone, fmtWhen } from './BookingDetail';

/* ---------- bookings list ---------- */
const BookingList: React.FC<{ as: 'client' | 'specialist'; onOpen: (id: string) => void; refreshKey: number; onNavigate: (v: string) => void }> = ({ as, onOpen, refreshKey, onNavigate }) => {
  const [list, setList] = useState<Booking[] | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api.get<{ bookings: Booking[] }>(`/me/bookings?as=${as}`).then((r) => setList(r.bookings)).catch((e: ApiError) => setError(e.message));
  }, [as, refreshKey]);
  if (error) return <Notice tone="error">{error}</Notice>;
  if (!list) return <p className="text-[13px] text-slate-500">Loading…</p>;
  const upcoming = list.filter((b) => ['confirmed', 'in_progress', 'payment_pending'].includes(b.status)).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const past = list.filter((b) => !upcoming.includes(b));
  if (!list.length)
    return (
      <div className="rounded-3xl border border-dashed border-stone-300 p-10 text-center">
        <p className="font-display text-[22px]">{as === 'client' ? 'No consultations yet.' : 'No client bookings yet.'}</p>
        <p className="mt-2 text-[13px] text-slate-500">{as === 'client' ? 'Find a specialist and book a video or audio call.' : 'Add services and open times so farmers can book you.'}</p>
        {as === 'client' && <Button variant="lime" className="mt-4" onClick={() => onNavigate('specialists')}>Find an expert</Button>}
      </div>
    );
  const Row = ({ b }: { b: Booking }) => (
    <li>
      <button onClick={() => onOpen(b.id)} className="w-full text-left flex flex-wrap items-center gap-4 py-4 border-b border-stone-200">
        <div className="w-28 shrink-0 text-[13px] font-mono-numbers">{fmtWhen(b.startsAt)}</div>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-medium">{b.serviceTitle}</p>
          <p className="text-[12px] text-slate-500">{as === 'client' ? b.specialist.name : b.client.name} · {b.mode === 'video' ? 'Video' : 'Audio'} · {b.durationMin} min</p>
        </div>
        <span className="font-mono-numbers text-[13px]">{naira(as === 'specialist' ? b.netNgn ?? 0 : b.priceNgn)}</span>
        <Pill tone={bookingTone(b.status)}>{BOOKING_STATUS_LABELS[b.status]}</Pill>
        {b.canJoin && <span className="text-[12px] font-medium underline underline-offset-4">Join now</span>}
      </button>
    </li>
  );
  return (
    <div className="space-y-8">
      <section><h3 className="text-[15px] font-medium">Upcoming</h3>
        {upcoming.length ? <ul className="mt-2 border-t border-stone-200">{upcoming.map((b) => <Row key={b.id} b={b} />)}</ul> : <p className="mt-2 text-[13px] text-slate-500">Nothing scheduled.</p>}</section>
      {past.length > 0 && <section><h3 className="text-[15px] font-medium">Past and cancelled</h3><ul className="mt-2 border-t border-stone-200">{past.map((b) => <Row key={b.id} b={b} />)}</ul></section>}
    </div>
  );
};

/* ---------- call room ---------- */
const ConsultationCall: React.FC<{ id: string; onLeave: () => void }> = ({ id, onLeave }) => {
  const [b, setB] = useState<Booking | null>(null);
  const [provider, setProvider] = useState('');
  const [error, setError] = useState('');
  const [mic, setMic] = useState(true);
  const [cam, setCam] = useState(true);
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState('');
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    api.post<{ video: { provider: string }; booking: Booking }>(`/bookings/${id}/join`)
      .then((r) => (setB(r.booking), setNotes(r.booking.notes), setProvider(r.video.provider)))
      .catch((e: ApiError) => setError(e.message));
    const t = setInterval(() => setElapsed((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, [id]);
  const spec = b?.role === 'specialist';
  const other = b ? (spec ? b.client : b.specialist) : null;
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');
  return (
    <div className="min-h-[calc(100vh-5rem)] bg-ink text-white">
      <div className={`${WRAP} py-6`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button onClick={onLeave} className="inline-flex items-center gap-2 text-[13px] text-white/70 hover:text-white"><ArrowLeft className="w-4 h-4" /> Leave call</button>
          <span className="font-mono-numbers text-[13px] text-white/70">{mm}:{ss} · {b?.durationMin ?? ''} min session</span>
        </div>
        <h1 className="mt-4 font-display text-[24px] sm:text-[30px] font-normal">{b?.serviceTitle ?? 'Connecting…'}</h1>
        {error && <Notice tone="error" className="mt-4">{error}</Notice>}
        {b && (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-4">
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[other!.name, 'You'].map((n, i) => (
                  <div key={n} className="relative aspect-video rounded-3xl bg-[#1f2410] flex items-center justify-center">
                    {b.mode === 'audio' || (i === 1 && !cam) ? (
                      <div className="text-center"><div className="mx-auto w-16 h-16 rounded-full bg-lime text-ink flex items-center justify-center font-display text-[22px]">{n.replace(/^(Dr\.|Chief|Engr\.)\s+/i, '').split(' ').map((w) => w[0]).slice(0, 2).join('')}</div>
                        <p className="mt-3 text-[13px]">{n}</p></div>
                    ) : <p className="text-[13px] text-white/60">{n}{i === 1 ? '' : ' · camera'}</p>}
                    <span className="absolute bottom-3 left-3 text-[11px] px-2 py-1 rounded-full bg-black/40">{n}{i === 1 && !mic ? ' · muted' : ''}</span>
                  </div>
                ))}
              </div>
              {provider === 'dummy' && <p className="mt-3 text-[11px] text-white/40">Simulated call. Real audio and video connect here once the Agora account is set up. Calls are never recorded.</p>}
              <div className="mt-4 flex justify-center gap-2">
                <button onClick={() => setMic(!mic)} aria-pressed={!mic} aria-label={mic ? 'Mute' : 'Unmute'} className={`w-12 h-12 rounded-full flex items-center justify-center ${mic ? 'bg-white/10' : 'bg-rose-700'}`}>{mic ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}</button>
                {b.mode === 'video' && <button onClick={() => setCam(!cam)} aria-pressed={!cam} aria-label={cam ? 'Turn camera off' : 'Turn camera on'} className={`w-12 h-12 rounded-full flex items-center justify-center ${cam ? 'bg-white/10' : 'bg-rose-700'}`}>{cam ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}</button>}
                <Button variant="danger" className="h-12 px-6" onClick={onLeave}><Phone className="w-4 h-4 rotate-[135deg]" /> Leave</Button>
              </div>
            </div>
            <div className="rounded-3xl bg-white text-ink p-5">
              <p className="text-[13px] font-medium">{spec ? 'Session notes' : 'The client’s question'}</p>
              {spec ? (
                <>
                  <textarea aria-label="Session notes" rows={10} className={`${textareaClass} mt-2`} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Shared with the client after you save" />
                  <Button className="mt-2 w-full" variant="lime" onClick={() => api.patch(`/bookings/${id}/notes`, { notes }).then(() => setSaved('Notes saved and shared.')).catch(() => setSaved('Couldn’t save.'))}>Save notes</Button>
                  <p className="mt-3 text-[12px] text-slate-500">When you’re done, leave the call and mark the session complete from the booking.</p>
                </>
              ) : <p className="mt-2 text-[13px] leading-relaxed whitespace-pre-wrap">{b.objective}</p>}
            </div>
          </div>
        )}
      </div>
      {saved && <Toast message={saved} onClose={() => setSaved('')} />}
    </div>
  );
};

/* ---------- services & availability ---------- */
const ServicesAndSlots: React.FC = () => {
  const [data, setData] = useState<{ services: Service[]; slots: Slot[]; profile: any } | null>(null);
  const [f, setF] = useState({ title: '', description: '', topic: 'crops', mode: 'video', durationMin: '45', priceNgn: '15000' });
  const [day, setDay] = useState(new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  const [times, setTimes] = useState<string[]>(['09:00', '11:00', '14:00']);
  const [len, setLen] = useState('60');
  const [error, setError] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const load = () => api.get<any>('/me/specialist').then(setData).catch((e: ApiError) => setError(e.message));
  useEffect(() => {
    load();
  }, []);
  if (!data) return error ? <Notice tone="error">{error}</Notice> : <p className="text-[13px] text-slate-500">Loading…</p>;
  if (!data.profile) return <Notice>Fill in your specialist profile first (Profile & credentials tab).</Notice>;

  const addService = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/me/services', { ...f, durationMin: Number(f.durationMin), priceNgn: Number(f.priceNgn) });
      setF({ ...f, title: '', description: '' });
      setToastMsg('Service added.');
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Couldn’t add the service.');
    }
  };
  const addSlots = async () => {
    setError('');
    try {
      const startsAt = times.map((t) => new Date(`${day}T${t}`).toISOString());
      const r = await api.post<{ added: number }>('/me/slots', { startsAt, durationMin: Number(len) });
      setToastMsg(r.added ? `${r.added} slot${r.added > 1 ? 's' : ''} added.` : 'No new slots added (too soon or overlapping).');
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Couldn’t add slots.');
    }
  };
  const byDay = new Map<string, Slot[]>();
  for (const s of data.slots) byDay.set(new Date(s.startsAt).toDateString(), [...(byDay.get(new Date(s.startsAt).toDateString()) ?? []), s]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
      <section>
        <h3 className="text-[15px] font-medium">Your services</h3>
        <ul className="mt-3 space-y-2">
          {data.services.map((s) => (
            <li key={s.id} className={`rounded-2xl border p-4 ${s.active ? 'border-stone-200 bg-white' : 'border-dashed border-stone-300'}`}>
              <div className="flex items-start justify-between gap-3">
                <div><p className="text-[14px] font-medium">{s.title}</p><p className="text-[12px] text-slate-500">{s.mode === 'video' ? 'Video' : 'Audio'} · {s.durationMin} min · {TOPIC_LABELS[s.topic]}</p></div>
                <span className="font-mono-numbers text-[14px]">{naira(s.priceNgn)}</span>
              </div>
              <button className="mt-2 text-[12px] underline underline-offset-4" onClick={() => api.patch(`/me/services/${s.id}`, { active: !s.active }).then(load)}>{s.active ? 'Hide from profile' : 'Show on profile'}</button>
            </li>
          ))}
        </ul>
        <form onSubmit={addService} className="mt-5 rounded-3xl bg-mist p-5 space-y-3">
          <p className="text-[14px] font-medium">Add a service</p>
          <input aria-label="Service title" className={inputClass} placeholder="e.g. Flock health check" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
          <textarea aria-label="What’s included" rows={3} className={textareaClass} placeholder="What’s included and what the client should prepare" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <select aria-label="Topic" className={selectClass} value={f.topic} onChange={(e) => setF({ ...f, topic: e.target.value })}>{Object.entries(TOPIC_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
            <select aria-label="Call type" className={selectClass} value={f.mode} onChange={(e) => setF({ ...f, mode: e.target.value })}><option value="video">Video</option><option value="audio">Audio</option></select>
            <select aria-label="Duration" className={selectClass} value={f.durationMin} onChange={(e) => setF({ ...f, durationMin: e.target.value })}>{[15, 30, 45, 60, 90, 120].map((m) => <option key={m} value={m}>{m} min</option>)}</select>
            <input aria-label="Price in naira" type="number" min={1000} step={500} className={inputClass} value={f.priceNgn} onChange={(e) => setF({ ...f, priceNgn: e.target.value })} />
          </div>
          <p className="text-[11px] text-slate-500">You receive the price less the platform commission. Changing a price never affects bookings already paid.</p>
          <Button type="submit">Add service</Button>
        </form>
      </section>

      <section>
        <h3 className="text-[15px] font-medium">Open times</h3>
        <div className="mt-3 rounded-3xl bg-mist p-5">
          <div className="grid grid-cols-2 gap-2">
            <Field id="sl-day" label="Day"><input id="sl-day" type="date" className={inputClass} value={day} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setDay(e.target.value)} /></Field>
            <Field id="sl-len" label="Slot length"><select id="sl-len" className={`${selectClass} w-full`} value={len} onChange={(e) => setLen(e.target.value)}>{[30, 45, 60, 90, 120].map((m) => <option key={m} value={m}>{m} min</option>)}</select></Field>
          </div>
          <p className="mt-3 text-[13px] font-medium">Start times</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'].map((t) => (
              <button key={t} type="button" aria-pressed={times.includes(t)} onClick={() => setTimes(times.includes(t) ? times.filter((x) => x !== t) : [...times, t])}
                className={`h-9 px-3 rounded-full border text-[12px] font-mono-numbers ${times.includes(t) ? 'bg-lime border-lime' : 'border-stone-300 bg-white'}`}>{t}</button>
            ))}
          </div>
          <Button className="mt-4" onClick={addSlots} disabled={!times.length}><Plus className="w-4 h-4" /> Add {times.length} slot{times.length === 1 ? '' : 's'}</Button>
        </div>
        {error && <Notice tone="error" className="mt-3">{error}</Notice>}
        <ul className="mt-5 space-y-3">
          {[...byDay.entries()].map(([d, list]) => (
            <li key={d}>
              <p className="text-[12px] text-slate-500">{new Date(list[0].startsAt).toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {list.map((s) => (
                  <span key={s.id} className={`inline-flex items-center gap-1.5 h-9 pl-3 pr-1.5 rounded-full text-[12px] font-mono-numbers ${s.status === 'booked' ? 'bg-ink text-white' : s.status === 'held' ? 'bg-amber-50' : 'bg-white border border-stone-200'}`}>
                    {new Date(s.startsAt).toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit' })} · {s.durationMin}m{s.status === 'booked' ? ' · booked' : ''}
                    {s.status === 'open' && <button aria-label="Remove slot" onClick={() => api.del(`/me/slots/${s.id}`).then(load)} className="p-1 rounded-full hover:bg-stone-100"><Trash2 className="w-3.5 h-3.5" /></button>}
                  </span>
                ))}
              </div>
            </li>
          ))}
          {byDay.size === 0 && <p className="text-[13px] text-slate-500">No open times yet. Farmers can only book times you add here.</p>}
        </ul>
      </section>
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg('')} />}
    </div>
  );
};

/* ---------- specialist profile & credentials ---------- */
const SpecialistProfileForm: React.FC<{ onNavigate: (v: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [p, setP] = useState<any>(null);
  const [f, setF] = useState({ headline: '', specialties: '', languages: 'English', serviceArea: '', experienceYears: '0', credentials: '', accepting: true });
  const [msg, setMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const load = () => api.get<any>('/me/specialist').then((r) => {
    setP(r.profile);
    if (r.profile) setF({ headline: r.profile.headline, specialties: r.profile.specialties.join(', '), languages: r.profile.languages.join(', '), serviceArea: r.profile.serviceArea,
      experienceYears: String(r.profile.experienceYears), credentials: r.profile.credentials.join('\n'), accepting: r.profile.accepting });
  }).catch(() => {});
  useEffect(() => {
    load();
  }, []);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    const list = (s: string, sep: RegExp) => s.split(sep).map((x) => x.trim()).filter(Boolean);
    try {
      const r = await api.put<{ credentialStatus: string }>('/me/specialist', {
        headline: f.headline, specialties: list(f.specialties, /,/), languages: list(f.languages, /,/), serviceArea: f.serviceArea,
        experienceYears: Number(f.experienceYears), credentials: list(f.credentials, /\n/), accepting: f.accepting
      });
      setMsg({ tone: 'success', text: r.credentialStatus === 'unverified' && p?.credentialStatus === 'verified' ? 'Saved. Your credentials changed, so they need checking again.' : 'Profile saved.' });
      load();
    } catch (err) {
      setMsg({ tone: 'error', text: err instanceof ApiError ? err.message : 'Couldn’t save.' });
    }
  };
  return (
    <form onSubmit={save} className="max-w-2xl space-y-5">
      <EmailVerifyBanner />
      <Field id="sp-head" label="Headline" hint="What you help farmers with, in one line."><input id="sp-head" className={inputClass} value={f.headline} onChange={(e) => setF({ ...f, headline: e.target.value })} maxLength={140} /></Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field id="sp-spec" label="Specialties" hint="Separate with commas."><input id="sp-spec" className={inputClass} value={f.specialties} onChange={(e) => setF({ ...f, specialties: e.target.value })} /></Field>
        <Field id="sp-lang" label="Languages"><input id="sp-lang" className={inputClass} value={f.languages} onChange={(e) => setF({ ...f, languages: e.target.value })} /></Field>
        <Field id="sp-area" label="Service area"><input id="sp-area" className={inputClass} value={f.serviceArea} onChange={(e) => setF({ ...f, serviceArea: e.target.value })} placeholder="e.g. South-West, or nationwide online" /></Field>
        <Field id="sp-yrs" label="Years of experience"><input id="sp-yrs" type="number" min={0} max={60} className={inputClass} value={f.experienceYears} onChange={(e) => setF({ ...f, experienceYears: e.target.value })} /></Field>
      </div>
      <Field id="sp-cred" label="Credentials" hint="One per line: degree, licence or registration with the issuing body.">
        <textarea id="sp-cred" rows={4} className={textareaClass} value={f.credentials} onChange={(e) => setF({ ...f, credentials: e.target.value })} />
      </Field>
      <label className="flex items-center gap-3 text-[13px]"><input type="checkbox" className="w-4 h-4 accent-[#141414]" checked={f.accepting} onChange={(e) => setF({ ...f, accepting: e.target.checked })} /> Accepting new bookings</label>
      {p && (
        <div className="rounded-2xl bg-mist p-5 text-[13px]">
          <p className="font-medium">Credential check: {{ verified: 'Checked', pending: 'Being checked', unverified: 'Not checked yet' }[p.credentialStatus as string]}</p>
          {p.credentialNote && <p className="mt-1 text-slate-600">{p.credentialNote}</p>}
          {p.credentialStatus === 'unverified' && (
            <Button type="button" variant="outline" className="mt-3 h-9" onClick={() => api.post('/me/specialist/request-verification').then(() => (setMsg({ tone: 'success', text: 'Sent for checking. We’ll email you the outcome.' }), load())).catch((e: ApiError) => setMsg({ tone: 'error', text: e.message }))}>
              Ask us to check my credentials
            </Button>
          )}
        </div>
      )}
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
      <div className="flex gap-2">
        <Button type="submit" variant="lime">Save profile</Button>
        {user && p && <Button type="button" variant="outline" onClick={() => onNavigate(`specialists:${user.id}`)}>View public profile</Button>}
      </div>
    </form>
  );
};

/* ---------- page ---------- */
export const ConsultationsView: React.FC<{ sub?: string; id?: string; onNavigate: (v: string) => void }> = ({ sub, id, onNavigate }) => {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const isSpec = user?.role === 'specialist';
  const TABS = ['call', 'services', 'profile', 'clients', 'booked'];
  const openId = sub && !TABS.includes(sub) ? sub : undefined;
  const activeTab = sub && TABS.includes(sub) && sub !== 'call' ? sub : isSpec ? 'clients' : 'booked';
  if (!user)
    return <div className={`${WRAP} py-20`}><Notice>Log in to see your consultations. <button className="underline" onClick={() => onNavigate('auth:login')}>Log in</button></Notice></div>;
  if (sub === 'call' && id) return <ConsultationCall id={id} onLeave={() => onNavigate(`consultations:${id}`)} />;

  const tabs = [
    ...(isSpec ? [{ id: 'clients', label: 'Client bookings', view: 'consultations:clients' }] : []),
    { id: 'booked', label: isSpec ? 'Sessions I booked' : 'My consultations', view: 'consultations:booked' },
    ...(isSpec ? [{ id: 'services', label: 'Services & availability', view: 'consultations:services' }, { id: 'profile', label: 'Profile & credentials', view: 'consultations:profile' }] : [])
  ];

  return (
    <div className={`${WRAP} py-12 sm:py-16`}>
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <Kicker>Consultations</Kicker>
          <h1 className="mt-4 font-display text-[34px] sm:text-[48px] font-normal leading-[1.05] tracking-[-0.03em]">{isSpec ? 'Your consulting practice' : 'Your expert consultations'}</h1>
        </div>
        <div className="flex gap-2">
          {isSpec && <Button variant="outline" onClick={() => onNavigate('earnings')}>Earnings & payouts</Button>}
          <Button variant="lime" onClick={() => onNavigate('specialists')}>Find an expert</Button>
        </div>
      </div>
      <div className="mt-8 flex border-b border-stone-200 gap-6 text-[13px] font-medium overflow-x-auto whitespace-nowrap" role="tablist">
        {tabs.map((t) => (
          <button key={t.id} role="tab" aria-selected={activeTab === t.id} onClick={() => onNavigate(t.view)} className={`pb-3 ${activeTab === t.id ? 'text-ink border-b-2 border-ink' : 'text-slate-500 hover:text-ink'}`}>{t.label}</button>
        ))}
      </div>
      <div className="mt-8">
        {activeTab === 'clients' && <BookingList as="specialist" refreshKey={refreshKey} onNavigate={onNavigate} onOpen={(bid) => onNavigate(`consultations:${bid}`)} />}
        {activeTab === 'booked' && <BookingList as="client" refreshKey={refreshKey} onNavigate={onNavigate} onOpen={(bid) => onNavigate(`consultations:${bid}`)} />}
        {activeTab === 'services' && <ServicesAndSlots />}
        {activeTab === 'profile' && <SpecialistProfileForm onNavigate={onNavigate} />}
      </div>
      {openId && <BookingDetail id={openId} onNavigate={onNavigate} onClose={() => onNavigate(isSpec ? 'consultations:clients' : 'consultations')} onChanged={() => setRefreshKey((k) => k + 1)} />}
    </div>
  );
};
