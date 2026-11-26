// Live admin tools for Phase 3: finance & payouts, support/disputes, books, specialist credentials, creator applications.
import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api, ApiError, Book, SpecialistSummary, Ticket, TOPIC_LABELS, timeAgo } from '../../lib/api';
import { Button, inputClass, naira, Notice, Pill, textareaClass } from '../ui';
import { TicketThread, TICKET_CATEGORY_LABELS } from '../views/SupportView';

const useLoad = <T,>(url: string, deps: unknown[] = []) => {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const load = () => api.get<T>(url).then(setData).catch((e: ApiError) => setError(e.message));
  useEffect(() => {
    setData(null);
    load();
  }, [url, ...deps]);
  return { data, error, load };
};

const StatusFilter: React.FC<{ value: string; options: [string, string][]; onChange: (v: string) => void }> = ({ value, options, onChange }) => (
  <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter">
    {options.map(([v, l]) => (
      <button key={v} onClick={() => onChange(v)} aria-pressed={value === v} className={`h-8 px-3 rounded-full text-[12px] border ${value === v ? 'bg-ink text-white border-ink' : 'border-stone-300 hover:border-ink'}`}>{l}</button>
    ))}
  </div>
);

/* ---------- finance ---------- */
interface Batch {
  id: string; status: string; totalNgn: number; createdAt: string; approvedAt: string | null; createdBy: string; approvedBy: string | null;
  payouts: { id: string; reference: string; user: { name: string }; amountNgn: number; status: string; account: { bank: string; last4: string; name: string }; failureReason: string }[];
}
export const AdminFinance: React.FC = () => {
  const { user } = useAuth();
  const fin = useLoad<any>('/admin/finance');
  const batches = useLoad<{ batches: Batch[]; minPayoutNgn: number }>('/admin/payout-batches');
  const [msg, setMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState('');
  const [adj, setAdj] = useState({ email: '', amountNgn: '', reason: '' });

  const act = async (key: string, fn: () => Promise<any>, ok: (r: any) => string) => {
    setBusy(key);
    setMsg(null);
    try {
      const r = await fn();
      setMsg({ tone: 'success', text: ok(r) });
      batches.load();
      fin.load();
    } catch (e) {
      setMsg({ tone: 'error', text: e instanceof ApiError ? e.message : 'Something went wrong.' });
    } finally {
      setBusy('');
    }
  };
  const adjust = async (e: React.FormEvent) => {
    e.preventDefault();
    await act('adj', async () => {
      const u = await api.get<{ users: { id: string; email: string }[] }>(`/admin/users?q=${encodeURIComponent(adj.email)}`);
      const match = u.users.find((x) => x.email.toLowerCase() === adj.email.trim().toLowerCase());
      if (!match) throw new ApiError(404, 'not_found', 'No member with that email.');
      await api.post('/admin/adjustments', { userId: match.id, amountNgn: Number(adj.amountNgn), reason: adj.reason });
      setAdj({ email: '', amountNgn: '', reason: '' });
    }, () => 'Adjustment recorded as a new ledger entry.');
  };

  const f = fin.data;
  return (
    <div className="space-y-8">
      {f && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {([['Collected', f.collectedNgn], ['Refunded', f.refundedNgn], ['Kora fees', f.providerFeesNgn], ['Platform revenue', f.platformRevenueNgn], ['Owed to sellers', f.owedToSellersNgn]] as [string, number][]).map(([l, v]) => (
            <div key={l} className="rounded-2xl bg-mist p-4"><p className="font-display text-[22px] font-mono-numbers">{naira(v)}</p><p className="text-[12px] text-slate-600 mt-1">{l}</p></div>
          ))}
        </div>
      )}
      {f?.paymentsUnderReview > 0 && <Notice tone="error">{f.paymentsUnderReview} payment(s) are under review because the amount didn’t match. Check them in Payments.</Notice>}
      {f && (
        <Notice>
          Current rules (placeholders until the owner confirms): commission {Object.entries(f.rules.commissionPct).map(([k, v]) => `${k.replace('_', ' ')} ${v}%`).join(', ')};
          hold {f.rules.holdDays.consultation} day(s) for consultations and events, {f.rules.holdDays.book_purchase} for books; minimum payout {naira(f.rules.minPayoutNgn)}.
          Set them in the server’s environment. {f.rules.selfApproval ? 'You can prepare and approve payout batches yourself.' : 'A second admin must approve each payout batch.'}
        </Notice>
      )}

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-[15px] font-medium">Payout batches</h3>
          <Button busy={busy === 'create'} onClick={() => act('create', () => api.post<any>('/admin/payout-batches'), (r) =>
            `Draft batch prepared: ${r.batch.payouts.length} payout(s), ${naira(r.batch.totalNgn)}.${r.skipped.length ? ` Skipped: ${r.skipped.map((s: any) => `${s.name} (${s.reason})`).join('; ')}.` : ''} Ask another admin to approve it.`)}>Prepare this week’s batch</Button>
        </div>
        {msg && <Notice tone={msg.tone} className="mt-3">{msg.text}</Notice>}
        <ul className="mt-4 space-y-3">
          {batches.data?.batches.length === 0 && <li className="text-[13px] text-slate-500">No batches yet. Members with at least {naira(batches.data.minPayoutNgn)} available and a payout account are included.</li>}
          {batches.data?.batches.map((b) => (
            <li key={b.id} className="rounded-2xl border border-stone-200 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[14px] font-medium">{naira(b.totalNgn)} · {b.payouts.length} payout(s)</p>
                  <p className="text-[12px] text-slate-500">Prepared by {b.createdBy} {timeAgo(b.createdAt)}{b.approvedBy ? ` · approved by ${b.approvedBy}` : ''}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Pill tone={b.status === 'completed' ? 'good' : b.status === 'cancelled' ? 'neutral' : 'warn'}>{b.status}</Pill>
                  <a href={`/api/admin/payout-batches/${b.id}/report`} className="inline-flex items-center gap-1 h-9 px-3 rounded-full border border-stone-300 text-[12px] hover:border-ink"><Download className="w-3.5 h-3.5" /> Report</a>
                  {b.status === 'draft' && (
                    <>
                      <Button variant="ghost" className="h-9" busy={busy === `c${b.id}`} onClick={() => act(`c${b.id}`, () => api.post(`/admin/payout-batches/${b.id}/cancel`), () => 'Batch cancelled.')}>Cancel</Button>
                      <Button variant="lime" className="h-9" busy={busy === `a${b.id}`}
                        title={b.createdBy === user?.name && !f?.rules.selfApproval ? 'A different admin must approve' : undefined}
                        onClick={() => act(`a${b.id}`, () => api.post<any>(`/admin/payout-batches/${b.id}/approve`), (r) => `Approved. ${r.results.paid} paid, ${r.results.failed} failed.`)}>Approve &amp; send</Button>
                    </>
                  )}
                </div>
              </div>
              {b.payouts.length > 0 && (
                <ul className="mt-3 text-[12px] divide-y divide-stone-100">
                  {b.payouts.map((p) => (
                    <li key={p.id} className="py-2 flex flex-wrap justify-between gap-2">
                      <span>{p.user.name} · {p.account.bank} ••••{p.account.last4} ({p.account.name})</span>
                      <span className="flex gap-2 items-center"><span className="font-mono-numbers">{naira(p.amountNgn)}</span><Pill tone={p.status === 'paid' ? 'good' : p.status === 'failed' ? 'bad' : 'neutral'}>{p.status}</Pill>{p.failureReason && <span className="text-rose-700">{p.failureReason}</span>}</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-5 max-w-xl">
        <h3 className="text-[15px] font-medium">Manual adjustment</h3>
        <p className="text-[12px] text-slate-500 mt-1">Adds a correcting entry to a member’s earnings. Entries are never edited or deleted, and every adjustment is audited.</p>
        <form onSubmit={adjust} className="mt-3 space-y-2">
          <input aria-label="Member email" className={inputClass} placeholder="Member email" value={adj.email} onChange={(e) => setAdj({ ...adj, email: e.target.value })} required />
          <input aria-label="Amount in naira" type="number" className={inputClass} placeholder="Amount in ₦ (negative to deduct)" value={adj.amountNgn} onChange={(e) => setAdj({ ...adj, amountNgn: e.target.value })} required />
          <input aria-label="Reason" className={inputClass} placeholder="Reason (shown to the member)" value={adj.reason} onChange={(e) => setAdj({ ...adj, reason: e.target.value })} required minLength={10} />
          <Button type="submit" variant="outline" busy={busy === 'adj'}>Record adjustment</Button>
        </form>
      </section>
    </div>
  );
};

/* ---------- support & disputes ---------- */
export const AdminSupport: React.FC = () => {
  const [status, setStatus] = useState('open');
  const { data, error, load } = useLoad<{ tickets: Ticket[] }>(`/admin/support?status=${status}`);
  const [open, setOpen] = useState<string | null>(null);
  const [resolution, setResolution] = useState('');
  const [refund, setRefund] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const resolve = async (id: string) => {
    setBusy(true);
    setMsg(null);
    try {
      await api.post(`/admin/support/${id}/resolve`, { resolution, refundNgn: refund ? Number(refund) : 0 });
      setMsg({ tone: 'success', text: refund ? `Resolved with a ${naira(Number(refund))} refund.` : 'Resolved. Any held earnings were released.' });
      setOpen(null);
      setResolution('');
      setRefund('');
      load();
    } catch (e) {
      setMsg({ tone: 'error', text: e instanceof ApiError ? e.message : 'Couldn’t resolve.' });
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-4">
      <StatusFilter value={status} onChange={setStatus} options={[['open', 'Needs a reply'], ['waiting_on_user', 'Waiting on member'], ['resolved', 'Resolved']]} />
      {error && <Notice tone="error">{error}</Notice>}
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
      {data?.tickets.length === 0 && <p className="text-[13px] text-slate-500">Nothing here.</p>}
      <ul className="space-y-3">
        {data?.tickets.map((t) => (
          <li key={t.id} className="rounded-2xl border border-stone-200 bg-white p-5">
            <button className="w-full text-left flex flex-wrap justify-between gap-2" onClick={() => setOpen(open === t.id ? null : t.id)} aria-expanded={open === t.id}>
              <span><span className="text-[14px] font-medium">{t.title}</span><span className="block text-[12px] text-slate-500">{t.user?.name} · {TICKET_CATEGORY_LABELS[t.category]} · {timeAgo(t.createdAt)}</span></span>
              {t.category === 'dispute' && <Pill tone="warn">Earnings on hold</Pill>}
            </button>
            {open === t.id && (
              <div className="mt-4 border-t border-stone-100 pt-4">
                <TicketThread id={t.id} staff onChanged={load} />
                {t.status !== 'resolved' && (
                  <div className="mt-5 rounded-2xl bg-mist p-4 space-y-2">
                    <p className="text-[13px] font-medium">Resolve</p>
                    <textarea aria-label="Resolution" rows={3} className={textareaClass} placeholder="Decision and reasons (sent to the member)" value={resolution} onChange={(e) => setResolution(e.target.value)} />
                    {t.subjectType && t.subjectType !== 'payout' && (
                      <input aria-label="Refund amount" type="number" min={0} className={inputClass} placeholder="Refund in ₦ (leave empty for no refund)" value={refund} onChange={(e) => setRefund(e.target.value)} />
                    )}
                    <p className="text-[11px] text-slate-500">Resolving releases any earnings held for this ticket. A refund is taken from the seller’s earnings and sent back through Kora.</p>
                    <Button busy={busy} disabled={resolution.trim().length < 10} onClick={() => resolve(t.id)}>Resolve ticket</Button>
                  </div>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

/* ---------- books ---------- */
export const AdminBooks: React.FC = () => {
  const [status, setStatus] = useState('under_review');
  const { data, error, load } = useLoad<{ books: Book[] }>(`/admin/books?status=${status}`);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState('');
  const decide = async (id: string, decision: string) => {
    try {
      await api.post(`/admin/books/${id}/review`, { decision, note: notes[id] ?? '' });
      setMsg(`Book ${decision === 'approve' ? 'published' : decision === 'reject' ? 'sent back' : 'taken down'}.`);
      load();
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : 'Failed.');
    }
  };
  return (
    <div className="space-y-4">
      <StatusFilter value={status} onChange={setStatus} options={[['under_review', 'To review'], ['published', 'On sale'], ['rejected', 'Sent back'], ['suspended', 'Taken down']]} />
      {error && <Notice tone="error">{error}</Notice>}
      {msg && <Notice>{msg}</Notice>}
      {data?.books.length === 0 && <p className="text-[13px] text-slate-500">Nothing here.</p>}
      <ul className="space-y-3">
        {data?.books.map((b) => (
          <li key={b.id} className="rounded-2xl border border-stone-200 bg-white p-5 grid grid-cols-1 sm:grid-cols-[80px_minmax(0,1fr)] gap-4">
            {b.hasCover ? <img src={`/api/books/${b.id}/cover`} alt="" className="w-20 aspect-[3/4] object-cover rounded-lg" /> : <div className="w-20 aspect-[3/4] rounded-lg bg-mist" />}
            <div>
              <p className="text-[14px] font-medium">{b.title} <span className="text-slate-500 font-normal">· {naira(b.priceNgn)}</span></p>
              <p className="text-[12px] text-slate-500">{b.author.name} · {TOPIC_LABELS[b.topic]} · {b.pages ?? '?'} pages · {b.rightsDeclared ? 'Rights declared' : 'No rights declaration'}</p>
              <p className="mt-2 text-[13px] text-slate-700 line-clamp-3">{b.description}</p>
              <div className="mt-2 flex flex-wrap gap-3 text-[12px]">
                {b.hasBookFile && <a className="underline" href={`/api/books/${b.id}/download`}>Open book file</a>}
                {b.hasSample && <a className="underline" href={`/api/books/${b.id}/sample`}>Open sample</a>}
              </div>
              <p className="mt-2 text-[11px] text-slate-500">Check for copied content, unsafe chemical or veterinary advice and misleading income claims before approving.</p>
              <input aria-label="Review note" className={`${inputClass} mt-2 h-9`} placeholder="Note to the author (required to reject or take down)" value={notes[b.id] ?? ''} onChange={(e) => setNotes({ ...notes, [b.id]: e.target.value })} />
              <div className="mt-2 flex gap-2">
                {b.status === 'under_review' && <><Button variant="lime" className="h-9" onClick={() => decide(b.id, 'approve')}>Approve</Button><Button variant="outline" className="h-9" onClick={() => decide(b.id, 'reject')}>Send back</Button></>}
                {b.status === 'published' && <Button variant="danger" className="h-9" onClick={() => decide(b.id, 'suspend')}>Take down</Button>}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

/* ---------- specialist credentials ---------- */
export const AdminSpecialists: React.FC = () => {
  const [status, setStatus] = useState('pending');
  const { data, error, load } = useLoad<{ specialists: SpecialistSummary[] }>(`/admin/specialists?status=${status}`);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState('');
  const decide = async (id: string, decision: string) => {
    try {
      await api.post(`/admin/specialists/${id}/credentials`, { decision, note: notes[id] ?? '' });
      setMsg(decision === 'verified' ? 'Marked verified.' : 'Marked not verified.');
      load();
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : 'Failed.');
    }
  };
  return (
    <div className="space-y-4">
      <StatusFilter value={status} onChange={setStatus} options={[['pending', 'Waiting for checks'], ['verified', 'Verified'], ['unverified', 'Not verified']]} />
      {error && <Notice tone="error">{error}</Notice>}
      {msg && <Notice>{msg}</Notice>}
      {data?.specialists.length === 0 && <p className="text-[13px] text-slate-500">Nothing here.</p>}
      <ul className="space-y-3">
        {data?.specialists.map((s) => (
          <li key={s.id} className="rounded-2xl border border-stone-200 bg-white p-5">
            <p className="text-[14px] font-medium">{s.name} <span className="text-slate-500 font-normal">· {s.title}</span></p>
            <p className="text-[12px] text-slate-500">{s.location} · {s.experienceYears} years · {s.specialties.join(', ')}</p>
            <ul className="mt-2 text-[13px] list-disc pl-5">{s.credentials.map((c) => <li key={c}>{c}</li>)}</ul>
            {s.credentialNote && <p className="mt-2 text-[12px] text-slate-600">Last note: {s.credentialNote}</p>}
            <p className="mt-2 text-[11px] text-slate-500">Verify with the issuing body (e.g. VCN for vets, the university or professional register). Record what you checked; it’s shown on the profile.</p>
            <input aria-label="What was checked" className={`${inputClass} mt-2 h-9`} placeholder="What was checked, e.g. ‘VCN register entry confirmed’" value={notes[s.id] ?? ''} onChange={(e) => setNotes({ ...notes, [s.id]: e.target.value })} />
            <div className="mt-2 flex gap-2">
              <Button variant="lime" className="h-9" onClick={() => decide(s.id, 'verified')}>Mark verified</Button>
              <Button variant="outline" className="h-9" onClick={() => decide(s.id, 'unverified')}>Couldn’t verify</Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

/* ---------- creator applications ---------- */
export const AdminCreators: React.FC = () => {
  const [status, setStatus] = useState('pending');
  const { data, error, load } = useLoad<{ applications: any[] }>(`/admin/creator-applications?status=${status}`);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState('');
  const decide = async (id: string, decision: string) => {
    try {
      await api.post(`/admin/creator-applications/${id}/decide`, { decision, note: notes[id] ?? '' });
      setMsg({ approved: 'Approved for this topic.', rejected: 'Not approved.', info_requested: 'Asked for more information.' }[decision] ?? '');
      load();
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : 'Failed.');
    }
  };
  return (
    <div className="space-y-4">
      <StatusFilter value={status} onChange={setStatus} options={[['pending', 'To review'], ['info_requested', 'Info requested'], ['approved', 'Approved'], ['rejected', 'Not approved'], ['failed_quiz', 'Failed quiz']]} />
      {error && <Notice tone="error">{error}</Notice>}
      {msg && <Notice>{msg}</Notice>}
      {data?.applications.length === 0 && <p className="text-[13px] text-slate-500">Nothing here.</p>}
      <ul className="space-y-3">
        {data?.applications.map((a) => (
          <li key={a.id} className="rounded-2xl border border-stone-200 bg-white p-5">
            <div className="flex flex-wrap justify-between gap-2">
              <p className="text-[14px] font-medium">{a.user.name} <span className="text-slate-500 font-normal">· {a.user.title || a.user.role}</span></p>
              <span className="flex gap-2"><Pill>{TOPIC_LABELS[a.topic]}</Pill><Pill tone={a.score >= 80 ? 'good' : 'bad'}>Quiz {a.score}%</Pill></span>
            </div>
            <p className="mt-3 text-[13px] leading-relaxed whitespace-pre-wrap rounded-2xl bg-mist p-4 max-h-64 overflow-y-auto">{a.sample}</p>
            {a.note && <p className="mt-2 text-[12px] text-slate-600">Note: {a.note}</p>}
            {['pending', 'info_requested'].includes(a.status) && (
              <>
                <textarea aria-label="Note to applicant" rows={2} className={`${textareaClass} mt-3`} placeholder="Note to the applicant (required unless approving)" value={notes[a.id] ?? ''} onChange={(e) => setNotes({ ...notes, [a.id]: e.target.value })} />
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button variant="lime" className="h-9" onClick={() => decide(a.id, 'approved')}>Approve topic</Button>
                  <Button variant="outline" className="h-9" onClick={() => decide(a.id, 'info_requested')}>Ask for more</Button>
                  <Button variant="ghost" className="h-9" onClick={() => decide(a.id, 'rejected')}>Don’t approve</Button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

