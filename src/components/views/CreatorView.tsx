import React, { useEffect, useState } from 'react';
import { Award } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api, ApiError, TOPIC_LABELS } from '../../lib/api';
import { Button, Kicker, Notice, Pill, selectClass, textareaClass, WRAP } from '../ui';

interface MyCreator {
  topics: { topic: string; approvedAt: string; reviewBy: string }[];
  applications: { id: string; topic: string; status: string; score: number; note: string; retestAfter: string | null; createdAt: string }[];
}
interface Quiz { topic: string; passPct: number; interviewNote: string; questions: { id: string; q: string; options: string[] }[] }

const APP_LABELS: Record<string, [string, 'neutral' | 'warn' | 'good' | 'bad']> = {
  pending: ['In review', 'warn'], info_requested: ['More info needed', 'warn'], approved: ['Approved', 'good'],
  rejected: ['Not approved', 'bad'], failed_quiz: ['Quiz not passed', 'bad']
};

export const CreatorView: React.FC<{ onNavigate: (v: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [me, setMe] = useState<MyCreator | null>(null);
  const [topic, setTopic] = useState('');
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [sample, setSample] = useState('');
  const [terms, setTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ status: string; score: number; passPct: number; correct: number; total: number } | null>(null);

  const load = () => api.get<MyCreator>('/me/creator').then(setMe).catch((e: ApiError) => setError(e.message));
  useEffect(() => {
    if (user) load();
  }, [user?.id]);
  useEffect(() => {
    setQuiz(null);
    setAnswers({});
    setResult(null);
    if (topic) api.get<Quiz>(`/creator/quiz/${topic}`).then(setQuiz).catch((e: ApiError) => setError(e.message));
  }, [topic]);

  if (!user) return <div className={`${WRAP} py-20`}><Notice>Log in to apply for creator screening.</Notice></div>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const r = await api.post<{ application: typeof result }>('/creator/applications', { topic, answers, sample, acceptTerms: terms });
      setResult(r.application);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Couldn’t submit.');
    } finally {
      setBusy(false);
    }
  };
  const approved = new Set(me?.topics.map((t) => t.topic));
  const answered = quiz ? quiz.questions.every((q) => answers[q.id] !== undefined) : false;

  return (
    <div className={`${WRAP} py-12 sm:py-16 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-10`}>
      <div>
        <Kicker>Creator screening</Kicker>
        <h1 className="mt-4 font-display text-[34px] sm:text-[48px] font-normal leading-[1.05] tracking-[-0.03em]">Publish articles and books on a topic you know.</h1>
        <p className="mt-4 text-[15px] text-slate-600 max-w-2xl leading-relaxed">
          Pick one topic, answer a short knowledge check and send a writing sample. A reviewer reads every sample. If approved, you get a screened-creator badge for that topic and can publish long-form articles and books on it.
        </p>
        <Notice className="mt-5">Passing is a check of basic knowledge and honest practice. It isn’t a licence, degree or professional accreditation, and your badge will say so.</Notice>

        {result ? (
          <div className="mt-8 rounded-3xl border border-stone-200 bg-white p-6">
            {result.status === 'pending' ? (
              <>
                <p className="text-[18px] font-medium">You passed: {result.correct} of {result.total} correct.</p>
                <p className="mt-2 text-[14px] text-slate-600">Your sample is with a reviewer. We’ll notify you when there’s a decision, usually within 3 working days.</p>
              </>
            ) : (
              <>
                <p className="text-[18px] font-medium">You scored {result.score}%. The pass mark is {result.passPct}%.</p>
                <p className="mt-2 text-[14px] text-slate-600">You can take the check again for this topic in 7 days. Your sample is saved with the application.</p>
              </>
            )}
            <Button className="mt-4" variant="outline" onClick={() => (setTopic(''), setResult(null))}>Done</Button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-8">
            <div>
              <label htmlFor="cr-topic" className="text-[13px] font-medium">Topic</label>
              <select id="cr-topic" className={`${selectClass} mt-1.5 w-full sm:w-80 block`} value={topic} onChange={(e) => setTopic(e.target.value)}>
                <option value="">Choose a topic</option>
                {Object.entries(TOPIC_LABELS).map(([k, l]) => <option key={k} value={k} disabled={approved.has(k)}>{l}{approved.has(k) ? ' (approved)' : ''}</option>)}
              </select>
            </div>
            {quiz && (
              <>
                {quiz.interviewNote && <Notice>{quiz.interviewNote}</Notice>}
                <ol className="space-y-6">
                  {quiz.questions.map((q, i) => (
                    <li key={q.id}>
                      <fieldset>
                        <legend className="text-[14px] font-medium">{i + 1}. {q.q}</legend>
                        <div className="mt-2 space-y-1.5">
                          {q.options.map((o, oi) => (
                            <label key={oi} className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-[13px] cursor-pointer ${answers[q.id] === oi ? 'border-ink bg-mist' : 'border-stone-200 hover:border-stone-400'}`}>
                              <input type="radio" name={q.id} className="mt-0.5 accent-[#141414]" checked={answers[q.id] === oi} onChange={() => setAnswers({ ...answers, [q.id]: oi })} />
                              {o}
                            </label>
                          ))}
                        </div>
                      </fieldset>
                    </li>
                  ))}
                </ol>
                <div>
                  <label htmlFor="cr-sample" className="text-[13px] font-medium">Writing sample</label>
                  <p className="text-[12px] text-slate-500">200–5,000 characters. Explain something practical for farmers on this topic, the way you would in an article. {sample.length} characters.</p>
                  <textarea id="cr-sample" rows={8} className={`${textareaClass} mt-1.5`} value={sample} onChange={(e) => setSample(e.target.value)} />
                </div>
                <label className="flex items-start gap-3 text-[13px]">
                  <input type="checkbox" className="mt-1 w-4 h-4 accent-[#141414]" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
                  <span>I’ll label sponsored content, cite sources for claims, never give unsafe chemical or veterinary advice, and accept that my badge can be removed if I break the Creator Policy.</span>
                </label>
                {error && <Notice tone="error">{error}</Notice>}
                <Button type="submit" variant="lime" busy={busy} disabled={!answered || sample.length < 200 || !terms}>Submit application</Button>
              </>
            )}
          </form>
        )}
      </div>

      <aside className="space-y-4">
        <div className="rounded-3xl bg-mist p-6">
          <div className="flex items-center gap-2"><Award className="w-4 h-4" /><h2 className="text-[15px] font-medium">Your topics</h2></div>
          {me?.topics.length ? (
            <ul className="mt-3 space-y-2 text-[13px]">
              {me.topics.map((t) => <li key={t.topic} className="flex justify-between"><span>{TOPIC_LABELS[t.topic]}</span><span className="text-slate-500">Review by {t.reviewBy.slice(0, 10)}</span></li>)}
            </ul>
          ) : <p className="mt-3 text-[13px] text-slate-500">None yet.</p>}
          {!!me?.topics.length && <Button className="mt-4 w-full" variant="outline" onClick={() => onNavigate('community')}>Write an article</Button>}
        </div>
        {!!me?.applications.length && (
          <div className="rounded-3xl border border-stone-200 bg-white p-6">
            <h2 className="text-[15px] font-medium">Applications</h2>
            <ul className="mt-3 space-y-3 text-[13px]">
              {me.applications.map((a) => (
                <li key={a.id}>
                  <div className="flex justify-between gap-2"><span>{TOPIC_LABELS[a.topic]} · {a.score}%</span><Pill tone={APP_LABELS[a.status]?.[1]}>{APP_LABELS[a.status]?.[0] ?? a.status}</Pill></div>
                  {a.note && <p className="mt-1 text-[12px] text-slate-600">{a.note}</p>}
                  {a.retestAfter && a.status !== 'approved' && <p className="text-[11px] text-slate-500">Can reapply after {a.retestAfter.slice(0, 10)}</p>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
    </div>
  );
};
