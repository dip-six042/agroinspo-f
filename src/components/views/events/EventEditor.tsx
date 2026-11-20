import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { api, ApiError, EventItem, TOPIC_LABELS } from '../../../lib/api';
import { Button, Field, inputClass, Kicker, Notice, selectClass, textareaClass } from '../../ui';
import { EmailVerifyBanner } from '../CommunityView';

const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const EventEditor: React.FC<{ eventId?: string; onNavigate: (v: string) => void }> = ({ eventId, onNavigate }) => {
  const { user } = useAuth();
  const [f, setF] = useState({
    title: '', description: '', topic: '', speakers: '', startsAt: '', durationMin: '60', capacity: '', priceNgn: '0', recording: true, replayAccess: 'registrants'
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!eventId) return;
    api.get<{ event: EventItem }>(`/events/${eventId}`).then(({ event: e }) =>
      setF({
        title: e.title, description: e.description, topic: e.topic, speakers: e.speakers, startsAt: toLocalInput(e.startsAt),
        durationMin: String(e.durationMin), capacity: e.capacity?.toString() ?? '', priceNgn: String(e.priceNgn), recording: e.recording, replayAccess: e.replayAccess
      })
    ).catch((x: ApiError) => setError(x.message));
  }, [eventId]);

  if (!user || !['specialist', 'business', 'admin'].includes(user.role))
    return <Notice>Agricultural consultants, businesses and admins can schedule webinars.</Notice>;

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const body = {
      ...f,
      startsAt: f.startsAt ? new Date(f.startsAt).toISOString() : '',
      durationMin: Number(f.durationMin),
      capacity: f.capacity === '' ? null : Number(f.capacity),
      priceNgn: Number(f.priceNgn || 0)
    };
    try {
      const r = eventId ? await api.patch<{ event: EventItem }>(`/events/${eventId}`, body) : await api.post<{ event: EventItem }>('/events', body);
      onNavigate(`events:${r.event.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Couldn’t save the event.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <button onClick={() => onNavigate('events:hosting')} className="inline-flex items-center gap-2 text-[13px] text-slate-600 hover:text-ink">
        <ArrowLeft className="w-4 h-4" /> Events you’re hosting
      </button>
      <div className="mt-6"><Kicker>Host</Kicker></div>
      <h1 className="mt-3 font-display text-[30px] sm:text-[40px] font-normal leading-[1.1] tracking-[-0.02em]">{eventId ? 'Edit webinar' : 'Schedule a webinar'}</h1>
      <p className="mt-3 text-[13px] text-slate-500">Agricultural consultants and businesses can host. Set a capacity if the session is only for registered people. Recording asks everyone to agree before they join.</p>
      <div className="mt-5"><EmailVerifyBanner /></div>
      <form onSubmit={submit} className="mt-8 space-y-5">
        <Field id="ev-title" label="Title"><input id="ev-title" className={inputClass} value={f.title} onChange={set('title')} maxLength={140} required /></Field>
        <Field id="ev-desc" label="What attendees will learn"><textarea id="ev-desc" rows={5} className={textareaClass} value={f.description} onChange={set('description')} maxLength={5000} required /></Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field id="ev-topic" label="Topic">
            <select id="ev-topic" className={`${selectClass} w-full`} value={f.topic} onChange={set('topic')} required>
              <option value="">Choose…</option>
              {Object.entries(TOPIC_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </Field>
          <Field id="ev-speakers" label="Speakers" hint="Optional. Names and roles."><input id="ev-speakers" className={inputClass} value={f.speakers} onChange={set('speakers')} maxLength={300} /></Field>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <Field id="ev-start" label="Starts" hint="In your local time."><input id="ev-start" type="datetime-local" className={inputClass} value={f.startsAt} onChange={set('startsAt')} required /></Field>
          <Field id="ev-dur" label="Duration">
            <select id="ev-dur" className={`${selectClass} w-full`} value={f.durationMin} onChange={set('durationMin')}>
              {[30, 45, 60, 90, 120, 180].map((m) => <option key={m} value={m}>{m >= 60 ? `${m / 60} hour${m > 60 ? 's' : ''}` : `${m} minutes`}</option>)}
            </select>
          </Field>
          <Field id="ev-cap" label="Capacity" hint="Leave empty for no limit."><input id="ev-cap" type="number" min={1} className={inputClass} value={f.capacity} onChange={set('capacity')} /></Field>
        </div>
        <Field id="ev-price" label="Ticket price (₦)" hint="0 for a free event. Paid tickets are collected through Kora; platform fees and payouts arrive with the earnings ledger.">
          <input id="ev-price" type="number" min={0} step={100} className={inputClass} value={f.priceNgn} onChange={set('priceNgn')} />
        </Field>
        <div className="rounded-2xl bg-mist p-5 space-y-3">
          <label className="flex items-start gap-3 text-[13px]">
            <input type="checkbox" className="mt-1 w-4 h-4 accent-[#141414]" checked={f.recording} onChange={(e) => setF({ ...f, recording: e.target.checked })} />
            <span><span className="font-medium">Record this event</span> · attendees are told before they join and must agree. You can publish a replay afterwards.</span>
          </label>
          {f.recording && (
            <div className="pl-7">
              <label htmlFor="ev-replay-access" className="text-[13px] font-medium">Who can watch the replay</label>
              <select id="ev-replay-access" className={`${selectClass} w-full mt-1.5`} value={f.replayAccess} onChange={set('replayAccess')}>
                <option value="registrants">People who registered{Number(f.priceNgn) > 0 ? ' (ticket holders)' : ''}</option>
                <option value="members">All signed-in members</option>
              </select>
            </div>
          )}
        </div>
        {error && <Notice tone="error">{error}</Notice>}
        <Button type="submit" variant="lime" busy={busy} className="h-12 px-7">{eventId ? 'Save changes' : 'Publish event'}</Button>
      </form>
    </div>
  );
};
