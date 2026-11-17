import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api, ApiError, timeAgo } from '../../lib/api';
import { Avatar, Button, Notice, WRAP } from '../ui';

interface Conv { id: string; lastAt: string; lastBody: string; unread: number; other: { id: string; name: string; title: string; avatarUrl: string } }
interface Msg { id: string; body: string; mine: boolean; createdAt: string; read: boolean; sentBy?: string }

const Thread: React.FC<{ id: string; onBack: () => void; onSent: () => void }> = ({ id, onBack, onSent }) => {
  const [other, setOther] = useState<Conv['other'] | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const last = useRef('');
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMsgs([]);
    last.current = '';
    let alive = true;
    const poll = async () => {
      try {
        const r = await api.get<{ other: Conv['other']; blocked: boolean; messages: Msg[] }>(`/conversations/${id}/messages?after=${encodeURIComponent(last.current)}`);
        if (!alive) return;
        setOther(r.other);
        setBlocked(r.blocked);
        if (r.messages.length) {
          last.current = r.messages[r.messages.length - 1].createdAt;
          setMsgs((m) => [...m, ...r.messages.filter((x) => !m.some((y) => y.id === x.id))]);
        }
      } catch (e) {
        if (alive) setError(e instanceof ApiError ? e.message : 'Couldn’t load messages.');
      }
    };
    poll();
    const t = setInterval(poll, 5000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [id]);
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' });
  }, [msgs.length]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    setError('');
    try {
      const r = await api.post<{ id: string; createdAt: string }>(`/conversations/${id}/messages`, { body: text });
      setMsgs((m) => [...m, { id: r.id, body: text, mine: true, createdAt: r.createdAt, read: false }]);
      last.current = r.createdAt;
      setText('');
      onSent();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Couldn’t send.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="flex flex-col h-[70vh] rounded-3xl border border-stone-200 bg-white overflow-hidden">
      <header className="flex items-center gap-3 px-5 py-4 border-b border-stone-200">
        <button onClick={onBack} className="md:hidden p-1 -ml-1" aria-label="Back to conversations"><ArrowLeft className="w-5 h-5" /></button>
        {other && <><Avatar name={other.name} src={other.avatarUrl} size={36} /><div><p className="text-[14px] font-medium">{other.name}</p><p className="text-[12px] text-slate-500">{other.title}</p></div></>}
      </header>
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2" aria-live="polite">
        {msgs.length === 0 && <p className="text-[13px] text-slate-500 text-center mt-8">Say hello. Keep payments on Agro Inspo: we can only help with problems if you book and pay here.</p>}
        {msgs.map((m) => (
          <div key={m.id} className={`flex ${m.mine ? 'justify-end' : ''}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-[14px] whitespace-pre-wrap ${m.mine ? 'bg-ink text-white' : 'bg-mist'}`}>
              {m.body}
              <span className={`block mt-1 text-[10px] ${m.mine ? 'text-white/60' : 'text-slate-500'}`}>{m.sentBy ? `${m.sentBy} · ` : ''}{timeAgo(m.createdAt)}{m.mine && m.read ? ' · Seen' : ''}</span>
            </div>
          </div>
        ))}
        <div ref={end} />
      </div>
      {error && <Notice tone="error" className="mx-5 mb-2">{error}</Notice>}
      {blocked ? <p className="px-5 py-4 border-t border-stone-200 text-[13px] text-slate-500">You can’t message this member.</p> : (
        <form onSubmit={send} className="flex gap-2 px-4 py-3 border-t border-stone-200">
          <label htmlFor="msg-input" className="sr-only">Message</label>
          <input id="msg-input" className="flex-1 h-11 px-4 rounded-full border border-stone-300 text-[14px] focus:outline-none focus:border-ink" placeholder="Write a message" value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} />
          <Button type="submit" busy={busy} aria-label="Send"><Send className="w-4 h-4" /></Button>
        </form>
      )}
    </section>
  );
};

export const MessagesView: React.FC<{ id?: string; onNavigate: (v: string) => void }> = ({ id, onNavigate }) => {
  const { user } = useAuth();
  const [convs, setConvs] = useState<Conv[] | null>(null);
  const load = () => api.get<{ conversations: Conv[] }>('/conversations').then((r) => setConvs(r.conversations)).catch(() => setConvs([]));
  useEffect(() => {
    if (!user) return;
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [user?.id, id]);
  if (!user) return <div className={`${WRAP} py-20`}><Notice>Log in to see your messages.</Notice></div>;

  return (
    <div className={`${WRAP} py-10`}>
      <h1 className="font-display text-[34px] font-normal tracking-[-0.03em]">Messages</h1>
      <div className="mt-6 grid md:grid-cols-[320px_minmax(0,1fr)] gap-5">
        <ul className={`${id ? 'hidden md:block' : ''} rounded-3xl border border-stone-200 bg-white overflow-hidden self-start`}>
          {convs?.length === 0 && <li className="p-5 text-[13px] text-slate-500">No conversations yet. Message a specialist from their profile or a booking.</li>}
          {convs?.map((c) => (
            <li key={c.id}>
              <button onClick={() => onNavigate(`messages:${c.id}`)} className={`w-full text-left flex gap-3 px-4 py-3 border-b border-stone-100 hover:bg-mist ${c.id === id ? 'bg-mist' : ''}`}>
                <Avatar name={c.other.name} src={c.other.avatarUrl} size={36} />
                <span className="min-w-0 flex-1">
                  <span className="flex justify-between gap-2"><span className="text-[14px] font-medium truncate">{c.other.name}</span><span className="text-[11px] text-slate-500 shrink-0">{timeAgo(c.lastAt)}</span></span>
                  <span className={`block text-[12px] truncate ${c.unread ? 'text-ink font-medium' : 'text-slate-500'}`}>{c.lastBody}</span>
                </span>
                {c.unread > 0 && <span className="self-center min-w-5 h-5 px-1.5 rounded-full bg-lime text-[11px] font-medium flex items-center justify-center">{c.unread}</span>}
              </button>
            </li>
          ))}
        </ul>
        {id ? <Thread id={id} onBack={() => onNavigate('messages')} onSent={load} /> : <div className="hidden md:flex rounded-3xl bg-mist items-center justify-center text-[13px] text-slate-500 h-[70vh]">Choose a conversation</div>}
      </div>
    </div>
  );
};
