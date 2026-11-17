// Live admin tools backed by the API: users, reports & appeals, audit log.
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api, ApiError, REPORT_REASON_LABELS, timeAgo, Job, JOB_CATEGORY_LABELS, JOB_TYPE_LABELS, PaymentInfo } from '../../lib/api';
import { Button, Notice, textareaClass } from '../ui';

export const AdminGate: React.FC<{ children: React.ReactNode; onLogin?: () => void }> = ({ children, onLogin }) => {
  const { user } = useAuth();
  if (user?.role === 'admin') return <>{children}</>;
  return (
    <Notice>
      This section shows live data from the server. Log in with an admin account to manage users, reports and appeals.
      {onLogin && (
        <button onClick={onLogin} className="ml-2 underline underline-offset-4">
          Log in
        </button>
      )}
    </Notice>
  );
};

/* ---------- overview strip ---------- */
export const AdminOverview: React.FC = () => {
  const [o, setO] = useState<any>(null);
  useEffect(() => {
    api.get('/admin/overview').then(setO).catch(() => {});
  }, []);
  if (!o) return null;
  const stats: [string, number][] = [
    ['Members', o.users],
    ['Email verified', o.verifiedUsers],
    ['Suspended', o.suspended],
    ['Open reports', o.openReports],
    ['Open appeals', o.openAppeals],
    ['Live posts', o.posts]
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {stats.map(([label, n]) => (
        <div key={label} className={`rounded-2xl p-4 ${label === 'Open reports' && n > 0 ? 'bg-lime' : 'bg-mist'}`}>
          <p className="font-display text-[28px] leading-none font-mono-numbers">{n}</p>
          <p className="text-[12px] mt-2 text-slate-600">{label}</p>
        </div>
      ))}
    </div>
  );
};

/* ---------- users ---------- */
interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'suspended';
  emailVerified: boolean;
  createdAt: string;
  postCount: number;
  reportCount: number;
}

