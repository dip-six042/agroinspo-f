import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Users, Radio, PlayCircle, Plus, Video } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api, ApiError, EventItem, formatEventDate, TOPIC_LABELS } from '../../lib/api';
import { Button, Field, inputClass, Kicker, Modal, naira, Notice, Pill, Toast, WRAP } from '../ui';
import { EventEditor } from './events/EventEditor';
import { EventRoom } from './events/EventRoom';
import { EventSponsorship } from './events/EventSponsorship';
import { SponsoredSlot } from '../business/Sponsored';

const HOST_ROLES = ['specialist', 'business', 'admin'];
type Tab = 'upcoming' | 'replays' | 'mine' | 'hosting';

const DateBlock: React.FC<{ iso: string }> = ({ iso }) => {
  const d = new Date(iso);
  return (
    <div className="w-14 shrink-0 text-center rounded-2xl bg-mist py-2">
      <p className="text-[11px] uppercase tracking-wider text-slate-500">{d.toLocaleString('en-NG', { month: 'short' })}</p>
      <p className="font-display text-[24px] leading-none mt-0.5 font-mono-numbers">{d.getDate()}</p>
    </div>
  );
};

const statusPill = (e: EventItem) =>
  e.status === 'live' ? <Pill tone="lime"><Radio className="w-3 h-3" /> Live now</Pill>
  : e.status === 'cancelled' ? <Pill tone="bad">Cancelled</Pill>
  : e.status === 'ended' ? (e.replayAvailable ? <Pill><PlayCircle className="w-3 h-3" /> Replay</Pill> : <Pill>Ended</Pill>)
  : null;

