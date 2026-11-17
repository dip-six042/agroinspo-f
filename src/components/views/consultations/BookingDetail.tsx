import React, { useEffect, useState } from 'react';
import { Star, Video, Phone, MessageCircle } from 'lucide-react';
import { api, ApiError, Booking, BOOKING_STATUS_LABELS, Slot, startConversation } from '../../../lib/api';
import { Button, Modal, naira, Notice, Pill, textareaClass } from '../../ui';

export const bookingTone = (s: string) =>
  (({ confirmed: 'good', in_progress: 'lime', completed: 'neutral', disputed: 'warn', payment_pending: 'warn', cancelled: 'neutral', refunded: 'neutral', no_show: 'bad' } as const)[s as 'confirmed'] ?? 'neutral');

export const fmtWhen = (iso: string) => new Date(iso).toLocaleString('en-NG', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

export const BookingDetail: React.FC<{ id: string; onClose: () => void; onChanged: () => void; onNavigate: (v: string) => void }> = ({ id, onClose, onChanged, onNavigate }) => {
  const [b, setB] = useState<Booking | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [panel, setPanel] = useState<'' | 'cancel' | 'reschedule' | 'review' | 'dispute'>('');
  const [reason, setReason] = useState('');
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotId, setSlotId] = useState('');
  const [rating, setRating] = useState(5);
  const [notes, setNotes] = useState('');
  const [msg, setMsg] = useState('');

  const load = () => api.get<{ booking: Booking }>(`/bookings/${id}`).then((r) => (setB(r.booking), setNotes(r.booking.notes))).catch((e: ApiError) => setError(e.message));
  useEffect(() => {
    load();
  }, [id]);

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    setError('');
    try {
      await fn();
      setMsg(ok);
      setPanel('');
      await load();
      onChanged();
    } catch (e) {
      if (e instanceof ApiError && e.code === 'no_refund') setNeedsConfirm(true);
      setError(e instanceof ApiError ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  if (!b) return <Modal title="Consultation" onClose={onClose}>{error ? <Notice tone="error">{error}</Notice> : <p className="text-[13px] text-slate-500">Loading…</p>}</Modal>;
  const spec = b.role === 'specialist';
  const other = spec ? b.client : b.specialist;
  const upcoming = ['confirmed', 'payment_pending'].includes(b.status) && new Date(b.startsAt) > new Date();

  return (
    <Modal title={b.serviceTitle} onClose={onClose} wide>
      <div className="flex flex-wrap items-center gap-2">
        <Pill tone={bookingTone(b.status)}>{BOOKING_STATUS_LABELS[b.status]}</Pill>
        <Pill>{b.mode === 'video' ? <Video className="w-3 h-3" /> : <Phone className="w-3 h-3" />}{b.mode === 'video' ? 'Video' : 'Audio'} · {b.durationMin} min</Pill>
        {b.rescheduled && <Pill tone="warn">Moved by specialist</Pill>}
      </div>
      <dl className="mt-5 grid sm:grid-cols-3 gap-3 text-[13px]">
        <div className="rounded-2xl bg-mist p-4"><dt className="text-slate-500 text-[11px]">When</dt><dd className="mt-1 font-medium">{fmtWhen(b.startsAt)}</dd></div>
        <div className="rounded-2xl bg-mist p-4"><dt className="text-slate-500 text-[11px]">{spec ? 'Client' : 'Specialist'}</dt><dd className="mt-1 font-medium">{other.name}</dd><dd className="text-[11px] text-slate-500">{other.title}</dd></div>
        <div className="rounded-2xl bg-mist p-4"><dt className="text-slate-500 text-[11px]">{spec ? 'You receive' : 'Paid'}</dt>
          <dd className="mt-1 font-medium font-mono-numbers">{naira(spec ? b.netNgn ?? 0 : b.priceNgn)}</dd>
          {spec && <dd className="text-[11px] text-slate-500 font-mono-numbers">{naira(b.priceNgn)} less {naira(b.commissionNgn ?? 0)} commission</dd>}
          {b.payment?.refundedNgn ? <dd className="text-[11px] text-slate-500">Refunded {naira(b.payment.refundedNgn)}</dd> : null}
        </div>
      </dl>
      <p className="mt-5 text-[12px] text-slate-500">What the client needs</p>
      <p className="mt-1 text-[14px] leading-relaxed whitespace-pre-wrap">{b.objective}</p>
      {b.cancelReason && <Notice className="mt-4">{b.cancelledBy ? `Cancelled by ${b.cancelledBy}` : 'Note'}: {b.cancelReason}</Notice>}

      {(spec || b.notes) && (
        <div className="mt-5">
          <label htmlFor="bk-notes" className="text-[13px] font-medium">Session notes {spec ? '(shared with the client)' : 'from your specialist'}</label>
          {spec ? (
            <>
              <textarea id="bk-notes" rows={4} className={`${textareaClass} mt-1.5`} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Diagnosis, recommendations, products and rates, follow-up" />
              <Button className="mt-2 h-9" variant="outline" busy={busy} onClick={() => run(() => api.patch(`/bookings/${b.id}/notes`, { notes }), 'Notes saved.')}>Save notes</Button>
            </>
          ) : <p id="bk-notes" className="mt-1.5 rounded-2xl bg-mist p-4 text-[13px] whitespace-pre-wrap">{b.notes}</p>}
        </div>
      )}

      {msg && <Notice tone="success" className="mt-4">{msg}</Notice>}
      {error && <Notice tone="error" className="mt-4">{error}</Notice>}

      <div className="mt-6 flex flex-wrap gap-2">
        {b.canJoin && <Button variant="lime" onClick={() => onNavigate(`consultations:call:${b.id}`)}><Video className="w-4 h-4" /> Join the call</Button>}
        <Button variant="outline" onClick={async () => onNavigate(`messages:${await startConversation(other.id)}`)}><MessageCircle className="w-4 h-4" /> Message</Button>
        {upcoming && <Button variant="ghost" onClick={() => setPanel('cancel')}>{spec ? 'Decline / cancel' : 'Cancel booking'}</Button>}
        {spec && b.status === 'confirmed' && upcoming && <Button variant="ghost" onClick={() => (setPanel('reschedule'), api.get<any>('/me/specialist').then((r) => setSlots(r.slots.filter((s: Slot) => s.status === 'open'))))}>Move to another time</Button>}
        {spec && ['confirmed', 'in_progress'].includes(b.status) && new Date(b.startsAt) <= new Date() && (
          <>
            <Button variant="ink" busy={busy} onClick={() => run(() => api.post(`/bookings/${b.id}/complete`, {}), 'Marked complete. The client has been asked for a review.')}>Mark complete</Button>
            <Button variant="ghost" busy={busy} onClick={() => run(() => api.post(`/bookings/${b.id}/complete`, { clientNoShow: true }), 'Recorded as a missed session.')}>Client didn’t join</Button>
          </>
        )}
        {b.canReview && <Button variant="lime" onClick={() => setPanel('review')}><Star className="w-4 h-4" /> Rate this session</Button>}
        {b.canDispute && <Button variant="ghost" onClick={() => setPanel('dispute')}>Report a problem</Button>}
      </div>

      {panel === 'cancel' && (
        <div className="mt-5 rounded-2xl border border-stone-200 p-5">
          <p className="text-[13px]">
            {spec ? 'The client is refunded in full and told why.' : b.freeCancel ? 'You’ll be refunded in full.' : 'This is less than 24 hours before the session, so the fee isn’t refunded.'}
          </p>
          <label htmlFor="bk-reason" className="sr-only">Reason</label>
          <input id="bk-reason" className="mt-3 w-full h-11 px-4 rounded-full border border-stone-300 text-[13px]" placeholder={spec ? 'Reason (sent to the client)' : 'Reason (optional)'} value={reason} onChange={(e) => setReason(e.target.value)} />
          <Button className="mt-3" variant="danger" busy={busy}
            onClick={() => run(() => api.post(`/bookings/${b.id}/cancel`, { reason, acceptNoRefund: needsConfirm || !b.freeCancel }), spec ? 'Cancelled. The client has been refunded.' : 'Booking cancelled.')}>
            {spec ? 'Cancel and refund client' : b.freeCancel ? 'Cancel and get a refund' : 'Cancel without refund'}
          </Button>
        </div>
      )}
      {panel === 'reschedule' && (
        <div className="mt-5 rounded-2xl border border-stone-200 p-5">
          <p className="text-[13px]">Pick one of your open slots. The client can still cancel for a full refund if the new time doesn’t suit them.</p>
          <div className="mt-3 flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
            {slots.filter((s) => s.durationMin >= b.durationMin).map((s) => (
              <button key={s.id} onClick={() => setSlotId(s.id)} aria-pressed={slotId === s.id} className={`h-9 px-3 rounded-full border text-[12px] ${slotId === s.id ? 'bg-lime border-lime' : 'border-stone-300'}`}>{fmtWhen(s.startsAt)}</button>
            ))}
            {slots.length === 0 && <p className="text-[12px] text-slate-500">Add open slots first under Services & availability.</p>}
          </div>
          <input aria-label="Reason" className="mt-3 w-full h-11 px-4 rounded-full border border-stone-300 text-[13px]" placeholder="Reason (sent to the client)" value={reason} onChange={(e) => setReason(e.target.value)} />
          <Button className="mt-3" busy={busy} disabled={!slotId || reason.trim().length < 5} onClick={() => run(() => api.post(`/bookings/${b.id}/reschedule`, { slotId, reason }), 'Moved. The client has been told.')}>Move booking</Button>
        </div>
      )}
      {panel === 'review' && (
        <div className="mt-5 rounded-2xl border border-stone-200 p-5">
          <div className="flex gap-1" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? 's' : ''}`} onClick={() => setRating(n)} className="p-1">
                <Star className={`w-6 h-6 ${n <= rating ? 'fill-ink' : 'text-slate-300'}`} />
              </button>
            ))}
          </div>
          <textarea aria-label="Comment" rows={3} className={`${textareaClass} mt-3`} placeholder="What helped? Other farmers read this." value={reason} onChange={(e) => setReason(e.target.value)} />
          <Button className="mt-3" variant="lime" busy={busy} onClick={() => run(() => api.post(`/bookings/${b.id}/review`, { rating, comment: reason }), 'Thanks for your review.')}>Post review</Button>
        </div>
      )}
      {panel === 'dispute' && (
        <div className="mt-5 rounded-2xl border border-stone-200 p-5">
          <p className="text-[13px]">Tell support what went wrong. The specialist’s payment for this session is held until we resolve it.</p>
          <textarea aria-label="What went wrong" rows={4} className={`${textareaClass} mt-3`} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="At least 20 characters" />
          <Button className="mt-3" busy={busy} onClick={() => run(() => api.post('/support', { category: 'dispute', subjectType: 'booking', subjectId: b.id, title: `Problem with ${b.serviceTitle}`, message: reason }), 'Dispute opened. Support will reply in Help & support.')}>Open dispute</Button>
        </div>
      )}
    </Modal>
  );
};
