import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Radio, Check, MessageSquare, HelpCircle, Mic, Video } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { api, ApiError, EventItem, timeAgo } from '../../../lib/api';
import { Button, Notice } from '../../ui';

interface Msg { id: string; kind: 'chat' | 'question'; body: string; answered: boolean; createdAt: string; user: { id: string; name: string }; fromHost: boolean }

/**
 * The live event room. With VIDEO_PROVIDER=dummy the stage is simulated; chat, Q&A,
 * attendance, consent and host controls are real. With Agora, mount the Agora Web SDK
 * in <Stage> using the token returned by POST /api/events/:id/join.
 */
export const EventRoom: React.FC<{ eventId: string; onLeave: () => void }> = ({ eventId, onLeave }) => {
  const { user } = useAuth();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [joined, setJoined] = useState<{ role: 'host' | 'audience'; video: { provider: string } } | null>(null);
  const [needsConsent, setNeedsConsent] = useState(false);
  const [error, setError] = useState('');
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [tab, setTab] = useState<'chat' | 'question'>('chat');
  const [draft, setDraft] = useState('');
  const lastRef = useRef('');
  const listRef = useRef<HTMLDivElement>(null);

  const refreshEvent = () => api.get<{ event: EventItem }>(`/events/${eventId}`).then((r) => setEvent(r.event)).catch(() => {});

  const join = async (consent: boolean) => {
    setError('');
    try {
      const r = await api.post<{ role: 'host' | 'audience'; video: { provider: string } }>(`/events/${eventId}/join`, { recordingConsent: consent });
      setJoined(r);
      setNeedsConsent(false);
    } catch (e) {
      if (e instanceof ApiError && e.code === 'consent_required') setNeedsConsent(true);
      else setError(e instanceof ApiError ? e.message : 'Couldn’t join the room.');
    }
  };

  useEffect(() => {
    refreshEvent();
    join(false);
  }, [eventId]);

  // Poll chat while in the room.
  useEffect(() => {
    if (!joined) return;
    let stop = false;
    const tick = async () => {
      try {
        const r = await api.get<{ messages: Msg[]; status: string }>(`/events/${eventId}/messages?after=${encodeURIComponent(lastRef.current)}`);
        if (r.messages.length) {
          lastRef.current = r.messages[r.messages.length - 1].createdAt;
          setMsgs((m) => [...m, ...r.messages.filter((x) => !m.some((y) => y.id === x.id))]);
          requestAnimationFrame(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight }));
        }
        if (event && r.status !== event.status) refreshEvent();
      } catch {
        /* keep polling */
      }
      if (!stop) setTimeout(tick, 3000);
    };
    tick();
    return () => {
      stop = true;
    };
  }, [joined, eventId, event?.status]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    try {
      await api.post(`/events/${eventId}/messages`, { kind: tab, body: draft });
      setDraft('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Couldn’t send.');
    }
  };
  const hostAction = async (a: 'start' | 'end') => {
    try {
      await api.post(`/events/${eventId}/${a}`);
      refreshEvent();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Couldn’t update the event.');
    }
  };

  const isHost = joined?.role === 'host';
  const shown = msgs.filter((m) => m.kind === tab);

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-ink text-white">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-8 lg:px-12 py-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button onClick={onLeave} className="inline-flex items-center gap-2 text-[13px] text-white/70 hover:text-white"><ArrowLeft className="w-4 h-4" /> Leave room</button>
          <div className="flex items-center gap-2">
            {event?.status === 'live' ? (
              <span className="inline-flex items-center gap-2 h-8 px-3 rounded-full bg-lime text-ink text-[12px] font-medium"><Radio className="w-3.5 h-3.5" /> Live</span>
            ) : event ? (
              <span className="inline-flex items-center h-8 px-3 rounded-full bg-white/10 text-[12px] capitalize">{event.status === 'scheduled' ? 'Not started yet' : event.status}</span>
            ) : null}
            {event?.recording && <span className="inline-flex items-center h-8 px-3 rounded-full bg-rose-700 text-[12px]">● Recording</span>}
            {isHost && event?.status === 'scheduled' && <Button variant="lime" className="h-9" onClick={() => hostAction('start')}>Go live</Button>}
            {isHost && event?.status === 'live' && <Button variant="danger" className="h-9" onClick={() => hostAction('end')}>End event</Button>}
          </div>
        </div>
        <h1 className="mt-4 font-display text-[24px] sm:text-[30px] font-normal leading-tight">{event?.title ?? 'Loading…'}</h1>

        {error && <Notice tone="error" className="mt-4">{error}</Notice>}

        {needsConsent && (
          <div className="mt-8 max-w-lg rounded-3xl bg-white text-ink p-6">
            <p className="font-display text-[22px]">This event is recorded</p>
            <p className="mt-2 text-[13px] text-slate-600 leading-relaxed">
              The host is recording video and audio, and chat messages are kept with the event. The replay may be shown to {event?.replayAccess === 'members' ? 'all members' : 'people who registered'}. Your camera and microphone stay off unless the host invites you to speak.
            </p>
            <div className="mt-5 flex gap-2">
              <Button variant="lime" onClick={() => join(true)}>Agree and join</Button>
              <Button variant="outline" onClick={onLeave}>Not now</Button>
            </div>
          </div>
        )}

        {joined && (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-4">
            {/* Stage */}
            <div className="relative aspect-video rounded-3xl bg-[#1f2410] overflow-hidden flex items-center justify-center">
              <div className="text-center px-6">
                <div className="mx-auto w-20 h-20 rounded-full bg-lime text-ink flex items-center justify-center font-display text-[26px]">
                  {event?.host.name.replace(/^(Dr\.|Chief|Engr\.)\s+/i, '').split(' ').map((w) => w[0]).slice(0, 2).join('')}
                </div>
                <p className="mt-4 text-[15px] font-medium">{event?.host.name}</p>
                <p className="text-[12px] text-white/60">{event?.status === 'live' ? 'Presenting' : event?.status === 'ended' ? 'This event has ended' : 'Waiting for the host to go live'}</p>
                {joined.video.provider === 'dummy' && (
                  <p className="mt-6 text-[11px] text-white/40 max-w-sm mx-auto">Simulated stage. Live video connects here once the Agora account is set up.</p>
                )}
              </div>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                <span className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center" title={isHost ? 'Microphone' : 'Muted (audience)'}><Mic className="w-4 h-4 opacity-60" /></span>
                <span className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center" title={isHost ? 'Camera' : 'Camera off (audience)'}><Video className="w-4 h-4 opacity-60" /></span>
              </div>
            </div>

            {/* Chat & Q&A */}
            <div className="rounded-3xl bg-white text-ink flex flex-col h-[480px] lg:h-auto lg:max-h-[640px]">
              <div className="flex p-1.5 m-3 rounded-full bg-mist text-[13px]" role="tablist">
                {(['chat', 'question'] as const).map((t) => (
                  <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
                    className={`flex-1 h-9 rounded-full inline-flex items-center justify-center gap-1.5 ${tab === t ? 'bg-white shadow-sm' : 'text-slate-600'}`}>
                    {t === 'chat' ? <MessageSquare className="w-3.5 h-3.5" /> : <HelpCircle className="w-3.5 h-3.5" />}
                    {t === 'chat' ? 'Chat' : `Q&A (${msgs.filter((m) => m.kind === 'question' && !m.answered).length})`}
                  </button>
                ))}
              </div>
              <div ref={listRef} className="flex-1 overflow-y-auto px-4 space-y-3" aria-live="polite">
                {shown.length === 0 && <p className="text-[13px] text-slate-500 py-4">{tab === 'chat' ? 'No messages yet. Say hello.' : 'No questions yet. Ask the host anything.'}</p>}
                {shown.map((m) => (
                  <div key={m.id} className={`rounded-2xl px-3.5 py-2.5 ${m.fromHost ? 'bg-lime' : 'bg-mist'} ${m.answered ? 'opacity-60' : ''}`}>
                    <p className="text-[11px] text-slate-600">
                      <span className="font-medium text-ink">{m.user.name}</span>{m.fromHost ? ' · Host' : ''} · {timeAgo(m.createdAt)}
                      {m.answered && <span className="ml-1 inline-flex items-center gap-0.5"><Check className="w-3 h-3" /> answered</span>}
                    </p>
                    <p className="text-[13px] mt-0.5 break-words">{m.body}</p>
                    {isHost && m.kind === 'question' && !m.answered && (
                      <button onClick={() => api.post(`/events/${eventId}/messages/${m.id}/answer`).then(() => setMsgs((list) => list.map((x) => (x.id === m.id ? { ...x, answered: true } : x))))}
                        className="mt-1.5 text-[12px] underline underline-offset-4">Mark answered</button>
                    )}
                  </div>
                ))}
              </div>
              <form onSubmit={send} className="p-3 border-t border-stone-100 flex gap-2">
                <label htmlFor="room-msg" className="sr-only">{tab === 'chat' ? 'Message' : 'Question'}</label>
                <input id="room-msg" value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={500} disabled={event?.status !== 'live'}
                  placeholder={event?.status !== 'live' ? 'Chat opens when the event goes live' : tab === 'chat' ? 'Message everyone' : 'Ask the host a question'}
                  className="flex-1 min-w-0 h-11 px-4 rounded-full border border-stone-300 text-[13px] focus:outline-none focus:border-ink disabled:bg-stone-100" />
                <Button type="submit" disabled={event?.status !== 'live' || !draft.trim()}>Send</Button>
              </form>
            </div>
          </div>
        )}
        {!joined && !needsConsent && !error && <p className="mt-8 text-white/60 text-[13px]">Connecting…</p>}
        {!user && <Notice className="mt-6">Log in to join this event.</Notice>}
      </div>
    </div>
  );
};
