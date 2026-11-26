import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApiError, firstName, GOAL_LABELS, TOPIC_LABELS } from '../../lib/api';
import { Button, Chip, Field, inputClass, Kicker, Notice } from '../ui';
import { PlaceFields, usePlace } from '../PlaceFields';
import { EmailVerifyBanner } from './CommunityView';

const TITLE_HINT: Record<string, string> = {
  enthusiast: 'e.g. Agriculture student, UNILAG',
  farmer: 'e.g. Owner, GreenPeak Farms (120 ha)',
  specialist: 'e.g. Soil scientist, 12 years',
  business: 'e.g. Seed and irrigation supplier',
  admin: ''
};

export const OnboardingView: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const { user, updateMe } = useAuth();
  const [interests, setInterests] = useState<string[]>(user?.interests ?? []);
  const [goals, setGoals] = useState<string[]>(user?.goals ?? []);
  const place = usePlace(user?.location ?? '', user?.country ?? '');
  const [title, setTitle] = useState(user?.title ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!user) return null;
  const toggle = (list: string[], set: (v: string[]) => void, v: string) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const finish = async () => {
    setError('');
    if (!interests.length) return setError('Pick at least one interest so we can tailor your feed.');
    setBusy(true);
    try {
      await updateMe({ interests, goals, location: place.location, country: place.country, title, completeOnboarding: true });
      onDone();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Couldn’t save. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-[880px] mx-auto px-4 sm:px-8 py-12 sm:py-16">
      <Kicker>Step 2 of 2 · Set up your account</Kicker>
      <h1 className="mt-4 font-display font-normal text-[34px] sm:text-[48px] leading-[1.05] tracking-[-0.03em]">
        Welcome, {firstName(user.name)}. What are you into?
      </h1>
      <p className="mt-4 text-[15px] text-slate-500 max-w-xl">
        Your interests shape your feed, event suggestions and job alerts. Your city or state places you in a country, and you can still use resources from every other country.
      </p>

      <div className="mt-6">
        <EmailVerifyBanner />
      </div>

      <section className="mt-10">
        <h2 className="text-[15px] font-medium">Interests</h2>
        <p className="text-[13px] text-slate-500 mt-1">Choose at least one.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {Object.entries(TOPIC_LABELS).map(([k, label]) => (
            <Chip key={k} selected={interests.includes(k)} onClick={() => toggle(interests, setInterests, k)}>
              {label}
            </Chip>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-[15px] font-medium">Goals</h2>
        <p className="text-[13px] text-slate-500 mt-1">Optional. Helps us recommend events, experts and jobs.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {Object.entries(GOAL_LABELS).map(([k, label]) => (
            <Chip key={k} selected={goals.includes(k)} onClick={() => toggle(goals, setGoals, k)}>
              {label}
            </Chip>
          ))}
        </div>
      </section>

      <section className="mt-10 grid sm:grid-cols-2 gap-5">
        <Field id="ob-title" label="Headline" hint={TITLE_HINT[user.role]}>
          <input id="ob-title" className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
        </Field>
        <PlaceFields idPrefix="ob" location={place.location} country={place.country} onLocation={place.onLocation} onCountry={place.onCountry} options={place.options} />
      </section>

      {error && <Notice tone="error" className="mt-8">{error}</Notice>}

      <div className="mt-10 pt-8 border-t border-stone-200 flex flex-wrap items-center gap-4">
        <Button variant="lime" busy={busy} onClick={finish} className="h-12 px-7 text-[14px]">
          Finish and open my feed
        </Button>
        <span className="text-[13px] text-slate-500">{interests.length} interest{interests.length === 1 ? '' : 's'} selected</span>
      </div>
    </div>
  );
};
