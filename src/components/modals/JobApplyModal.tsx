import React, { useState } from 'react';
import { JobListing } from '../../types';
import { useRole } from '../../context/RoleContext';
import { useCurrency } from '../../context/CurrencyContext';
import { X, CheckCircle, Upload, Briefcase, Building } from 'lucide-react';

interface JobApplyModalProps {
  job: JobListing;
  onClose: () => void;
}

export const JobApplyModal: React.FC<JobApplyModalProps> = ({ job, onClose }) => {
  const { applyForJob, currentUser } = useRole();
  const { formatMoney } = useCurrency();

  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [phone, setPhone] = useState(currentUser.phone);
  const [experienceSummary, setExperienceSummary] = useState(
    'B.Agric graduate with 2+ years field experience managing yellow maize plots, tractor schedules, and pest scouting.'
  );
  const [cvFileName, setCvFileName] = useState('Tunde_Alabi_Agric_CV_2026.pdf');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyForJob(job.id, {
      name,
      email,
      phone,
      experienceSummary,
      cvFileName
    });
    setIsSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-canvas rounded-2xl max-w-lg w-full border border-stone-200 shadow-2xl overflow-hidden text-slate-900">
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div>
            <h3 className="font-display font-medium text-base text-slate-900">
              Apply for Agricultural Role
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Direct application to {job.companyName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-stone-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-display font-medium text-lg text-slate-900">
                Application Received!
              </h4>
              <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                Your profile and CV were submitted to {job.companyName} for the {job.title} role.
              </p>
            </div>
            <p className="text-[11px] text-slate-500">
              Track status updates in your Enthusiast Hub & notifications feed. Candidates are never charged an application fee.
            </p>
            <button
              onClick={onClose}
              className="py-2.5 px-6 bg-emerald-800 hover:bg-emerald-900 text-white rounded-full text-xs font-medium transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="p-3 bg-stone-100/70 border border-stone-200 rounded-xl space-y-1">
              <span className="font-medium text-xs text-slate-900">{job.title}</span>
              <div className="flex items-center gap-2 text-[11px] text-slate-600">
                <span>{job.companyName}</span>
                <span>·</span>
                <span>{job.location}</span>
                <span>·</span>
                <span className="font-mono-numbers font-medium text-emerald-800">
                  {formatMoney(job.salaryMinNGN)} – {formatMoney(job.salaryMaxNGN)} / {job.salaryPeriod}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs py-2 px-3 border border-stone-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:border-emerald-600"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Phone (WhatsApp)</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs py-2 px-3 border border-stone-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:border-emerald-600"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs py-2 px-3 border border-stone-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:border-emerald-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Field Experience & Qualifications Summary
              </label>
              <textarea
                value={experienceSummary}
                onChange={(e) => setExperienceSummary(e.target.value)}
                rows={3}
                className="w-full text-xs p-3 border border-stone-300 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 resize-none leading-relaxed"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Attached CV / Credentials</label>
              <div className="flex items-center justify-between p-3 border border-dashed border-stone-300 rounded-xl bg-white text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <Briefcase className="w-4 h-4 text-emerald-800" />
                  <span className="font-medium text-slate-900">{cvFileName}</span>
                </div>
                <span className="text-[11px] text-emerald-700 font-medium">Ready to Submit</span>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 border border-stone-300 hover:bg-stone-100 rounded-full text-xs font-medium text-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white rounded-full text-xs font-medium transition-colors shadow-sm"
              >
                Submit Application (Free)
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
