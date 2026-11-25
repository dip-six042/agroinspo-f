import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Kicker, WRAP } from '../ui';
import { JobBoard } from './jobs/JobBoard';
import { JobEditor } from './jobs/JobEditor';
import { EmployerJobs } from './jobs/EmployerJobs';
import { MyApplications, CareerProfile } from './jobs/SeekerCareer';

/**
 * Jobs area. Sub-views come from the route: jobs | jobs:view:<id> | jobs:applications | jobs:profile |
 * jobs:mine | jobs:new | jobs:edit:<id>
 */
export const JobsView: React.FC<{ sub?: string; id?: string; onNavigate: (v: string) => void }> = ({ sub, id, onNavigate }) => {
  const { user } = useAuth();
  const isEmployer = !!user && ['farmer', 'business', 'admin'].includes(user.role);
  const tab = sub === 'new' || sub === 'edit' ? 'mine' : sub && ['applications', 'profile', 'mine'].includes(sub) ? sub : 'browse';

  const tabs = [
    { id: 'browse', label: 'Find jobs', view: 'jobs' },
    ...(user ? [{ id: 'applications', label: 'My applications', view: 'jobs:applications' }, { id: 'profile', label: 'Career profile & CV', view: 'jobs:profile' }] : []),
    ...(isEmployer ? [{ id: 'mine', label: 'My job listings', view: 'jobs:mine' }] : [])
  ];

  return (
    <div className={`${WRAP} py-12 sm:py-16`}>
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <Kicker>Jobs</Kicker>
          <h1 className="mt-4 font-display text-[34px] sm:text-[48px] font-normal leading-[1.05] tracking-[-0.03em] max-w-3xl">
            Agricultural jobs in every country. Always free to apply.
          </h1>
        </div>
        {!user ? (
          <button onClick={() => onNavigate('auth:signup:enthusiast')} className="self-start lg:self-auto h-11 px-5 rounded-full bg-lime hover:bg-lime-deep text-[13px] font-medium">
            Create a free jobseeker account
          </button>
        ) : isEmployer && tab === 'browse' ? (
          <button onClick={() => onNavigate('jobs:new')} className="self-start lg:self-auto h-11 px-5 rounded-full bg-ink text-white text-[13px] font-medium">
            Post a job
          </button>
        ) : null}
      </div>

      {tabs.length > 1 && (
        <div className="mt-8 flex border-b border-stone-200 gap-6 text-[13px] font-medium overflow-x-auto whitespace-nowrap" role="tablist">
          {tabs.map((t) => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => onNavigate(t.view)}
              className={`pb-3 transition-colors ${tab === t.id ? 'text-ink border-b-2 border-ink' : 'text-slate-500 hover:text-ink'}`}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      <div className="mt-8">
        {tab === 'browse' && <JobBoard onNavigate={onNavigate} initialJobId={sub === 'view' ? id : undefined} />}
        {tab === 'applications' && user && <MyApplications onNavigate={onNavigate} />}
        {tab === 'profile' && user && <CareerProfile />}
        {tab === 'mine' && (sub === 'new' || sub === 'edit' ? <JobEditor jobId={sub === 'edit' ? id : undefined} onNavigate={onNavigate} /> : <EmployerJobs onNavigate={onNavigate} />)}
      </div>
    </div>
  );
};