/* ---------- detail ---------- */
const EventDetail: React.FC<{ event: EventItem; onClose: () => void; onChanged: () => void; onNavigate: (v: string) => void; toast: (m: string) => void }> = ({ event: e, onClose, onChanged, onNavigate, toast }) => {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [showCancel, setShowCancel] = useState(false);
  const [replayUrl, setReplayUrl] = useState(e.replayUrl || '');
  const [attendees, setAttendees] = useState<any[] | null>(null);

  const run = async (fn: () => Promise<unknown>, okMsg?: string) => {
    setBusy(true);
    setError('');
    try {
      await fn();
      if (okMsg) toast(okMsg);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const register = () =>
    run(async () => {
      const r = await api.post<{ status: string; checkoutUrl?: string }>(`/events/${e.id}/register`);
      if (r.checkoutUrl) window.location.assign(r.checkoutUrl);
    }, e.priceNgn ? undefined : 'You’re registered. We’ll remind you before it starts.');

  const watchReplay = () =>
    run(async () => {
      const r = await api.get<{ replayUrl: string }>(`/events/${e.id}/replay`);
      window.open(r.replayUrl, '_blank', 'noopener,noreferrer');
    });

  const registered = e.myRegistration === 'registered';

  return (
    <Modal title={e.title} onClose={onClose} wide>
      <div className="flex flex-wrap gap-2">
        {statusPill(e)}
        <Pill>{TOPIC_LABELS[e.topic] ?? e.topic}</Pill>
        <Pill>{e.priceNgn ? naira(e.priceNgn) : 'Free'}</Pill>
        {e.recording && <Pill tone="warn">Recorded</Pill>}
      </div>
      <div className="mt-5 grid sm:grid-cols-3 gap-3 text-[13px]">
        <div className="rounded-2xl bg-mist p-4"><Calendar className="w-4 h-4" /><p className="mt-2 font-medium">{formatEventDate(e.startsAt)}</p><p className="text-slate-500">Your local time</p></div>
        <div className="rounded-2xl bg-mist p-4"><Clock className="w-4 h-4" /><p className="mt-2 font-medium">{e.durationMin} minutes</p><p className="text-slate-500">Live video in your browser</p></div>
        <div className="rounded-2xl bg-mist p-4"><Users className="w-4 h-4" /><p className="mt-2 font-medium font-mono-numbers">{e.registeredCount} registered</p><p className="text-slate-500">{e.spotsLeft === null ? 'No limit' : `${e.spotsLeft} spots left`}</p></div>
      </div>
      <p className="mt-6 text-[14px] leading-relaxed whitespace-pre-wrap">{e.description}</p>
      <p className="mt-4 text-[13px] text-slate-600">Hosted by <span className="font-medium text-ink">{e.host.name}</span>{e.host.title ? ` · ${e.host.title}` : ''}{e.speakers ? ` · Speakers: ${e.speakers}` : ''}</p>
      {e.recording && <Notice className="mt-4">This session is recorded. You’ll be asked to agree before joining. Replays are available to {e.replayAccess === 'members' ? 'all members' : 'people who registered'}.</Notice>}

      {error && <Notice tone="error" className="mt-4">{error}</Notice>}

      {/* Attendee actions */}
      {!e.isHost && (
        <div className="mt-6 flex flex-wrap gap-2">
          {!user ? (
            <Button variant="lime" onClick={() => onNavigate('auth:signup')}>Join free to register</Button>
          ) : e.status === 'ended' ? (
            e.replayAvailable && <Button variant="lime" busy={busy} onClick={watchReplay}><PlayCircle className="w-4 h-4" /> Watch replay</Button>
          ) : e.status === 'cancelled' ? null : registered ? (
            <>
              {e.canJoin ? <Button variant="lime" onClick={() => onNavigate(`events:room:${e.id}`)}><Video className="w-4 h-4" /> Join the room</Button>
                : <Pill tone="good" className="h-11 px-5 text-[13px]">You’re registered</Pill>}
              {!e.priceNgn && <Button variant="ghost" busy={busy} onClick={() => run(() => api.post(`/events/${e.id}/unregister`), 'Registration cancelled.')}>Cancel registration</Button>}
            </>
          ) : e.spotsLeft === 0 ? (
            <Pill className="h-11 px-5 text-[13px]">This event is full</Pill>
          ) : (
            <Button variant="lime" busy={busy} onClick={register}>{e.priceNgn ? `Get a ticket · ${naira(e.priceNgn)}` : 'Register free'}</Button>
          )}
          {e.myRegistration === 'pending_payment' && <Notice className="w-full">Your ticket payment isn’t complete yet. Choose “Get a ticket” to try again.</Notice>}
        </div>
      )}

      {/* Host tools */}
      {e.isHost && (
        <div className="mt-6 rounded-3xl border border-stone-200 p-5">
          <p className="text-[14px] font-medium">Host tools</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(e.status === 'scheduled' || e.status === 'live') && (
              <Button variant="lime" className="h-10" onClick={() => onNavigate(`events:room:${e.id}`)}><Video className="w-4 h-4" /> Open the room</Button>
            )}
            {e.status === 'scheduled' && <Button variant="outline" className="h-10" onClick={() => onNavigate(`events:edit:${e.id}`)}>Edit</Button>}
            <Button variant="outline" className="h-10" busy={busy && attendees === null} onClick={() => api.get<{ attendees: any[] }>(`/events/${e.id}/attendees`).then((r) => setAttendees(r.attendees)).catch(() => {})}>
              Attendees
            </Button>
            {(e.status === 'scheduled' || e.status === 'live') && <Button variant="ghost" className="h-10" onClick={() => setShowCancel(!showCancel)}>Cancel event</Button>}
          </div>
          {showCancel && (
            <div className="mt-4">
              <Field id="ev-cancel" label="Reason (sent to everyone registered)">
                <input id="ev-cancel" className={inputClass} value={cancelReason} onChange={(x) => setCancelReason(x.target.value)} />
              </Field>
              <Button variant="danger" className="mt-3 h-10" busy={busy} disabled={cancelReason.trim().length < 5}
                onClick={() => run(() => api.post(`/events/${e.id}/cancel`, { reason: cancelReason }), 'Event cancelled. Registrants have been told.')}>
                Cancel event and notify
              </Button>
            </div>
          )}
          {attendees && (
            <ul className="mt-4 text-[13px] border-t border-stone-100">
              {attendees.length === 0 && <li className="py-3 text-slate-500">No registrations yet.</li>}
              {attendees.map((a) => (
                <li key={a.id} className="py-2.5 border-b border-stone-100 flex justify-between gap-3">
                  <span>{a.name}{a.paid ? ' · paid' : ''}</span>
                  <span className="text-slate-500">{a.joinedAt ? 'Attended' : a.status === 'registered' ? 'Registered' : 'Payment pending'}</span>
                </li>
              ))}
            </ul>
          )}
          {e.status === 'ended' && e.recording && (
            <div className="mt-4">
              <Field id="ev-replay" label="Replay link" hint="Upload the recording to your video host and paste the secure https:// link.">
                <input id="ev-replay" className={inputClass} value={replayUrl} onChange={(x) => setReplayUrl(x.target.value)} placeholder="https://" />
              </Field>
              <Button className="mt-3 h-10" busy={busy} onClick={() => run(() => api.post(`/events/${e.id}/replay`, { replayUrl, publish: true }), 'Replay published.')}>
                {e.replayPublished ? 'Update replay' : 'Publish replay'}
              </Button>
            </div>
          )}
        </div>
      )}
      <EventSponsorship eventId={e.id} eventStatus={e.status} onNavigate={onNavigate} />
    </Modal>
  );
};

/* ---------- page ---------- */
export const EventsView: React.FC<{ sub?: string; id?: string; onNavigate: (v: string) => void }> = ({ sub, id, onNavigate }) => {
  const { user } = useAuth();
  const canHost = !!user && HOST_ROLES.includes(user.role);
  const [tab, setTab] = useState<Tab>((['replays', 'mine', 'hosting'].includes(sub || '') ? sub : 'upcoming') as Tab);
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState('');
  const [events, setEvents] = useState<EventItem[] | null>(null);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState<string | undefined>(sub && !['new', 'edit', 'room', 'replays', 'mine', 'hosting'].includes(sub) ? sub : undefined);
  const [openEvent, setOpenEvent] = useState<EventItem | null>(null);
  const [toastMsg, setToastMsg] = useState('');

  const load = () => {
    setError('');
    const params = new URLSearchParams({ when: tab });
    if (query.trim()) params.set('q', query.trim());
    if (topic) params.set('topic', topic);
    api.get<{ events: EventItem[] }>(`/events?${params}`).then((r) => setEvents(r.events)).catch((e: ApiError) => setError(e.message));
  };
  useEffect(load, [tab, topic, user?.id]);
  useEffect(() => {
    if (!openId) return setOpenEvent(null);
    api.get<{ event: EventItem }>(`/events/${openId}`).then((r) => setOpenEvent(r.event)).catch(() => setOpenId(undefined));
  }, [openId]);

  if (sub === 'room' && id) return <EventRoom eventId={id} onLeave={() => onNavigate(`events:${id}`)} />;
  if (sub === 'new' || sub === 'edit')
    return <div className={`${WRAP} py-12 sm:py-16`}><EventEditor eventId={sub === 'edit' ? id : undefined} onNavigate={onNavigate} /></div>;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'upcoming', label: 'Upcoming & live' },
    { id: 'replays', label: 'Replay library' },
    ...(user ? [{ id: 'mine' as Tab, label: 'My events' }] : []),
    ...(canHost ? [{ id: 'hosting' as Tab, label: 'Hosting' }] : [])
  ];

  return (
    <div className={`${WRAP} py-12 sm:py-16`}>
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <Kicker>Live sessions & webinars</Kicker>
          <h1 className="mt-4 font-display text-[34px] sm:text-[48px] font-normal leading-[1.05] tracking-[-0.03em] max-w-3xl">
            Consultants and agricultural businesses host live sessions here. Replays stay in the library when recording was agreed.
          </h1>
        </div>
        {canHost && <Button variant="ink" onClick={() => onNavigate('events:new')} className="self-start lg:self-auto"><Plus className="w-4 h-4" /> Schedule a webinar</Button>}
      </div>

      <div className="mt-8 flex border-b border-stone-200 gap-6 text-[13px] font-medium overflow-x-auto whitespace-nowrap" role="tablist">
        {tabs.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
            className={`pb-3 ${tab === t.id ? 'text-ink border-b-2 border-ink' : 'text-slate-500 hover:text-ink'}`}>{t.label}</button>
        ))}
      </div>

      <form className="mt-6 flex flex-col sm:flex-row gap-3" onSubmit={(e) => { e.preventDefault(); load(); }}>
        <input className="h-11 flex-1 px-4 rounded-full border border-stone-300 text-[14px]" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search title, host or topic" aria-label="Search webinars" />
        <select className="h-11 px-4 rounded-full border border-stone-300 text-[14px] bg-white" value={topic} onChange={(e) => setTopic(e.target.value)} aria-label="Category">
          <option value="">All categories</option>
          {Object.entries(TOPIC_LABELS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
        </select>
        <Button type="submit" variant="outline">Search</Button>
      </form>

      {error && <Notice tone="error" className="mt-6">{error}</Notice>}
      {tab === 'upcoming' && <SponsoredSlot placement="events" onNavigate={onNavigate} className="mt-8" />}
      {events?.length === 0 && (
        <div className="mt-8 rounded-3xl border border-dashed border-stone-300 p-10 text-center">
          <p className="font-display text-[22px]">{{ upcoming: 'No upcoming events yet.', replays: 'No replays published yet.', mine: 'You haven’t registered for any events.', hosting: 'You aren’t hosting any events.' }[tab]}</p>
          {tab === 'hosting' && <Button variant="lime" className="mt-4" onClick={() => onNavigate('events:new')}>Host your first event</Button>}
        </div>
      )}

      <ul className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {events?.map((e) => (
          <li key={e.id}>
            <button onClick={() => setOpenId(e.id)} className={`w-full h-full text-left rounded-3xl border p-5 flex flex-col transition-colors ${e.status === 'live' ? 'border-ink bg-white' : 'border-stone-200 bg-white hover:border-stone-400'}`}>
              <div className="flex items-start gap-4">
                <DateBlock iso={e.startsAt} />
                <div className="min-w-0">
                  <div className="flex flex-wrap gap-1.5">{statusPill(e)}<Pill>{TOPIC_LABELS[e.topic] ?? e.topic}</Pill></div>
                  <p className="mt-2 text-[15px] font-medium leading-snug">{e.title}</p>
                </div>
              </div>
              <p className="mt-4 text-[13px] text-slate-500 line-clamp-2">{e.description}</p>
              <div className="mt-auto pt-4 flex flex-wrap items-center justify-between gap-2 text-[12px]">
                <span className="text-slate-600">{e.host.name} · {new Date(e.startsAt).toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit' })}</span>
                <span className="font-medium font-mono-numbers">
                  {e.myRegistration === 'registered' ? 'Registered' : e.isHost ? 'You’re hosting' : e.priceNgn ? naira(e.priceNgn) : 'Free'}
                </span>
              </div>
            </button>
          </li>
        ))}
      </ul>

      {openEvent && (
        <EventDetail event={openEvent} onClose={() => setOpenId(undefined)} onNavigate={onNavigate} toast={setToastMsg}
          onChanged={() => {
            load();
            api.get<{ event: EventItem }>(`/events/${openEvent.id}`).then((r) => setOpenEvent(r.event)).catch(() => {});
          }} />
      )}
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg('')} />}
    </div>
  );
};
