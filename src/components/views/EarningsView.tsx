import React, { useEffect, useState } from 'react';
import { Download, Landmark } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api, ApiError, Balances, LedgerEntry } from '../../lib/api';
import { Button, Kicker, naira, Notice, Pill, selectClass, inputClass, WRAP } from '../ui';

interface EarningsData {
  balances: Balances;
  entries: LedgerEntry[];
  payouts: { reference: string; amountNgn: number; status: string; failureReason: string; createdAt: string; paidAt: string | null }[];
  payoutAccount: { bankName: string; accountNumber: string; accountName: string; verifiedAt: string } | null;
  rules: { commissionPct: Record<string, number>; holdDays: Record<string, number>; minPayoutNgn: number; schedule: string };
}

const TYPE_LABELS: Record<string, string> = {
  sale: 'Sale', platform_fee: 'Platform commission', provider_fee: 'Provider fee', refund: 'Refund', payout: 'Payout',
  payout_reversal: 'Payout reversed', adjustment: 'Adjustment'
};
const days = (n: number) => (n === 0 ? 'straight' : `${n} day${n === 1 ? '' : 's'}`);
const SOURCE_LABELS: Record<string, string> = { consultation: 'Consultation', book_purchase: 'Book', event_ticket: 'Event ticket', payout: 'Payout', adjustment: 'Adjustment' };

