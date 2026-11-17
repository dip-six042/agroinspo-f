import React, { useEffect, useState } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { api, ApiError, Job, JOB_CATEGORY_LABELS, JOB_TYPE_LABELS, WORK_MODE_LABELS } from '../../../lib/api';
import { Button, Field, inputClass, Kicker, naira, Notice, selectClass, textareaClass } from '../../ui';
import { EmailVerifyBanner } from '../CommunityView';

interface Plan { id: string; label: string; days: number; priceNgn: number; description: string }

const blank = {
  title: '', description: '', responsibilities: '', qualifications: '', category: '', employmentType: 'full-time', workMode: 'onsite',
  location: '', payMin: '', payMax: '', payPeriod: 'month', openings: '1', closingDate: '', applyMethod: 'platform', externalUrl: ''
};

export const JobEditor: React.FC<{ jobId?: string; onNavigate: (v: string) => void }> = ({ jobId, onNavigate }) => {
  const { user } = useAuth();
  const [f, setF] = useState(blank);
  const [job, setJob] = useState<Job | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plan, setPlan] = useState('standard');
  const [step, setStep] = useState<'details' | 'plan'>('details');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<{ plans: Plan[] }>('/jobs/meta').then((r) => setPlans(r.plans)).catch(() => {});
    if (jobId)
      api.get<{ job: Job }>(`/jobs/${jobId}`).then(({ job: j }) => {
        setJob(j);
        setPlan(j.plan);
        setF({
          title: j.title, description: j.description, responsibilities: j.responsibilities.join('\n'), qualifications: j.qualifications.join('\n'),
          category: j.category, employmentType: j.employmentType, workMode: j.workMode, location: j.location,
          payMin: j.payMin?.toString() ?? '', payMax: j.payMax?.toString() ?? '', payPeriod: j.payPeriod ?? 'month',
          openings: String(j.openings), closingDate: j.closingDate, applyMethod: j.applyMethod, externalUrl: j.externalUrl
        });
      }).catch((e: ApiError) => setError(e.message));
  }, [jobId]);

  if (!user) return <Notice>Log in with a farm or business account to post jobs.</Notice>;
  if (!['farmer', 'business', 'admin'].includes(user.role))
    return <Notice>Only farm and business accounts can post jobs. Looking for work? Browse jobs and apply for free.</Notice>;

  const set = (k: keyof typeof blank) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const minDate = new Date().toISOString().slice(0, 10);
  const maxDate = new Date(Date.now() + 120 * 86400000).toISOString().slice(0, 10);

  const saveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const body = {
      ...f,
      responsibilities: f.responsibilities.split('\n'),
      qualifications: f.qualifications.split('\n'),
      payMin: f.payMin === '' ? null : Number(f.payMin),
      payMax: f.payMax === '' ? null : Number(f.payMax),
      payPeriod: f.payMin === '' && f.payMax === '' ? null : f.payPeriod,
      openings: Number(f.openings)
    };
    try {
      const r = job ? await api.patch<{ job: Job; reReview: boolean }>(`/jobs/${job.id}`, body) : await api.post<{ job: Job }>('/jobs', body);
      setJob(r.job);
      if (['draft', 'rejected', 'payment_pending'].includes(r.job.status)) setStep('plan');
      else onNavigate('jobs:mine');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Couldn’t save the listing.');
    } finally {
      setBusy(false);
    }
  };

  const checkout = async () => {
    if (!job) return;
    setBusy(true);
    setError('');
    try {
      const r = await api.post<{ status: string; checkoutUrl: string | null }>(`/jobs/${job.id}/checkout`, { plan });
      if (r.checkoutUrl) window.location.assign(r.checkoutUrl);
      else onNavigate('jobs:mine');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Couldn’t start the payment.');
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <button onClick={() => onNavigate('jobs:mine')} className="inline-flex items-center gap-2 text-[13px] text-slate-600 hover:text-ink">
        <ArrowLeft className="w-4 h-4" /> My job listings
      </button>
      <div className="mt-6"><Kicker>{step === 'details' ? 'Step 1 of 2 · Job details' : 'Step 2 of 2 · Choose a listing'}</Kicker></div>
      <h2 className="mt-3 font-display text-[30px] sm:text-[38px] font-normal leading-[1.1] tracking-[-0.02em]">
        {step === 'details' ? (job ? 'Edit your job listing' : 'Post a job') : 'How long should it run?'}
      </h2>
      <div className="mt-5"><EmailVerifyBanner /></div>
      {job?.status === 'rejected' && job.reviewNote && <Notice tone="error" className="mt-4">Reviewer’s note: {job.reviewNote}</Notice>}

      {step === 'details' ? (
        <form onSubmit={saveDetails} className="mt-8 space-y-5">
          <Field id="j-title" label="Job title"><input id="j-title" className={inputClass} value={f.title} onChange={set('title')} maxLength={120} required /></Field>
          <div className="grid sm:grid-cols-3 gap-4">
            <Field id="j-cat" label="Category">
              <select id="j-cat" className={`${selectClass} w-full`} value={f.category} onChange={set('category')} required>
                <option value="">Choose…</option>
                {Object.entries(JOB_CATEGORY_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </Field>
            <Field id="j-type" label="Employment type">
              <select id="j-type" className={`${selectClass} w-full`} value={f.employmentType} onChange={set('employmentType')}>
                {Object.entries(JOB_TYPE_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </Field>
            <Field id="j-mode" label="Work mode">
              <select id="j-mode" className={`${selectClass} w-full`} value={f.workMode} onChange={set('workMode')}>
                {Object.entries(WORK_MODE_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </Field>
          </div>
          <Field id="j-loc" label="Location" hint="Town and state, and whether housing is provided.">
            <input id="j-loc" className={inputClass} value={f.location} onChange={set('location')} maxLength={120} required />
          </Field>
          <Field id="j-desc" label="About the role" hint="At least 30 characters. Describe the farm or business, the work and the team.">
            <textarea id="j-desc" rows={6} className={textareaClass} value={f.description} onChange={set('description')} maxLength={6000} required />
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field id="j-resp" label="Responsibilities" hint="One per line.">
              <textarea id="j-resp" rows={4} className={textareaClass} value={f.responsibilities} onChange={set('responsibilities')} />
            </Field>
            <Field id="j-qual" label="Qualifications" hint="One per line.">
              <textarea id="j-qual" rows={4} className={textareaClass} value={f.qualifications} onChange={set('qualifications')} />
            </Field>
          </div>
          <fieldset className="grid sm:grid-cols-3 gap-4">
            <legend className="text-[13px] font-medium mb-1.5 col-span-full">Pay (₦) <span className="font-normal text-slate-500">· listings with pay get more applicants</span></legend>
            <label className="sr-only" htmlFor="j-min">Minimum pay</label>
            <input id="j-min" type="number" min={0} inputMode="numeric" placeholder="Minimum" className={inputClass} value={f.payMin} onChange={set('payMin')} />
            <label className="sr-only" htmlFor="j-max">Maximum pay</label>
            <input id="j-max" type="number" min={0} inputMode="numeric" placeholder="Maximum" className={inputClass} value={f.payMax} onChange={set('payMax')} />
            <label className="sr-only" htmlFor="j-per">Pay period</label>
            <select id="j-per" className={selectClass} value={f.payPeriod} onChange={set('payPeriod')}>
              <option value="day">per day</option><option value="month">per month</option><option value="year">per year</option><option value="project">per project</option>
            </select>
          </fieldset>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field id="j-open" label="Openings"><input id="j-open" type="number" min={1} max={500} className={inputClass} value={f.openings} onChange={set('openings')} /></Field>
            <Field id="j-close" label="Closing date"><input id="j-close" type="date" min={minDate} max={maxDate} className={inputClass} value={f.closingDate} onChange={set('closingDate')} required /></Field>
          </div>
          <fieldset>
            <legend className="text-[13px] font-medium mb-2">How should people apply?</legend>
            <div className="flex flex-wrap gap-2">
              {[['platform', 'On Agro Inspo (recommended)'], ['external', 'On our own website']].map(([v, l]) => (
                <label key={v} className={`flex items-center gap-2 h-10 px-4 rounded-full border text-[13px] cursor-pointer ${f.applyMethod === v ? 'border-ink' : 'border-stone-300'}`}>
                  <input type="radio" name="apply" value={v} checked={f.applyMethod === v} onChange={set('applyMethod')} className="accent-[#141414]" />{l}
                </label>
              ))}
            </div>
            {f.applyMethod === 'external' && (
              <input aria-label="Application link" type="url" placeholder="https://" className={`${inputClass} mt-3`} value={f.externalUrl} onChange={set('externalUrl')} />
            )}
          </fieldset>
          <Notice>Listings are reviewed before they go live. Never ask candidates to pay a fee to apply, train or attend an interview.</Notice>
          {error && <Notice tone="error">{error}</Notice>}
          <Button type="submit" variant="lime" busy={busy} className="h-12 px-7">{job ? 'Save and continue' : 'Continue'}</Button>
        </form>
      ) : (
        <div className="mt-8">
          <div className="grid sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Listing plan">
            {plans.map((p) => (
              <button key={p.id} role="radio" aria-checked={plan === p.id} onClick={() => setPlan(p.id)}
                className={`relative text-left rounded-3xl border p-6 transition-colors ${plan === p.id ? 'border-ink bg-white' : 'border-stone-200 bg-white hover:border-stone-400'}`}>
                {plan === p.id && <span className="absolute top-4 right-4 w-6 h-6 rounded-full bg-lime flex items-center justify-center"><Check className="w-3.5 h-3.5" /></span>}
                <p className="text-[15px] font-medium">{p.label}</p>
                <p className="mt-3 font-display text-[34px] leading-none font-mono-numbers">{naira(p.priceNgn)}</p>
                <p className="mt-3 text-[13px] text-slate-500 leading-relaxed">{p.description}</p>
              </button>
            ))}
          </div>
          <div className="mt-6 rounded-2xl bg-mist p-5 text-[13px] leading-relaxed text-slate-700">
            <p><span className="font-medium text-ink">What happens next:</span> you pay securely through Kora, we review the listing (usually within one working day), and it goes live for {plans.find((p) => p.id === plan)?.days ?? 30} days from approval.</p>
            <p className="mt-2">If we ask for changes, you can edit and resubmit at no extra cost. If we can’t publish it, contact support about a refund.</p>
          </div>
          {error && <Notice tone="error" className="mt-4">{error}</Notice>}
          <div className="mt-6 flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setStep('details')}>Back to details</Button>
            <Button variant="lime" busy={busy} onClick={checkout} className="px-7">
              Pay {naira(plans.find((p) => p.id === plan)?.priceNgn ?? 0)} and submit
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
