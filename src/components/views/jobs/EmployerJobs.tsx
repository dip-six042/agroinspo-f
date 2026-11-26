import React, { useEffect, useState } from 'react';
import { Plus, Download } from 'lucide-react';
import { api, ApiError, Job, JOB_STATUS_LABELS, APPLICATION_STATUS_LABELS, timeAgo } from '../../../lib/api';
import { Button, Modal, naira, Notice, Pill, selectClass, Toast } from '../../ui';

const statusTone: Record<string, 'good' | 'warn' | 'bad' | 'neutral' | 'lime'> = {
  published: 'good', under_review: 'warn', payment_pending: 'warn', rejected: 'bad', draft: 'neutral', paused: 'neutral', expired: 'neutral', closed: 'neutral'
};

interface Applicant {
  id: string;
  status: string;
  coverNote: string;
  employerNote: string;
  createdAt: string;
  applicant: { id: string; name: string; email: string; location: string; headline: string; skills: string[]; experience: string; qualifications: string };
  cv: { id: string; filename: string } | null;
}

const Applicants: React.FC<{ job: Job; onClose: () => void }> = ({ job, onClose }) => {
  const [apps, setApps] = useState<Applicant[] | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api.get<{ applications: Applicant[] }>(`/jobs/${job.id}/applications`).then((r) => setApps(r.applications)).catch((e: ApiError) => setError(e.message));
  }, [job.id]);
  const setStatus = async (a: Applicant, status: string) => {
    setApps((list) => list?.map((x) => (x.id === a.id ? { ...x, status } : x)) ?? null);
    await api.patch(`/applications/${a.id}`, { status, note: '' }).catch((e: ApiError) => setError(e.message));
  };
  return (
    <Modal title={`Applicants · ${job.title}`} onClose={onClose} wide>
      <p className="text-[12px] text-slate-500">Candidate details are shared with you only for this vacancy. Don’t use them for anything else.</p>
      {error && <Notice tone="error" className="mt-3">{error}</Notice>}
      {apps === null && !error && <p className="mt-4 text-[13px] text-slate-500">Loading…</p>}
      {apps?.length === 0 && <Notice className="mt-4">No applications yet. Live listings usually get their first applicants within a few days.</Notice>}
      <ul className="mt-4 space-y-3">
        {apps?.map((a) => (
          <li key={a.id} className="rounded-2xl border border-stone-200 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[15px] font-medium">{a.applicant.name}</p>
                <p className="text-[12px] text-slate-500">{[a.applicant.headline, a.applicant.location].filter(Boolean).join(' · ')}</p>
                <p className="text-[12px] text-slate-500">{a.applicant.email} · applied {timeAgo(a.createdAt)}</p>
              </div>
              <label className="sr-only" htmlFor={`st-${a.id}`}>Status</label>
              <select id={`st-${a.id}`} className={`${selectClass} h-9 text-[12px]`} value={a.status} onChange={(e) => setStatus(a, e.target.value)}>
                {['submitted', 'reviewing', 'shortlisted', 'interview', 'offered', 'hired', 'rejected'].map((s) => <option key={s} value={s}>{APPLICATION_STATUS_LABELS[s]}</option>)}
              </select>
            </div>
            {a.applicant.skills.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">{a.applicant.skills.map((s) => <Pill key={s}>{s}</Pill>)}</div>
            )}
            {a.coverNote && <p className="mt-3 text-[13px] leading-relaxed whitespace-pre-wrap">{a.coverNote}</p>}
            {a.applicant.experience && <p className="mt-3 text-[12px] text-slate-600 whitespace-pre-wrap"><span className="font-medium text-ink">Experience: </span>{a.applicant.experience}</p>}
            {a.cv && (
              <a href={`/api/files/${a.cv.id}`} className="mt-3 inline-flex items-center gap-2 h-9 px-4 rounded-full border border-stone-300 hover:border-ink text-[12px]">
                <Download className="w-3.5 h-3.5" /> {a.cv.filename}
              </a>
            )}
          </li>
        ))}
      </ul>
    </Modal>
  );
};