export const EarningsView: React.FC<{ onNavigate: (v: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [d, setD] = useState<EarningsData | null>(null);
  const [error, setError] = useState('');
  const [banks, setBanks] = useState<{ code: string; name: string }[]>([]);
  const [bank, setBank] = useState('');
  const [acct, setAcct] = useState('');
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const load = () => api.get<EarningsData>('/me/earnings').then(setD).catch((e: ApiError) => setError(e.message));
  useEffect(() => {
    if (!user) return;
    load();
    api.get<{ banks: { code: string; name: string }[] }>('/banks').then((r) => setBanks(r.banks)).catch(() => {});
  }, [user?.id]);

  if (!user) return <div className={`${WRAP} py-20`}><Notice>Log in to see your earnings.</Notice></div>;

  const saveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await api.put('/me/payout-account', { bankCode: bank, accountNumber: acct });
      setMsg({ tone: 'success', text: 'Payout account confirmed with your bank. Payouts to a new account start after 24 hours.' });
      setEditing(false);
      setAcct('');
      load();
    } catch (err) {
      setMsg({ tone: 'error', text: err instanceof ApiError ? err.message : 'Couldn’t save.' });
    } finally {
      setBusy(false);
    }
  };

  const tiles: [string, number, string][] = d ? [
    ['Available', d.balances.availableNgn, 'Included in the next payout'],
    ['Pending', d.balances.pendingNgn, 'Becomes available after the hold period'],
    ['On hold', d.balances.heldNgn, 'Frozen while a dispute or refund is reviewed'],
    ['Paid out', d.balances.paidOutNgn, 'Sent to your bank so far']
  ] : [];

  return (
    <div className={`${WRAP} py-12 sm:py-16`}>
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <Kicker>Earnings</Kicker>
          <h1 className="mt-4 font-display text-[34px] sm:text-[48px] font-normal leading-[1.05] tracking-[-0.03em]">Earnings &amp; payouts</h1>
        </div>
        <a href="/api/me/statement" className="self-start inline-flex items-center gap-2 h-11 px-5 rounded-full border border-stone-300 hover:border-ink text-[13px] font-medium">
          <Download className="w-4 h-4" /> Download statement (CSV)
        </a>
      </div>
      {error && <Notice tone="error" className="mt-6">{error}</Notice>}
      {d && (
        <>
          <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3">
            {tiles.map(([l, v, hint], i) => (
              <div key={l} className={`rounded-2xl p-5 ${i === 0 ? 'bg-lime' : 'bg-mist'}`}>
                <p className="text-[12px] text-slate-700">{l}</p>
                <p className="mt-2 font-display text-[30px] leading-none font-mono-numbers">{naira(v)}</p>
                <p className="mt-2 text-[11px] text-slate-600">{hint}</p>
              </div>
            ))}
          </div>
          {d.balances.inPayoutNgn > 0 && <Notice className="mt-3">{naira(d.balances.inPayoutNgn)} is in a payout being processed.</Notice>}

          <div className="mt-10 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-10">
            <section>
              <h2 className="text-[15px] font-medium">Activity</h2>
              {d.entries.length === 0 ? <p className="mt-3 text-[13px] text-slate-500">No earnings yet. Sales from consultations, books and paid events appear here.</p> : (
                <div className="mt-3 overflow-x-auto rounded-2xl border border-stone-200 bg-white">
                  <table className="w-full min-w-[600px] text-[13px]">
                    <thead className="text-left text-[11px] text-slate-500 border-b border-stone-200">
                      <tr><th className="px-4 py-3 font-medium">Date</th><th className="px-4 py-3 font-medium">What</th><th className="px-4 py-3 font-medium text-right">Amount</th><th className="px-4 py-3 font-medium">Status</th></tr>
                    </thead>
                    <tbody>
                      {d.entries.map((e) => (
                        <tr key={e.id} className="border-b border-stone-100 last:border-0 align-top">
                          <td className="px-4 py-3 whitespace-nowrap text-slate-500">{new Date(e.createdAt).toLocaleDateString('en-NG')}</td>
                          <td className="px-4 py-3"><p>{TYPE_LABELS[e.type]}{e.sourceType !== e.type ? ` · ${SOURCE_LABELS[e.sourceType] ?? e.sourceType}` : ''}</p><p className="text-[12px] text-slate-500">{e.memo}</p></td>
                          <td className={`px-4 py-3 text-right font-mono-numbers whitespace-nowrap ${e.amountNgn < 0 ? 'text-slate-600' : ''}`}>{e.amountNgn > 0 ? '+' : '−'}{naira(Math.abs(e.amountNgn))}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{e.pending ? <Pill tone="warn">Available {new Date(e.availableAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}</Pill> : <Pill>Settled</Pill>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <h2 className="mt-10 text-[15px] font-medium">Payouts</h2>
              {d.payouts.length === 0 ? <p className="mt-3 text-[13px] text-slate-500">No payouts yet.</p> : (
                <ul className="mt-3 border-t border-stone-200">
                  {d.payouts.map((p) => (
                    <li key={p.reference} className="py-3 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 text-[13px]">
                      <span><span className="font-mono-numbers">{p.reference}</span><span className="block text-[12px] text-slate-500">{new Date(p.createdAt).toLocaleDateString('en-NG')}{p.failureReason ? ` · ${p.failureReason}` : ''}</span></span>
                      <span className="flex items-center gap-3"><span className="font-mono-numbers">{naira(p.amountNgn)}</span>
                        <Pill tone={p.status === 'paid' ? 'good' : p.status === 'failed' ? 'bad' : 'warn'}>{p.status}</Pill></span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <aside className="space-y-4">
              <div className="rounded-3xl border border-stone-200 bg-white p-6">
                <div className="flex items-center gap-2"><Landmark className="w-4 h-4" /><h2 className="text-[15px] font-medium">Payout account</h2></div>
                {d.payoutAccount && !editing ? (
                  <>
                    <p className="mt-3 text-[14px]">{d.payoutAccount.accountName}</p>
                    <p className="text-[13px] text-slate-500">{d.payoutAccount.bankName} · {d.payoutAccount.accountNumber}</p>
                    <Button variant="outline" className="mt-4 h-9" onClick={() => setEditing(true)}>Change account</Button>
                  </>
                ) : (
                  <form onSubmit={saveAccount} className="mt-3 space-y-2">
                    <label htmlFor="po-bank" className="sr-only">Bank</label>
                    <select id="po-bank" className={`${selectClass} w-full`} value={bank} onChange={(e) => setBank(e.target.value)} required>
                      <option value="">Choose your bank</option>
                      {banks.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}
                    </select>
                    <label htmlFor="po-acct" className="sr-only">Account number</label>
                    <input id="po-acct" inputMode="numeric" maxLength={10} className={inputClass} placeholder="10-digit account number" value={acct} onChange={(e) => setAcct(e.target.value.replace(/\D/g, ''))} required />
                    <p className="text-[11px] text-slate-500">We confirm the account name with your bank. The account must be in your name or your business’s name.</p>
                    <Button type="submit" busy={busy} className="w-full">Confirm account</Button>
                  </form>
                )}
                {msg && <Notice tone={msg.tone} className="mt-3">{msg.text}</Notice>}
              </div>
              <div className="rounded-3xl bg-mist p-6 text-[13px] leading-relaxed">
                <h2 className="text-[15px] font-medium">How payouts work</h2>
                <ul className="mt-3 space-y-2 text-slate-700">
                  <li>Platform commission: consultations {d.rules.commissionPct.consultation}%, event tickets {d.rules.commissionPct.event_ticket}%, books {d.rules.commissionPct.book_purchase}%. Kora’s card fees are covered by the platform.</li>
                  <li>Earnings become available {days(d.rules.holdDays.consultation)} after a consultation or event and {days(d.rules.holdDays.book_purchase)} after a book sale, to allow for refunds and disputes.</li>
                  <li>{d.rules.schedule}, when your available balance is at least {naira(d.rules.minPayoutNgn)}.</li>
                </ul>
                <p className="mt-3 text-[11px] text-slate-500">Balances are a record of what you’ve earned, not a bank deposit. Payout dates can move if a bank or Kora delays settlement.</p>
              </div>
              <Button variant="ghost" className="w-full" onClick={() => onNavigate('support')}>Question about a payment? Contact support</Button>
            </aside>
          </div>
        </>
      )}
    </div>
  );
};