export const AdminUsers: React.FC = () => {
  const { user: me } = useAuth();
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [editing, setEditing] = useState<{ id: string; field: 'status' | 'role'; value: string } | null>(null);
  const [reason, setReason] = useState('');
  const [msg, setMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const load = () => {
    const p = new URLSearchParams();
    if (q.trim()) p.set('q', q.trim());
    if (role) p.set('role', role);
    api.get<{ users: AdminUser[] }>(`/admin/users?${p}`).then((r) => setUsers(r.users)).catch((e) => setMsg({ tone: 'error', text: e.message }));
  };
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [q, role]);

  const apply = async () => {
    if (!editing) return;
    setMsg(null);
    try {
      await api.patch(`/admin/users/${editing.id}`, { [editing.field]: editing.value, reason });
      setMsg({ tone: 'success', text: 'Change saved and recorded in the audit log.' });
      setEditing(null);
      setReason('');
      load();
    } catch (e) {
      setMsg({ tone: 'error', text: e instanceof ApiError ? e.message : 'Couldn’t save.' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <label htmlFor="au-q" className="sr-only">
          Search members
        </label>
        <input
          id="au-q"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name or email"
          className="flex-1 min-w-[200px] h-10 px-4 rounded-full border border-stone-300 bg-white text-[13px]"
        />
        <label htmlFor="au-role" className="sr-only">
          Filter by role
        </label>
        <select id="au-role" value={role} onChange={(e) => setRole(e.target.value)} className="h-10 px-4 rounded-full border border-stone-300 bg-white text-[13px]">
          <option value="">All roles</option>
          {['enthusiast', 'farmer', 'specialist', 'business', 'admin'].map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
      <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
        <table className="w-full text-[13px]">
          <thead className="text-left text-[11px] text-slate-500 border-b border-stone-200">
            <tr>
              <th className="px-4 py-3 font-medium">Member</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Posts</th>
              <th className="px-4 py-3 font-medium text-right">Reports</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {users?.map((u) => (
              <React.Fragment key={u.id}>
                <tr className="border-b border-stone-100 last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium">{u.name}</p>
                    <p className="text-[12px] text-slate-500">
                      {u.email} {u.emailVerified ? '' : '· unverified'}
                    </p>
                  </td>
                  <td className="px-4 py-3 capitalize">{u.role}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-medium ${u.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-800'}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono-numbers">{u.postCount}</td>
                  <td className="px-4 py-3 text-right font-mono-numbers">{u.reportCount}</td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{timeAgo(u.createdAt)}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {u.id !== me?.id && (
                      <>
                        <button
                          onClick={() => setEditing({ id: u.id, field: 'status', value: u.status === 'active' ? 'suspended' : 'active' })}
                          className="text-[12px] underline underline-offset-4 mr-3"
                        >
                          {u.status === 'active' ? 'Suspend' : 'Reinstate'}
                        </button>
                        <button onClick={() => setEditing({ id: u.id, field: 'role', value: u.role })} className="text-[12px] underline underline-offset-4">
                          Change role
                        </button>
                      </>
                    )}
                  </td>
                </tr>
                {editing?.id === u.id && (
                  <tr className="bg-stone-50">
                    <td colSpan={7} className="px-4 py-4">
                      <div className="flex flex-wrap items-end gap-3">
                        {editing.field === 'role' && (
                          <div>
                            <label htmlFor="au-new-role" className="block text-[12px] mb-1">
                              New role
                            </label>
                            <select
                              id="au-new-role"
                              value={editing.value}
                              onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                              className="h-10 px-4 rounded-full border border-stone-300 bg-white text-[13px]"
                            >
                              {['enthusiast', 'farmer', 'specialist', 'business', 'admin'].map((r) => (
                                <option key={r}>{r}</option>
                              ))}
                            </select>
                          </div>
                        )}
                        <div className="flex-1 min-w-[220px]">
                          <label htmlFor="au-reason" className="block text-[12px] mb-1">
                            Reason (recorded in the audit log{editing.field === 'status' ? ' and sent to the member' : ''})
                          </label>
                          <input
                            id="au-reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full h-10 px-4 rounded-full border border-stone-300 bg-white text-[13px]"
                          />
                        </div>
                        <Button className="h-10" variant={editing.value === 'suspended' ? 'danger' : 'ink'} onClick={apply} disabled={reason.trim().length < 3}>
                          {editing.field === 'status' ? (editing.value === 'suspended' ? 'Suspend member' : 'Reinstate member') : 'Save role'}
                        </Button>
                        <Button className="h-10" variant="outline" onClick={() => setEditing(null)}>
                          Cancel
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {users && users.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  No members match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ---------- reports & appeals ---------- */
interface Report {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  details: string;
  createdAt: string;
  reporter: { name: string };
  targetPreview: string;
  action?: string;
  note?: string;
}
interface Appeal {
  id: string;
  message: string;
  createdAt: string;
  user: { name: string };
  decision: { targetType: string; action: string; note: string; reason: string };
}

export const AdminReports: React.FC = () => {
  const [status, setStatus] = useState<'open' | 'actioned' | 'dismissed'>('open');
  const [reports, setReports] = useState<Report[] | null>(null);
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const load = () => {
    api.get<{ reports: Report[] }>(`/admin/reports?status=${status}`).then((r) => setReports(r.reports)).catch(() => setReports([]));
    api.get<{ appeals: Appeal[] }>('/admin/appeals').then((r) => setAppeals(r.appeals)).catch(() => {});
  };
  useEffect(load, [status]);

  const resolve = async (r: Report, action: string) => {
    setMsg(null);
    try {
      await api.post(`/admin/reports/${r.id}/resolve`, { action, note: notes[r.id] || '' });
      setMsg({ tone: 'success', text: 'Decision saved. Both people have been notified.' });
      load();
    } catch (e) {
      setMsg({ tone: 'error', text: e instanceof ApiError ? e.message : 'Couldn’t save.' });
    }
  };
  const decide = async (a: Appeal, decision: 'upheld' | 'overturned') => {
    setMsg(null);
    try {
      await api.post(`/admin/appeals/${a.id}/decide`, { decision, note: notes[a.id] || '' });
      setMsg({ tone: 'success', text: decision === 'overturned' ? 'Appeal accepted and the action reversed.' : 'Appeal declined.' });
      load();
    } catch (e) {
      setMsg({ tone: 'error', text: e instanceof ApiError ? e.message : 'Couldn’t save.' });
    }
  };
  const actionLabel: Record<string, string> = { remove_content: 'Content removed', suspend_user: 'Member suspended', dismiss: 'Dismissed' };

  return (
    <div className="space-y-8">
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}

      {appeals.length > 0 && (
        <section>
          <h3 className="text-[15px] font-medium">Appeals waiting ({appeals.length})</h3>
          <ul className="mt-3 space-y-3">
            {appeals.map((a) => (
              <li key={a.id} className="rounded-2xl border border-stone-200 bg-white p-5">
                <p className="text-[13px]">
                  <span className="font-medium">{a.user.name}</span> appeals: {actionLabel[a.decision.action]} ({a.decision.reason}) ·{' '}
                  <span className="text-slate-500">{timeAgo(a.createdAt)}</span>
                </p>
                <p className="mt-1 text-[12px] text-slate-500">Original note: {a.decision.note}</p>
                <blockquote className="mt-3 rounded-xl bg-mist px-4 py-3 text-[13px]">{a.message}</blockquote>
                <label htmlFor={`an-${a.id}`} className="sr-only">
                  Decision note
                </label>
                <textarea
                  id={`an-${a.id}`}
                  rows={2}
                  className={`${textareaClass} mt-3`}
                  placeholder="Note to the member (required)"
                  value={notes[a.id] || ''}
                  onChange={(e) => setNotes({ ...notes, [a.id]: e.target.value })}
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button className="h-9" onClick={() => decide(a, 'overturned')}>
                    Accept appeal &amp; reverse
                  </Button>
                  <Button className="h-9" variant="outline" onClick={() => decide(a, 'upheld')}>
                    Uphold decision
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-[15px] font-medium">Reports</h3>
          <div className="flex gap-2">
            {(['open', 'actioned', 'dismissed'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                aria-pressed={status === s}
                className={`h-9 px-4 rounded-full text-[12px] border capitalize ${status === s ? 'bg-ink text-white border-ink' : 'border-stone-300'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        {reports === null ? (
          <p className="mt-4 text-[13px] text-slate-500">Loading…</p>
        ) : reports.length === 0 ? (
          <Notice className="mt-4">{status === 'open' ? 'No open reports. The queue is clear.' : `No ${status} reports.`}</Notice>
        ) : (
          <ul className="mt-4 space-y-3">
            {reports.map((r) => (
              <li key={r.id} className="rounded-2xl border border-stone-200 bg-white p-5">
                <div className="flex flex-wrap items-center gap-2 text-[12px]">
                  <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 font-medium">{REPORT_REASON_LABELS[r.reason] ?? r.reason}</span>
                  <span className="text-slate-500">
                    {r.targetType} reported by {r.reporter.name} · {timeAgo(r.createdAt)}
                  </span>
                </div>
                <blockquote className="mt-3 rounded-xl bg-mist px-4 py-3 text-[13px] whitespace-pre-wrap break-words">{r.targetPreview || '(content no longer available)'}</blockquote>
                {r.details && <p className="mt-2 text-[12px] text-slate-600">Reporter’s note: {r.details}</p>}
                {status === 'open' ? (
                  <>
                    <label htmlFor={`rn-${r.id}`} className="sr-only">
                      Decision note
                    </label>
                    <textarea
                      id={`rn-${r.id}`}
                      rows={2}
                      className={`${textareaClass} mt-3`}
                      placeholder="Decision note: which guideline, and why (required, shared with the member)"
                      value={notes[r.id] || ''}
                      onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })}
                    />
                    <div className="mt-3 flex flex-wrap gap-2">
                      {r.targetType !== 'user' && (
                        <Button className="h-9" onClick={() => resolve(r, 'remove_content')}>
                          Remove content
                        </Button>
                      )}
                      <Button className="h-9" variant="danger" onClick={() => resolve(r, 'suspend_user')}>
                        Suspend author
                      </Button>
                      <Button className="h-9" variant="outline" onClick={() => resolve(r, 'dismiss')}>
                        Dismiss
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="mt-3 text-[12px] text-slate-600">
                    {actionLabel[r.action || ''] ?? r.action}: {r.note}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

/* ---------- audit ---------- */
export const AdminAudit: React.FC = () => {
  const [entries, setEntries] = useState<any[] | null>(null);
  useEffect(() => {
    api.get<{ entries: any[] }>('/admin/audit').then((r) => setEntries(r.entries)).catch(() => setEntries([]));
  }, []);
  if (entries === null) return <p className="text-[13px] text-slate-500">Loading…</p>;
  return (
    <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
      <table className="w-full text-[13px]">
        <thead className="text-left text-[11px] text-slate-500 border-b border-stone-200">
          <tr>
            <th className="px-4 py-3 font-medium">When</th>
            <th className="px-4 py-3 font-medium">Action</th>
            <th className="px-4 py-3 font-medium">Actor</th>
            <th className="px-4 py-3 font-medium">Target</th>
            <th className="px-4 py-3 font-medium">Details</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.id} className="border-b border-stone-100 last:border-0 align-top">
              <td className="px-4 py-3 whitespace-nowrap font-mono-numbers text-slate-500">{new Date(e.createdAt).toLocaleString('en-NG')}</td>
              <td className="px-4 py-3 font-medium whitespace-nowrap">{e.action}</td>
              <td className="px-4 py-3 whitespace-nowrap">{e.actor?.name ?? 'System'}</td>
              <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                {e.targetType} {e.targetId ? `· ${String(e.targetId).slice(0, 8)}` : ''}
              </td>
              <td className="px-4 py-3 text-slate-600 text-[12px]">
                {Object.entries(e.details || {})
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(' · ')}
              </td>
            </tr>
          ))}
          {entries.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                No entries yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

/* ---------- job listing review (Phase 2) ---------- */

export const AdminJobsQueue: React.FC = () => {
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const load = () => api.get<{ jobs: Job[] }>('/admin/jobs?status=under_review').then((r) => setJobs(r.jobs)).catch(() => setJobs([]));
  useEffect(() => {
    load();
  }, []);
  const review = async (j: Job, decision: 'approve' | 'reject') => {
    setMsg(null);
    try {
      await api.post(`/admin/jobs/${j.id}/review`, { decision, note: notes[j.id] || '' });
      setMsg({ tone: 'success', text: decision === 'approve' ? `“${j.title}” is live.` : 'Sent back to the employer with your note.' });
      load();
    } catch (e) {
      setMsg({ tone: 'error', text: e instanceof ApiError ? e.message : 'Couldn’t save.' });
    }
  };
  return (
    <div className="space-y-4">
      <p className="text-[13px] text-slate-500">Paid listings waiting for review. Check for scams, discrimination, misleading pay and requests for money (PRD §25.2).</p>
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
      {jobs === null ? <p className="text-[13px] text-slate-500">Loading…</p> : jobs.length === 0 ? <Notice>No listings waiting. The queue is clear.</Notice> : null}
      <ul className="space-y-3">
        {jobs?.map((j) => (
          <li key={j.id} className="rounded-2xl border border-stone-200 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[16px] font-medium">{j.title}</p>
                <p className="text-[12px] text-slate-500">{j.employer.name} · {j.location} · {JOB_CATEGORY_LABELS[j.category]} · {JOB_TYPE_LABELS[j.employmentType]} · {j.plan}</p>
              </div>
              <p className="text-[12px] text-slate-500">closes {j.closingDate}</p>
            </div>
            {j.flags && j.flags.length > 0 && (
              <div className="mt-3 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-[13px] text-rose-800">
                <p className="font-medium">Automatic screening flagged:</p>
                <ul className="mt-1 list-disc pl-5">{j.flags.map((f) => <li key={f}>{f}</li>)}</ul>
              </div>
            )}
            <p className="mt-3 text-[13px] leading-relaxed whitespace-pre-wrap">{j.description}</p>
            {j.payMin != null && <p className="mt-2 text-[12px] text-slate-600 font-mono-numbers">Pay: ₦{j.payMin?.toLocaleString()}–₦{j.payMax?.toLocaleString()} / {j.payPeriod}</p>}
            <label htmlFor={`jn-${j.id}`} className="sr-only">Note to employer</label>
            <textarea id={`jn-${j.id}`} rows={2} className={`${textareaClass} mt-3`} placeholder="Note to the employer (required if sending back)"
              value={notes[j.id] || ''} onChange={(e) => setNotes({ ...notes, [j.id]: e.target.value })} />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button className="h-9" variant="lime" onClick={() => review(j, 'approve')}>Approve and publish</Button>
              <Button className="h-9" variant="outline" onClick={() => review(j, 'reject')}>Send back for changes</Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

/* ---------- payments (Phase 2) ---------- */
export const AdminPayments: React.FC = () => {
  const [data, setData] = useState<{ payments: (PaymentInfo & { user: { name: string } })[]; totals: { gross: number; fees: number; n: number } } | null>(null);
  useEffect(() => {
    api.get<any>('/admin/payments').then(setData).catch(() => {});
  }, []);
  if (!data) return <p className="text-[13px] text-slate-500">Loading…</p>;
  const tone: Record<string, string> = { successful: 'bg-emerald-50 text-emerald-700', failed: 'bg-rose-50 text-rose-800', under_review: 'bg-amber-50 text-amber-800' };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[['Successful payments', data.totals.n.toLocaleString()], ['Gross collected', `₦${data.totals.gross.toLocaleString()}`], ['Provider fees', `₦${data.totals.fees.toLocaleString()}`]].map(([l, v]) => (
          <div key={l} className="rounded-2xl bg-mist p-4"><p className="font-display text-[24px] font-mono-numbers">{v}</p><p className="text-[12px] text-slate-600 mt-1">{l}</p></div>
        ))}
      </div>
      <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
        <table className="w-full text-[13px]">
          <thead className="text-left text-[11px] text-slate-500 border-b border-stone-200">
            <tr><th className="px-4 py-3 font-medium">Reference</th><th className="px-4 py-3 font-medium">Payer</th><th className="px-4 py-3 font-medium">For</th><th className="px-4 py-3 font-medium text-right">Amount</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">When</th></tr>
          </thead>
          <tbody>
            {data.payments.map((p) => (
              <tr key={p.reference} className="border-b border-stone-100 last:border-0">
                <td className="px-4 py-3 font-mono-numbers whitespace-nowrap">{p.reference}</td>
                <td className="px-4 py-3 whitespace-nowrap">{p.user.name}</td>
                <td className="px-4 py-3">{p.description}</td>
                <td className="px-4 py-3 text-right font-mono-numbers whitespace-nowrap">₦{p.amountNgn.toLocaleString()}</td>
                <td className="px-4 py-3"><span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-medium ${tone[p.status] ?? 'bg-mist'}`}>{p.status.replace('_', ' ')}</span></td>
                <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{timeAgo(p.createdAt)}</td>
              </tr>
            ))}
            {data.payments.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No payments yet.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="text-[12px] text-slate-500">Refunds, platform commission and payouts arrive with the Phase 3 earnings ledger. Payments marked “under review” need a manual check.</p>
    </div>
  );
};
