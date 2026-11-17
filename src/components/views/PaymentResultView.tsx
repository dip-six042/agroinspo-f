import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api, ApiError, PaymentInfo } from '../../lib/api';
import { Button, naira, Notice } from '../ui';

/** Shown when Kora sends the customer back (?payment=<reference>). */
export const PaymentResultView: React.FC<{ reference: string; onNavigate: (v: string) => void }> = ({ reference, onNavigate }) => {
  const { user, loading } = useAuth();
  const [payment, setPayment] = useState<PaymentInfo | null>(null);
  const [returnPath, setReturnPath] = useState('');
  const [error, setError] = useState('');
  const [tries, setTries] = useState(0);

  useEffect(() => {
    if (!user) return;
    let stop = false;
    const check = async (n: number) => {
      try {
        const r = await api.get<{ payment: PaymentInfo; returnPath: string }>(`/payments/${encodeURIComponent(reference)}`);
        if (stop) return;
        setPayment(r.payment);
        setReturnPath(r.returnPath);
        setTries(n);
        // The webhook can arrive a few seconds after the redirect; keep checking briefly.
        if ((r.payment.status === 'pending' || r.payment.status === 'initiated') && n < 10) setTimeout(() => check(n + 1), 2000);
      } catch (e) {
        if (!stop) setError(e instanceof ApiError ? e.message : 'Couldn’t check the payment.');
      }
    };
    check(0);
    return () => {
      stop = true;
    };
  }, [user?.id, reference]);

  if (!loading && !user)
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="font-display text-[28px]">Log in to see your payment.</p>
        <Button variant="lime" className="mt-6" onClick={() => onNavigate('auth:login')}>Log in</Button>
      </div>
    );

  const s = payment?.status;
  const ok = s === 'successful';
  const failed = s === 'failed';
  const waiting = !payment || s === 'pending' || s === 'initiated';
  const next = returnPath || (payment?.purpose === 'job_listing' ? 'jobs:mine' : 'events:mine');

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-8 py-16 sm:py-24">
      <div className="rounded-3xl border border-stone-200 bg-white p-8 text-center">
        <div className="flex justify-center">
          {ok ? <CheckCircle2 className="w-12 h-12 text-emerald-600" /> : failed ? <XCircle className="w-12 h-12 text-rose-700" /> : <Loader2 className="w-12 h-12 animate-spin text-slate-400" />}
        </div>
        <h1 className="mt-5 font-display text-[30px] font-normal leading-tight">
          {ok ? 'Payment received' : failed ? 'Payment didn’t go through' : s === 'under_review' ? 'We’re checking this payment' : 'Confirming your payment…'}
        </h1>
        {payment && (
          <dl className="mt-6 text-left text-[13px] divide-y divide-stone-100 border-y border-stone-100">
            <div className="flex justify-between gap-4 py-2.5"><dt className="text-slate-500">For</dt><dd className="text-right">{payment.description}</dd></div>
            <div className="flex justify-between gap-4 py-2.5"><dt className="text-slate-500">Amount</dt><dd className="font-mono-numbers">{naira(payment.amountNgn)}</dd></div>
            <div className="flex justify-between gap-4 py-2.5"><dt className="text-slate-500">Reference</dt><dd className="font-mono-numbers break-all">{payment.reference}</dd></div>
            {payment.paidAt && <div className="flex justify-between gap-4 py-2.5"><dt className="text-slate-500">Paid</dt><dd>{new Date(payment.paidAt).toLocaleString('en-NG')}</dd></div>}
          </dl>
        )}
        <p className="mt-5 text-[13px] text-slate-500 leading-relaxed">
          {ok && payment?.purpose === 'job_listing' && 'Your listing is now in review. We’ll notify you when it’s live.'}
          {ok && payment?.purpose === 'event_ticket' && 'Your ticket is confirmed. We’ll remind you a day and an hour before.'}
          {ok && payment?.purpose === 'consultation' && 'Your consultation is booked. We’ll remind you an hour before, and the call room opens 10 minutes before the start.'}
          {ok && payment?.purpose === 'book_purchase' && 'The book is in your library, ready to download.'}
          {ok && payment?.purpose === 'advert' && 'Your advert is with our reviewers, usually for less than one working day. If we don’t approve it, you’re refunded in full.'}
          {ok && payment?.purpose === 'sponsorship' && 'Your sponsorship is confirmed. The host will record each deliverable as it’s done.'}
          {failed && 'No money was taken. You can try again.'}
          {s === 'under_review' && 'Something didn’t match, so our team will check it and contact you. Keep your reference.'}
          {waiting && tries >= 10 && 'This is taking longer than usual. You’ll get a notification as soon as Kora confirms it.'}
        </p>
        {payment?.provider === 'kora-dummy' && <Notice className="mt-4 text-left">Test mode: this was a simulated Kora payment. No money moved.</Notice>}
        {error && <Notice tone="error" className="mt-4 text-left">{error}</Notice>}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button variant="lime" onClick={() => onNavigate(next)}>{failed ? 'Go back and try again' : 'Continue'}</Button>
        </div>
      </div>
    </div>
  );
};
