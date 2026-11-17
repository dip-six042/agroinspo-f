import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BadgeCheck, MapPin, Search, Star, Video, Phone, MessageCircle, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api, ApiError, firstName, Service, Slot, SpecialistSummary, startConversation, TOPIC_LABELS } from '../../lib/api';
import { Avatar, Button, Kicker, naira, Notice, Pill, selectClass, textareaClass, Toast, WRAP } from '../ui';

const credentialPill = (s: SpecialistSummary) =>
  s.credentialStatus === 'verified' ? <Pill tone="good"><BadgeCheck className="w-3 h-3" /> Credentials checked</Pill>
  : s.credentialStatus === 'pending' ? <Pill tone="warn">Credentials being checked</Pill>
  : <Pill>Self-declared credentials</Pill>;

const Stars: React.FC<{ rating: number | null; count: number }> = ({ rating, count }) =>
  rating ? (
    <span className="inline-flex items-center gap-1 text-[12px]"><Star className="w-3.5 h-3.5 fill-ink" /> <span className="font-mono-numbers">{rating.toFixed(1)}</span><span className="text-slate-500">({count})</span></span>
  ) : <span className="text-[12px] text-slate-500">New</span>;

const dayKey = (iso: string) => new Date(iso).toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' });
const timeOf = (iso: string) => new Date(iso).toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit' });

