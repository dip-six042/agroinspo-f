import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api, ApiError, Ticket, timeAgo } from '../../lib/api';
import { Button, Field, inputClass, Kicker, Modal, Notice, Pill, selectClass, textareaClass, WRAP } from '../ui';

export const TICKET_CATEGORY_LABELS: Record<string, string> = {
  dispute: 'Problem with a consultation', refund: 'Refund request', payment: 'Payment or payout', account: 'My account', technical: 'Something isn’t working', other: 'Other'
};
export const TICKET_STATUS: Record<string, [string, 'warn' | 'neutral' | 'good']> = {
  open: ['Waiting for support', 'warn'], waiting_on_user: ['Support replied', 'neutral'], resolved: ['Resolved', 'good']
};

export const TicketThread: React.FC<{ id: string; staff?: boolean; onChanged?: () => void }> = ({ id, staff, onChanged }) => {
  const [t, setT] = useState<Ticket | null>(null);
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const load = () => api.get<{ ticket: Ticket }>(`/support/${id}`).then((r) => setT(r.ticket)).catch((e: ApiError) => setError(e.message));
  useEffect(() => {
    load();
  }, [id]);
  const send = async () => {
    setBusy(true);
    setError('');
    try {
      await api.post(`/support/${id}/messages`, { body: reply });
      setReply('');
      await load();
      onChanged?.();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Couldn’t send.');
    } finally {
      setBusy(false);
    }
  };
  if (!t) return error ? <Notice tone="error">{error}</Notice> : <p className="text-[13px] text-slate-500">Loading…</p>;
  return (
    <div>
      <div className="flex flex-wrap gap-2"><Pill tone={TICKET_STATUS[t.status][1]}>{TICKET_STATUS[t.status][0]}</Pill><Pill>{TICKET_CATEGORY_LABELS[t.category]}</Pill>{t.subjectType && <Pill>{t.subjectType.replace('_', ' ')}</Pill>}</div>
      <ul className="mt-4 space-y-3">
        {t.messages?.map((m) => (
          <li key={m.id} className={`rounded-2xl p-4 text-[13px] ${m.fromStaff ? 'bg-lime/40' : 'bg-mist'}`}>
            <p className="text-[11px] text-slate-600">{m.name} · {timeAgo(m.createdAt)}</p>
            <p className="mt-1 whitespace-pre-wrap leading-relaxed">{m.body}</p>
          </li>
        ))}
      </ul>
      {(t.status !== 'resolved' || staff) && (
        <div className="mt-4">
          <label htmlFor="tk-reply" className="sr-only">Reply</label>
          <textarea id="tk-reply" rows={3} className={textareaClass} placeholder={staff ? 'Reply to the member' : 'Add a reply'} value={reply} onChange={(e) => setReply(e.target.value)} />
          <Button className="mt-2" busy={busy} disabled={!reply.trim()} onClick={send}>Send reply</Button>
        </div>
      )}
      {error && <Notice tone="error" className="mt-3">{error}</Notice>}
    </div>
  );
};

export const SupportView: React.FC<{ id?: string; onNavigate: (v: string) => void }> = ({ id, onNavigate }) => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [f, setF] = useState({ category: 'payment', title: '', message: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const load = () => api.get<{ tickets: Ticket[] }>('/me/support').then((r) => setTickets(r.tickets)).catch(() => setTickets([]));
  useEffect(() => {
    if (user) load();
  }, [user?.id]);
  if (!user) return <div className={`${WRAP} py-20`}><Notice>Log in to contact support.</Notice></div>;

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const r = await api.post<{ ticket: { id: string } }>('/support', f);
      setCreating(false);
      setF({ category: 'payment', title: '', message: '' });
      load();
      onNavigate(`support:${r.ticket.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Couldn’t send.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`${WRAP} py-12 sm:py-16`}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Kicker>Help &amp; support</Kicker>
          <h1 className="mt-4 font-display text-[34px] sm:text-[48px] font-normal leading-[1.05] tracking-[-0.03em]">How can we help?</h1>
        </div>
        <Button variant="lime" onClick={() => setCreating(true)}>New request</Button>
      </div>
      <Notice className="mt-6">To dispute a consultation, open it from Consultations and choose “Report a problem”. To ask for a book refund, open the book in your library. That links the request to the payment so we can act on it.</Notice>
      <ul className="mt-8 border-t border-stone-200">
        {tickets?.length === 0 && <li className="py-6 text-[13px] text-slate-500">No requests yet.</li>}
        {tickets?.map((t) => (
          <li key={t.id}>
            <button onClick={() => onNavigate(`support:${t.id}`)} className="w-full text-left py-4 border-b border-stone-200 flex flex-wrap justify-between gap-3 hover:bg-mist px-2 -mx-2 rounded-lg">
              <span><span className="text-[14px] font-medium">{t.title}</span><span className="block text-[12px] text-slate-500">{TICKET_CATEGORY_LABELS[t.category]} · updated {timeAgo(t.updatedAt)}</span></span>
              <Pill tone={TICKET_STATUS[t.status][1]}>{TICKET_STATUS[t.status][0]}</Pill>
            </button>
          </li>
        ))}
      </ul>
      {id && (
        <Modal title={tickets?.find((t) => t.id === id)?.title ?? 'Support request'} onClose={() => onNavigate('support')} wide>
          <TicketThread id={id} onChanged={load} />
        </Modal>
      )}
      {creating && (
        <Modal title="New support request" onClose={() => setCreating(false)}>
          <form onSubmit={create} className="space-y-4">
            <Field id="tk-cat" label="What’s it about?">
              <select id="tk-cat" className={`${selectClass} w-full`} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
                {['payment', 'account', 'technical', 'other'].map((k) => <option key={k} value={k}>{TICKET_CATEGORY_LABELS[k]}</option>)}
              </select>
            </Field>
            <Field id="tk-title" label="Subject"><input id="tk-title" className={inputClass} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} required minLength={5} /></Field>
            <Field id="tk-msg" label="Details" hint="Include payment references or dates if you have them."><textarea id="tk-msg" rows={5} className={textareaClass} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} required minLength={20} /></Field>
            {error && <Notice tone="error">{error}</Notice>}
            <Button type="submit" busy={busy}>Send</Button>
          </form>
        </Modal>
      )}
    </div>
  );
};
