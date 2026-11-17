import React, { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { api, ApiError, APPLICATION_STATUS_LABELS, Job, timeAgo, uploadFile } from '../../../lib/api';
import { Button, Field, inputClass, Notice, Pill, textareaClass, Toast } from '../../ui';

interface Application { id: string; jobId: string; title: string; employer: string; location: string; status: string; jobStatus: string; createdAt: string; updatedAt: string }

const appTone = (s: string) => (['shortlisted', 'interview', 'offered', 'hired'].includes(s) ? 'good' : s === 'rejected' || s === 'withdrawn' ? 'neutral' : 'warn') as 'good' | 'neutral' | 'warn';

export const MyApplications: React.FC<{ onNavigate: (v: string) => void }> = ({ onNavigate }) => {
  const [apps, setApps] = useState<Application[] | null>(null);
  const [saved, setSaved] = useState<Job[]>([]);
  const [error, setError] = useState('');
  const load = () => {
    api.get<{ applications: Application[] }>('/me/applications').then((r) => setApps(r.applications)).catch((e: ApiError) => setError(e.message));
    api.get<{ jobs: Job[] }>('/me/saved-jobs').then((r) => setSaved(r.jobs)).catch(() => {});
  };
  useEffect(load, []);
  const withdraw = async (id: string) => {
    await api.post(`/applications/${id}/withdraw`).catch(() => {});
    load();
  };
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-10">
      <section>
        <h3 className="text-[15px] font-medium">Applications</h3>
        {error && <Notice tone="error" className="mt-3">{error}</Notice>}
        {apps?.length === 0 && <Notice className="mt-3">You haven’t applied for anything yet. Applying is always free.</Notice>}
        <ul className="mt-3 border-t border-stone-200">
          {apps?.map((a) => (
            <li key={a.id} className="py-4 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3">
              <button className="text-left min-w-0" onClick={() => onNavigate(`jobs:view:${a.jobId}`)}>
                <p className="text-[14px] font-medium hover:underline underline-offset-4">{a.title}</p>
                <p className="text-[12px] text-slate-500">{a.employer} · {a.location} · applied {timeAgo(a.createdAt)}</p>
              </button>
              <div className="flex items-center gap-3">
                <Pill tone={appTone(a.status)}>{APPLICATION_STATUS_LABELS[a.status]}</Pill>
                {!['hired', 'rejected', 'withdrawn'].includes(a.status) && (
                  <button onClick={() => withdraw(a.id)} className="text-[12px] text-slate-500 hover:text-ink underline underline-offset-4">Withdraw</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
      <aside>
        <h3 className="text-[15px] font-medium">Saved jobs</h3>
        {saved.length === 0 ? (
          <p className="mt-3 text-[13px] text-slate-500">Tap Save on any job to keep it here.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {saved.map((j) => (
              <li key={j.id}>
                <button onClick={() => onNavigate(`jobs:view:${j.id}`)} className="w-full text-left rounded-2xl bg-mist p-4 hover:bg-stone-200/70">
                  <p className="text-[13px] font-medium">{j.title}</p>
                  <p className="text-[12px] text-slate-500">{j.employer.name} · closes {j.closingDate}</p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
};

interface Profile { headline: string; skills: string[]; experience: string; qualifications: string; preferredLocations: string; visibility: 'employers' | 'hidden'; jobAlerts: boolean; cv: { id: string; filename: string; sizeBytes: number; uploadedAt: string } | null }

export const CareerProfile: React.FC = () => {
  const [p, setP] = useState<Profile | null>(null);
  const [skills, setSkills] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<{ profile: Profile }>('/me/jobseeker').then((r) => (setP(r.profile), setSkills(r.profile.skills.join(', ')))).catch((e: ApiError) => setError(e.message));
  }, []);
  if (!p) return error ? <Notice tone="error">{error}</Notice> : <p className="text-[13px] text-slate-500">Loading…</p>;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const r = await api.put<{ profile: Profile }>('/me/jobseeker', { ...p, skills: skills.split(',').map((s) => s.trim()).filter(Boolean) });
      setP(r.profile);
      setMsg('Career profile saved.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Couldn’t save.');
    } finally {
      setBusy(false);
    }
  };
  const upload = async (f?: File) => {
    if (!f) return;
    setError('');
    try {
      const r = await uploadFile<{ file: { id: string; filename: string; sizeBytes: number } }>('/files/cv', f);
      setP({ ...p, cv: { ...r.file, uploadedAt: new Date().toISOString() } });
      setMsg('CV uploaded.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Upload failed.');
    }
  };

  return (
    <form onSubmit={save} className="max-w-2xl space-y-5">
      <div className="rounded-2xl bg-mist p-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5" />
          <div>
            <p className="text-[14px] font-medium">{p.cv ? p.cv.filename : 'No CV uploaded'}</p>
            <p className="text-[12px] text-slate-500">{p.cv ? `${Math.round(p.cv.sizeBytes / 1024)} KB · ${timeAgo(p.cv.uploadedAt)}` : 'PDF or Word, up to 5 MB. Only employers you apply to can open it.'}</p>
          </div>
        </div>
        <label className="inline-flex items-center h-10 px-4 rounded-full border border-stone-300 bg-white text-[13px] cursor-pointer hover:border-ink">
          {p.cv ? 'Replace' : 'Upload CV'}
          <input type="file" className="sr-only" accept=".pdf,.doc,.docx" onChange={(e) => upload(e.target.files?.[0])} />
        </label>
      </div>
      <Field id="cp-head" label="Headline"><input id="cp-head" className={inputClass} value={p.headline} onChange={(e) => setP({ ...p, headline: e.target.value })} placeholder="e.g. Poultry attendant, 3 years with layers" maxLength={120} /></Field>
      <Field id="cp-skills" label="Skills" hint="Separate with commas."><input id="cp-skills" className={inputClass} value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Vaccination, record keeping, tractor driving" /></Field>
      <Field id="cp-exp" label="Experience"><textarea id="cp-exp" rows={4} className={textareaClass} value={p.experience} onChange={(e) => setP({ ...p, experience: e.target.value })} maxLength={4000} /></Field>
      <Field id="cp-qual" label="Qualifications"><textarea id="cp-qual" rows={3} className={textareaClass} value={p.qualifications} onChange={(e) => setP({ ...p, qualifications: e.target.value })} maxLength={2000} /></Field>
      <Field id="cp-loc" label="Where you’d like to work"><input id="cp-loc" className={inputClass} value={p.preferredLocations} onChange={(e) => setP({ ...p, preferredLocations: e.target.value })} placeholder="Oyo, Ogun, remote" /></Field>
      <label className="flex items-start gap-3 text-[13px]">
        <input type="checkbox" className="mt-1 w-4 h-4 accent-[#141414]" checked={p.jobAlerts} onChange={(e) => setP({ ...p, jobAlerts: e.target.checked })} />
        <span>Send me alerts when new jobs are published</span>
      </label>
      <label className="flex items-start gap-3 text-[13px]">
        <input type="checkbox" className="mt-1 w-4 h-4 accent-[#141414]" checked={p.visibility === 'employers'} onChange={(e) => setP({ ...p, visibility: e.target.checked ? 'employers' : 'hidden' })} />
        <span>Let employers discover my profile when candidate search launches <span className="text-slate-500">(your CV is only ever shared with employers you apply to)</span></span>
      </label>
      {error && <Notice tone="error">{error}</Notice>}
      <Button type="submit" variant="lime" busy={busy}>Save career profile</Button>
      {msg && <Toast message={msg} onClose={() => setMsg('')} />}
    </form>
  );
};