export const EmployerJobs: React.FC<{ onNavigate: (v: string) => void }> = ({ onNavigate }) => {
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [error, setError] = useState('');
  const [applicantsFor, setApplicantsFor] = useState<Job | null>(null);
  const [renewing, setRenewing] = useState<Job | null>(null);
  const [plans, setPlans] = useState<{ id: string; label: string; priceNgn: number; days: number }[]>([]);
  const [toastMsg, setToastMsg] = useState('');

  const load = () => api.get<{ jobs: Job[] }>('/me/jobs').then((r) => setJobs(r.jobs)).catch((e: ApiError) => setError(e.message));
  useEffect(() => {
    load();
    api.get<{ plans: any[] }>('/jobs/meta').then((r) => setPlans(r.plans)).catch(() => {});
  }, []);

  const act = async (j: Job, action: 'pause' | 'resume' | 'close') => {
    try {
      await api.post(`/jobs/${j.id}/status`, { action });
      setToastMsg({ pause: 'Listing paused.', resume: 'Listing is live again.', close: 'Listing closed. Applicants have been told.' }[action]);
      load();
    } catch (e) {
      setToastMsg(e instanceof ApiError ? e.message : 'Couldn’t update the listing.');
    }
  };
  const renew = async (plan: string) => {
    if (!renewing) return;
    try {
      const r = await api.post<{ checkoutUrl: string }>(`/jobs/${renewing.id}/renew`, { plan });
      window.location.assign(r.checkoutUrl);
    } catch (e) {
      setToastMsg(e instanceof ApiError ? e.message : 'Couldn’t start the renewal.');
      setRenewing(null);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-slate-500">Listings are reviewed before going live, then run for the length of the plan you choose.</p>
        <Button variant="lime" onClick={() => onNavigate('jobs:new')}><Plus className="w-4 h-4" /> Post a job</Button>
      </div>
      {error && <Notice tone="error" className="mt-4">{error}</Notice>}
      {jobs?.length === 0 && (
        <div className="mt-6 rounded-3xl border border-dashed border-stone-300 p-10 text-center">
          <p className="font-display text-[22px]">No job listings yet.</p>
          <p className="mt-2 text-[13px] text-slate-500">Post your first vacancy to reach farm workers and agricultural professionals in any country.</p>
        </div>
      )}
      <ul className="mt-6 space-y-3">
        {jobs?.map((j) => (
          <li key={j.id} className="rounded-2xl border border-stone-200 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone={statusTone[j.status] ?? 'neutral'}>{JOB_STATUS_LABELS[j.status] ?? j.status}</Pill>
                  {j.featured && <Pill tone="lime">Featured</Pill>}
                </div>
                <p className="mt-2 text-[16px] font-medium">{j.title}</p>
                <p className="text-[12px] text-slate-500 mt-0.5">
                  {j.location} · closes {j.closingDate}
                  {j.expiresAt && j.status === 'published' ? ` · listed until ${j.expiresAt.slice(0, 10)}` : ''}
                </p>
              </div>
              <button onClick={() => setApplicantsFor(j)} className="text-right">
                <span className="block font-display text-[28px] leading-none font-mono-numbers">{j.applicantCount ?? 0}</span>
                <span className="text-[12px] underline underline-offset-4">applicants</span>
              </button>
            </div>
            {j.status === 'rejected' && j.reviewNote && <Notice tone="error" className="mt-3">Reviewer’s note: {j.reviewNote}</Notice>}
            {j.status === 'under_review' && <Notice className="mt-3">Payment received. We’re reviewing the listing, usually within one working day.</Notice>}
            <div className="mt-4 flex flex-wrap gap-2">
              {['draft', 'payment_pending', 'rejected'].includes(j.status) && (
                <Button className="h-9" variant="lime" onClick={() => onNavigate(`jobs:edit:${j.id}`)}>
                  {j.status === 'rejected' ? 'Edit and resubmit' : 'Finish and pay'}
                </Button>
              )}
              {['published', 'paused'].includes(j.status) && <Button className="h-9" variant="outline" onClick={() => onNavigate(`jobs:edit:${j.id}`)}>Edit</Button>}
              {j.status === 'published' && <Button className="h-9" variant="outline" onClick={() => act(j, 'pause')}>Pause</Button>}
              {j.status === 'paused' && <Button className="h-9" variant="outline" onClick={() => act(j, 'resume')}>Resume</Button>}
              {['published', 'expired'].includes(j.status) && <Button className="h-9" variant="outline" onClick={() => setRenewing(j)}>Renew</Button>}
              {!['closed', 'archived', 'under_review'].includes(j.status) && <Button className="h-9" variant="ghost" onClick={() => act(j, 'close')}>Close listing</Button>}
            </div>
          </li>
        ))}
      </ul>
      {applicantsFor && <Applicants job={applicantsFor} onClose={() => (setApplicantsFor(null), load())} />}
      {renewing && (
        <Modal title={`Renew · ${renewing.title}`} onClose={() => setRenewing(null)}>
          <p className="text-[13px] text-slate-500">Renewal adds time to the listing straight away; no new review is needed.</p>
          <div className="mt-4 space-y-2">
            {plans.map((p) => (
              <button key={p.id} onClick={() => renew(p.id)} className="w-full flex items-center justify-between rounded-2xl border border-stone-200 hover:border-ink p-4 text-left">
                <span><span className="block text-[14px] font-medium">{p.label}</span><span className="text-[12px] text-slate-500">+{p.days} days</span></span>
                <span className="font-mono-numbers text-[15px]">{naira(p.priceNgn)}</span>
              </button>
            ))}
          </div>
        </Modal>
      )}
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg('')} />}
    </div>
  );
};