/* ---------- profile + booking ---------- */
const ExpertProfile: React.FC<{ id: string; onNavigate: (v: string) => void; onBack: () => void }> = ({ id, onNavigate, onBack }) => {
  const { user } = useAuth();
  const [data, setData] = useState<{ specialist: SpecialistSummary; services: Service[]; slots: Slot[]; reviews: { rating: number; comment: string; createdAt: string; by: string }[] } | null>(null);
  const [error, setError] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [slotId, setSlotId] = useState('');
  const [objective, setObjective] = useState('');
  const [busy, setBusy] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    api.get<any>(`/specialists/${id}`).then((r) => {
      setData(r);
      setServiceId(r.services[0]?.id ?? '');
    }).catch((e: ApiError) => setError(e.message));
  }, [id]);

  const service = data?.services.find((s) => s.id === serviceId);
  const days = useMemo(() => {
    const m = new Map<string, Slot[]>();
    for (const s of data?.slots ?? []) if (!service || s.durationMin >= service.durationMin) m.set(dayKey(s.startsAt), [...(m.get(dayKey(s.startsAt)) ?? []), s]);
    return [...m.entries()];
  }, [data, service]);

  if (error) return <Notice tone="error">{error}</Notice>;
  if (!data) return <p className="text-[13px] text-slate-500">Loading…</p>;
  const s = data.specialist;
  const isMe = user?.id === s.id;

  const book = async () => {
    if (!user) return onNavigate('auth:signup:farmer');
    setBusy(true);
    setError('');
    try {
      const r = await api.post<{ checkoutUrl: string }>('/bookings', { serviceId, slotId, objective });
      window.location.assign(r.checkoutUrl);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Couldn’t start the booking.');
      setBusy(false);
    }
  };
  const message = async () => {
    if (!user) return onNavigate('auth:login');
    try {
      onNavigate(`messages:${await startConversation(s.id)}`);
    } catch (e) {
      setToastMsg(e instanceof ApiError ? e.message : 'Couldn’t open a conversation.');
    }
  };

  return (
    <div>
      <button onClick={onBack} className="inline-flex items-center gap-2 text-[13px] text-slate-600 hover:text-ink"><ArrowLeft className="w-4 h-4" /> All experts</button>
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px] gap-8 items-start">
        <section>
          <div className="flex items-start gap-5">
            <Avatar name={s.name} src={s.avatarUrl} size={80} />
            <div className="min-w-0">
              <h1 className="font-display text-[30px] sm:text-[38px] font-normal leading-[1.1] tracking-[-0.02em]">{s.name}</h1>
              <p className="mt-1 text-[14px] text-slate-600">{s.headline}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">{credentialPill(s)}<Stars rating={s.rating} count={s.reviewCount} />
                <span className="text-[12px] text-slate-500">{s.sessions} sessions · {s.experienceYears} yrs experience</span></div>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-slate-600">
            <span className="inline-flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{s.location || s.serviceArea}</span>
            <span>Speaks {s.languages.join(', ')}</span>
          </div>
          {s.specialties.length > 0 && <div className="mt-4 flex flex-wrap gap-1.5">{s.specialties.map((x) => <Pill key={x}>{x}</Pill>)}</div>}

          <div className="mt-8 rounded-3xl bg-mist p-6">
            <h2 className="text-[15px] font-medium">Credentials</h2>
            <ul className="mt-3 space-y-1.5 text-[13px]">{s.credentials.map((c) => <li key={c} className="flex gap-2.5"><span className="mt-[7px] w-1 h-1 rounded-full bg-ink shrink-0" />{c}</li>)}</ul>
            <p className="mt-4 text-[12px] text-slate-500 leading-relaxed">
              {s.credentialStatus === 'verified' ? `What we checked: ${s.credentialNote}` : 'These credentials are as stated by the specialist and haven’t been checked by Agro Inspo yet.'}
              {' '}A credential check isn’t a guarantee of advice outcomes.
            </p>
          </div>

          <h2 className="mt-10 text-[15px] font-medium">Reviews</h2>
          {data.reviews.length === 0 ? <p className="mt-2 text-[13px] text-slate-500">No reviews yet. Reviews come only from clients who completed a paid consultation.</p> : (
            <ul className="mt-3 space-y-3">
              {data.reviews.map((r, i) => (
                <li key={i} className="rounded-2xl border border-stone-200 bg-white p-4">
                  <p className="flex items-center gap-1">{Array.from({ length: 5 }, (_, k) => <Star key={k} className={`w-3.5 h-3.5 ${k < r.rating ? 'fill-ink' : 'text-slate-300'}`} />)}<span className="ml-2 text-[12px] text-slate-500">{r.by} · {new Date(r.createdAt).toLocaleDateString('en-NG')}</span></p>
                  {r.comment && <p className="mt-2 text-[13px] leading-relaxed">{r.comment}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Booking card */}
        <aside className="lg:sticky lg:top-28 rounded-3xl border border-stone-200 bg-white p-6">
          <h2 className="font-display text-[22px]">Book a consultation</h2>
          {isMe ? <Notice className="mt-4">This is your public profile. Manage services and times in Consultations.</Notice>
            : data.services.length === 0 || !s.accepting ? <Notice className="mt-4">This specialist isn’t taking bookings right now.</Notice> : (
            <>
              <fieldset className="mt-4 space-y-2">
                <legend className="sr-only">Service</legend>
                {data.services.map((sv) => (
                  <label key={sv.id} className={`block rounded-2xl border p-4 cursor-pointer ${serviceId === sv.id ? 'border-ink' : 'border-stone-200'}`}>
                    <span className="flex items-start justify-between gap-3">
                      <span className="flex items-start gap-3">
                        <input type="radio" name="svc" className="mt-1 accent-[#141414]" checked={serviceId === sv.id} onChange={() => (setServiceId(sv.id), setSlotId(''))} />
                        <span><span className="block text-[14px] font-medium">{sv.title}</span>
                          <span className="text-[12px] text-slate-500 inline-flex items-center gap-1.5">{sv.mode === 'video' ? <Video className="w-3 h-3" /> : <Phone className="w-3 h-3" />}{sv.mode === 'video' ? 'Video' : 'Audio'} call · {sv.durationMin} min · {TOPIC_LABELS[sv.topic]}</span></span>
                      </span>
                      <span className="font-mono-numbers text-[14px]">{naira(sv.priceNgn)}</span>
                    </span>
                    {serviceId === sv.id && <span className="block mt-2 ml-7 text-[12px] text-slate-600 leading-relaxed">{sv.description}</span>}
                  </label>
                ))}
              </fieldset>

              <p className="mt-5 text-[13px] font-medium">Choose a time <span className="font-normal text-slate-500">(your local time)</span></p>
              {days.length === 0 ? <p className="mt-2 text-[13px] text-slate-500">No open times in the next 30 days. Send a message to ask.</p> : (
                <div className="mt-2 space-y-3 max-h-64 overflow-y-auto pr-1">
                  {days.map(([day, slots]) => (
                    <div key={day}>
                      <p className="text-[12px] text-slate-500">{day}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {slots.map((sl) => (
                          <button key={sl.id} onClick={() => setSlotId(sl.id)} aria-pressed={slotId === sl.id}
                            className={`h-9 px-3 rounded-full border text-[12px] font-mono-numbers ${slotId === sl.id ? 'bg-lime border-lime' : 'border-stone-300 hover:border-ink'}`}>
                            {timeOf(sl.startsAt)}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <label htmlFor="bk-obj" className="block mt-5 text-[13px] font-medium">What do you need help with?</label>
              <textarea id="bk-obj" rows={3} className={`${textareaClass} mt-1.5`} value={objective} onChange={(e) => setObjective(e.target.value)}
                placeholder="Crop or animal, farm size, symptoms, what you’ve tried" maxLength={2000} />

              {service && (
                <dl className="mt-4 text-[13px] border-t border-stone-100 pt-3 space-y-1.5">
                  <div className="flex justify-between"><dt className="text-slate-500">You pay</dt><dd className="font-mono-numbers font-medium">{naira(service.priceNgn)}</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-500">Cancellation</dt><dd className="text-right">Free up to 24 h before</dd></div>
                </dl>
              )}
              <p className="mt-2 text-[11px] text-slate-500 leading-relaxed">Payment is taken by Kora when you book. If the specialist cancels or doesn’t join, you’re refunded in full. The specialist receives the fee less the platform commission after the session.</p>
              {error && <Notice tone="error" className="mt-3">{error}</Notice>}
              <Button variant="lime" className="mt-4 w-full h-12" busy={busy} disabled={!serviceId || !slotId || objective.trim().length < 20} onClick={book}>
                {user ? `Book and pay ${service ? naira(service.priceNgn) : ''}` : 'Join free to book'}
              </Button>
              {objective.trim().length > 0 && objective.trim().length < 20 && <p className="mt-2 text-[11px] text-slate-500">Add a little more detail (at least 20 characters).</p>}
            </>
          )}
          {!isMe && <Button variant="outline" className="mt-3 w-full" onClick={message}><MessageCircle className="w-4 h-4" /> Message {firstName(s.name)}</Button>}
        </aside>
      </div>
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg('')} />}
    </div>
  );
};

/* ---------- directory ---------- */
export const SpecialistsView: React.FC<{ id?: string; onNavigate: (v: string) => void }> = ({ id, onNavigate }) => {
  const [list, setList] = useState<SpecialistSummary[] | null>(null);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [topic, setTopic] = useState('');
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);
  useEffect(() => {
    const p = new URLSearchParams();
    if (debounced) p.set('q', debounced);
    if (topic) p.set('topic', topic);
    if (verified) p.set('verified', '1');
    api.get<{ specialists: SpecialistSummary[] }>(`/specialists?${p}`).then((r) => setList(r.specialists)).catch((e: ApiError) => setError(e.message));
  }, [debounced, topic, verified]);

  return (
    <div className={`${WRAP} py-12 sm:py-16`}>
      {id ? <ExpertProfile id={id} onNavigate={onNavigate} onBack={() => onNavigate('specialists')} /> : (
        <>
          <Kicker>Experts</Kicker>
          <h1 className="mt-4 font-display text-[34px] sm:text-[48px] font-normal leading-[1.05] tracking-[-0.03em] max-w-3xl">
            Book an agricultural specialist by video or audio call.
          </h1>
          <div className="mt-8 flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <label htmlFor="ex-q" className="sr-only">Search experts</label>
              <input id="ex-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, crop, animal, skill or state"
                className="w-full h-11 pl-10 pr-4 rounded-full border border-stone-300 bg-white text-[14px] focus:outline-none focus:border-ink" />
            </div>
            <label htmlFor="ex-topic" className="sr-only">Topic</label>
            <select id="ex-topic" className={selectClass} value={topic} onChange={(e) => setTopic(e.target.value)}>
              <option value="">All topics</option>
              {Object.entries(TOPIC_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
            <button onClick={() => setVerified(!verified)} aria-pressed={verified}
              className={`h-11 px-4 rounded-full border text-[13px] ${verified ? 'bg-ink text-white border-ink' : 'border-stone-300'}`}>Credentials checked</button>
          </div>
          {error && <Notice tone="error" className="mt-6">{error}</Notice>}
          {list?.length === 0 && <Notice className="mt-6">No experts match. Try a broader search.</Notice>}
          <ul className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {list?.map((s) => (
              <li key={s.id}>
                <button onClick={() => onNavigate(`specialists:${s.id}`)} className="w-full h-full text-left rounded-3xl border border-stone-200 bg-white p-5 hover:border-ink transition-colors flex flex-col">
                  <div className="flex items-start gap-4">
                    <Avatar name={s.name} src={s.avatarUrl} size={56} />
                    <div className="min-w-0">
                      <p className="text-[16px] font-medium leading-snug">{s.name}</p>
                      <p className="text-[12px] text-slate-500 line-clamp-2">{s.headline}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">{credentialPill(s)}<Stars rating={s.rating} count={s.reviewCount} /></div>
                  <p className="mt-3 text-[12px] text-slate-500 inline-flex items-center gap-1.5"><MapPin className="w-3 h-3" />{s.location} · {s.experienceYears} yrs</p>
                  <div className="mt-auto pt-4 flex items-center justify-between text-[13px]">
                    <span className="inline-flex items-center gap-1.5 text-slate-600"><Clock className="w-3.5 h-3.5" />{s.nextSlot ? `Next: ${dayKey(s.nextSlot)}, ${timeOf(s.nextSlot)}` : 'No open times'}</span>
                    {s.fromPriceNgn !== null && <span className="font-mono-numbers">from {naira(s.fromPriceNgn)}</span>}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};
