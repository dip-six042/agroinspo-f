import { SponsoredSlot } from '../../business/Sponsored';
import React, { useEffect, useState } from 'react';
import { BadgeCheck, Bookmark, MapPin, Search, ExternalLink, Flag, Clock } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useCurrency } from '../../../context/CurrencyContext';
import {
  api, ApiError, Job, JOB_CATEGORY_LABELS, JOB_TYPE_LABELS, WORK_MODE_LABELS, APPLICATION_STATUS_LABELS, REPORT_REASON_LABELS, timeAgo, uploadFile
} from '../../../lib/api';
import { Button, Modal, Notice, Pill, selectClass, textareaClass, Toast } from '../../ui';

export function payText(job: Job, formatMoney: (n: number) => string) {
  if (job.payMin == null && job.payMax == null) return 'Pay not stated';
  const per = job.payPeriod ? ` / ${job.payPeriod}` : '';
  if (job.payMin != null && job.payMax != null && job.payMin !== job.payMax) return `${formatMoney(job.payMin)}–${formatMoney(job.payMax)}${per}`;
  return `${formatMoney((job.payMax ?? job.payMin) as number)}${per}`;
}

const daysLeft = (date: string) => Math.max(0, Math.ceil((new Date(date + 'T23:59:59').getTime() - Date.now()) / 86400000));

/* ---------- apply dialog ---------- */
const ApplyDialog: React.FC<{ job: Job; onClose: () => void; onApplied: () => void }> = ({ job, onClose, onApplied }) => {
  const [note, setNote] = useState('');
  const [cv, setCv] = useState<{ id: string; filename: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get<{ profile: { cv: { id: string; filename: string } | null } }>('/me/jobseeker')
      .then((r) => setCv(r.profile.cv))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const upload = async (f: File | undefined) => {
    if (!f) return;
    setError('');
    if (f.size > 5 * 1024 * 1024) return setError('Your CV must be 5 MB or smaller.');
    setBusy(true);
    try {
      const r = await uploadFile<{ file: { id: string; filename: string } }>('/files/cv', f);
      setCv(r.file);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Upload failed.');
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      await api.post(`/jobs/${job.id}/apply`, { coverNote: note, cvFileId: cv?.id });
      onApplied();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Couldn’t send your application.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={`Apply: ${job.title}`} onClose={onClose}>
      <p className="text-[13px] text-slate-500">
        {job.employer.name} · {job.location}. Applying is free. The employer sees your name, email, career profile and the CV you attach.
      </p>
      <div className="mt-5 rounded-2xl bg-mist p-4">
        <p className="text-[13px] font-medium">CV</p>
        {loading ? (
          <p className="text-[13px] text-slate-500 mt-1">Loading…</p>
        ) : cv ? (
          <p className="text-[13px] mt-1">
            {cv.filename} <span className="text-slate-500">· will be attached</span>
          </p>
        ) : (
          <p className="text-[13px] text-slate-500 mt-1">No CV yet. Upload a PDF or Word file, or describe your experience below.</p>
        )}
        <label className="mt-3 inline-flex items-center h-9 px-4 rounded-full border border-stone-300 bg-white text-[12px] cursor-pointer hover:border-ink">
          {cv ? 'Replace CV' : 'Upload CV'}
          <input
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="sr-only"
            onChange={(e) => upload(e.target.files?.[0])}
          />
        </label>
      </div>
      <label htmlFor="cover" className="block mt-5 text-[13px] font-medium">
        Why you’re a good fit
      </label>
      <textarea id="cover" rows={5} maxLength={3000} className={`${textareaClass} mt-1.5`} value={note} onChange={(e) => setNote(e.target.value)}
        placeholder="Relevant experience, the size of farms you’ve worked on, when you can start" />
      <Notice className="mt-4">Agro Inspo never asks candidates to pay to apply. If an employer asks you for money, report the listing.</Notice>
      {error && <Notice tone="error" className="mt-3">{error}</Notice>}
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button variant="lime" busy={busy} onClick={submit}>Send application</Button>
      </div>
    </Modal>
  );
};

/* ---------- report dialog (jobs) ---------- */
const ReportJob: React.FC<{ job: Job; onClose: () => void; onDone: (m: string) => void }> = ({ job, onClose, onDone }) => {
  const [reason, setReason] = useState('scam');
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <Modal title="Report this job" onClose={onClose}>
      <label htmlFor="rj-reason" className="text-[13px] font-medium">Reason</label>
      <select id="rj-reason" className={`${selectClass} w-full mt-1.5`} value={reason} onChange={(e) => setReason(e.target.value)}>
        {Object.entries(REPORT_REASON_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
      </select>
      <label htmlFor="rj-details" className="block mt-4 text-[13px] font-medium">What happened?</label>
      <textarea id="rj-details" rows={3} className={`${textareaClass} mt-1.5`} value={details} onChange={(e) => setDetails(e.target.value)} />
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button busy={busy} onClick={async () => {
          setBusy(true);
          try {
            await api.post('/reports', { targetType: 'job', targetId: job.id, reason, details });
            onDone('Thanks. Our moderators will review this listing.');
          } catch (e) {
            onDone(e instanceof ApiError ? e.message : 'Couldn’t send the report.');
          }
        }}>Send report</Button>
      </div>
    </Modal>
  );
};

/* ---------- detail ---------- */
export const JobDetail: React.FC<{ job: Job; onChange: (j: Job) => void; onNavigate: (v: string) => void; toast: (m: string) => void }> = ({ job, onChange, onNavigate, toast }) => {
  const { user } = useAuth();
  const { formatMoney } = useCurrency();
  const [applying, setApplying] = useState(false);
  const [reporting, setReporting] = useState(false);
  const mine = user?.id === job.employer.id;

  const save = async () => {
    if (!user) return onNavigate('auth:login');
    const r = await api.post<{ saved: boolean }>(`/jobs/${job.id}/save`).catch(() => null);
    if (r) onChange({ ...job, saved: r.saved });
  };

  return (
    <article className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8">
      <div className="flex flex-wrap items-center gap-2">
        {job.featured && <Pill tone="lime">Featured</Pill>}
        <Pill>{JOB_TYPE_LABELS[job.employmentType]}</Pill>
        <Pill>{WORK_MODE_LABELS[job.workMode]}</Pill>
        <Pill>{JOB_CATEGORY_LABELS[job.category]}</Pill>
      </div>
      <h2 className="mt-4 font-display text-[28px] sm:text-[34px] font-normal leading-[1.1] tracking-[-0.02em]">{job.title}</h2>
      <p className="mt-2 text-[14px] flex flex-wrap items-center gap-x-2 gap-y-1 text-slate-600">
        <span className="font-medium text-ink">{job.employer.name}</span>
        {job.employer.emailVerified && (
          <span className="inline-flex items-center gap-1 text-[12px] text-emerald-700" title="Employer’s email address is verified. Business verification comes later.">
            <BadgeCheck className="w-3.5 h-3.5" /> Verified email
          </span>
        )}
        <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.location}</span>
      </p>
      <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl bg-mist p-4"><p className="text-[11px] text-slate-500">Pay</p><p className="text-[14px] font-medium mt-1 font-mono-numbers">{payText(job, formatMoney)}</p></div>
        <div className="rounded-2xl bg-mist p-4"><p className="text-[11px] text-slate-500">Closes</p><p className="text-[14px] font-medium mt-1">{job.closingDate} · {daysLeft(job.closingDate)} days</p></div>
        <div className="rounded-2xl bg-mist p-4"><p className="text-[11px] text-slate-500">Openings</p><p className="text-[14px] font-medium mt-1 font-mono-numbers">{job.openings}</p></div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {mine ? (
          <Button variant="outline" onClick={() => onNavigate('jobs:mine')}>Manage this listing</Button>
        ) : job.myApplication && job.myApplication.status !== 'withdrawn' ? (
          <Pill tone="good" className="h-11 px-5 text-[13px]">Applied · {APPLICATION_STATUS_LABELS[job.myApplication.status]}</Pill>
        ) : job.applyMethod === 'external' ? (
          <a href={job.externalUrl} target="_blank" rel="noopener noreferrer nofollow"
            className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-lime hover:bg-lime-deep text-[13px] font-medium">
            Apply on employer’s site <ExternalLink className="w-4 h-4" />
          </a>
        ) : (
          <Button variant="lime" onClick={() => (user ? setApplying(true) : onNavigate('auth:signup:enthusiast'))}>
            {user ? 'Apply for free' : 'Join free to apply'}
          </Button>
        )}
        {!mine && (
          <Button variant="outline" onClick={save} aria-pressed={job.saved}>
            <Bookmark className={`w-4 h-4 ${job.saved ? 'fill-ink' : ''}`} /> {job.saved ? 'Saved' : 'Save'}
          </Button>
        )}
      </div>

      <div className="mt-8 space-y-6 text-[14px] leading-relaxed">
        <p className="whitespace-pre-wrap">{job.description}</p>
        {job.responsibilities.length > 0 && (
          <section><h3 className="text-[15px] font-medium">Responsibilities</h3>
            <ul className="mt-2 space-y-1.5">{job.responsibilities.map((r) => <li key={r} className="flex gap-2.5"><span className="mt-[9px] w-1 h-1 rounded-full bg-ink shrink-0" />{r}</li>)}</ul></section>
        )}
        {job.qualifications.length > 0 && (
          <section><h3 className="text-[15px] font-medium">What you need</h3>
            <ul className="mt-2 space-y-1.5">{job.qualifications.map((r) => <li key={r} className="flex gap-2.5"><span className="mt-[9px] w-1 h-1 rounded-full bg-ink shrink-0" />{r}</li>)}</ul></section>
        )}
      </div>

      <div className="mt-8 pt-5 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3 text-[12px] text-slate-500">
        <span className="inline-flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Posted {job.publishedAt ? timeAgo(job.publishedAt) : 'recently'}</span>
        {user && !mine && (
          <button onClick={() => setReporting(true)} className="inline-flex items-center gap-1.5 hover:text-ink"><Flag className="w-3.5 h-3.5" /> Report job</button>
        )}
      </div>

      {applying && (
        <ApplyDialog job={job} onClose={() => setApplying(false)} onApplied={() => {
          setApplying(false);
          onChange({ ...job, myApplication: { id: '', status: 'submitted' } });
          toast('Application sent. Track it under My applications.');
        }} />
      )}
      {reporting && <ReportJob job={job} onClose={() => setReporting(false)} onDone={(m) => (setReporting(false), toast(m))} />}
    </article>
  );
};

/* ---------- board ---------- */
export const JobBoard: React.FC<{ onNavigate: (v: string) => void; initialJobId?: string }> = ({ onNavigate, initialJobId }) => {
  const { formatMoney } = useCurrency();
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState('');
  const [mode, setMode] = useState('');
  const [selectedId, setSelectedId] = useState<string | undefined>(initialJobId);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const p = new URLSearchParams();
    if (debounced) p.set('q', debounced);
    if (category) p.set('category', category);
    if (type) p.set('type', type);
    if (mode) p.set('mode', mode);
    setError('');
    api.get<{ jobs: Job[] }>(`/jobs?${p}`)
      .then((r) => {
        setJobs(r.jobs);
        setSelectedId((id) => (id && r.jobs.some((j) => j.id === id) ? id : window.innerWidth >= 1024 ? r.jobs[0]?.id : id));
      })
      .catch((e: ApiError) => setError(e.message));
  }, [debounced, category, type, mode]);

  // A job opened from a link or notification may not be in the current filter.
  useEffect(() => {
    if (initialJobId && jobs && !jobs.some((j) => j.id === initialJobId))
      api.get<{ job: Job }>(`/jobs/${initialJobId}`).then((r) => setJobs((js) => [r.job, ...(js ?? [])])).catch(() => {});
  }, [initialJobId, jobs === null]);

  const selected = jobs?.find((j) => j.id === selectedId);
  const update = (j: Job) => setJobs((js) => js?.map((x) => (x.id === j.id ? j : x)) ?? null);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <div className="relative w-full lg:w-auto lg:flex-1 lg:min-w-[280px]">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <label htmlFor="job-q" className="sr-only">Search jobs</label>
          <input id="job-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Job title, skill, employer or state"
            className="w-full h-11 pl-10 pr-4 rounded-full border border-stone-300 bg-white text-[14px] focus:outline-none focus:border-ink" />
        </div>
        <label htmlFor="job-cat" className="sr-only">Category</label>
        <select id="job-cat" className={selectClass} value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {Object.entries(JOB_CATEGORY_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <label htmlFor="job-type" className="sr-only">Employment type</label>
        <select id="job-type" className={selectClass} value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">Any type</option>
          {Object.entries(JOB_TYPE_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <label htmlFor="job-mode" className="sr-only">Work mode</label>
        <select id="job-mode" className={selectClass} value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="">On-site or remote</option>
          {Object.entries(WORK_MODE_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      </div>

      {error && <Notice tone="error" className="mt-6">{error}</Notice>}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] gap-6 items-start">
        <ul className="space-y-2" aria-label="Job results">
          {jobs === null && !error && <li className="text-[13px] text-slate-500 py-6">Loading jobs…</li>}
          {jobs?.length === 0 && (
            <li className="rounded-3xl border border-dashed border-stone-300 p-8 text-center text-[13px] text-slate-500">
              No jobs match these filters. Try a wider search.
            </li>
          )}
          {jobs?.map((j, i) => (
            <React.Fragment key={j.id}>
            {i === Math.min(3, jobs.length - 1) && <li><SponsoredSlot placement="jobs" onNavigate={onNavigate} compact /></li>}
            <li>
              <button onClick={() => setSelectedId(j.id)} aria-current={selectedId === j.id}
                className={`w-full text-left rounded-2xl border p-4 transition-colors ${selectedId === j.id ? 'border-ink bg-white' : 'border-stone-200 bg-white hover:border-stone-400'}`}>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[15px] font-medium leading-snug">{j.title}</p>
                  {j.featured && <Pill tone="lime">Featured</Pill>}
                </div>
                <p className="text-[12px] text-slate-500 mt-1">{j.employer.name} · {j.location}</p>
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
                  <span className="font-mono-numbers">{payText(j, formatMoney)}</span>
                  <span className="text-slate-400">{JOB_TYPE_LABELS[j.employmentType]}</span>
                  {j.myApplication && <span className="text-emerald-700">Applied</span>}
                  {j.saved && <span className="text-slate-500">Saved</span>}
                </div>
              </button>
              {/* On phones the detail opens under the selected card. */}
              {selectedId === j.id && <div className="lg:hidden mt-2"><JobDetail job={j} onChange={update} onNavigate={onNavigate} toast={setToastMsg} /></div>}
            </li>
            </React.Fragment>
          ))}
        </ul>
        <div className="hidden lg:block sticky top-28">
          {selected ? <JobDetail job={selected} onChange={update} onNavigate={onNavigate} toast={setToastMsg} />
            : jobs && jobs.length > 0 && <p className="text-[13px] text-slate-500">Choose a job to see the details.</p>}
        </div>
      </div>
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg('')} />}
    </div>
  );
};
