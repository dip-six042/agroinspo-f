import React, { useState } from 'react';
import { useRole } from '../../context/RoleContext';
import { useCurrency } from '../../context/CurrencyContext';
import { X, CheckCircle, Briefcase } from 'lucide-react';

interface PostJobModalProps {
  onClose: () => void;
}

export const PostJobModal: React.FC<PostJobModalProps> = ({ onClose }) => {
  const { postJob, currentUser } = useRole();
  const { formatMoney } = useCurrency();

  const [title, setTitle] = useState('Assistant Commercial Farm Manager');
  const [location, setLocation] = useState('Iseyin, Oyo State');
  const [employmentType, setEmploymentType] = useState<'Full-time' | 'Contract' | 'Seasonal' | 'Part-time'>('Full-time');
  const [category, setCategory] = useState('Farm Management');
  const [salaryMinNGN, setSalaryMinNGN] = useState(250000);
  const [salaryMaxNGN, setSalaryMaxNGN] = useState(380000);
  const [description, setDescription] = useState(
    'Supervise tractor crews, spray schedules, and daily crop health inspection across commercial acreage.'
  );
  const [requirementsText, setRequirementsText] = useState(
    'B.Agric or HND in Agronomy\n2+ years commercial farm experience\nKnowledge of boom sprayers and fertilizer calibration'
  );
  const [isPosted, setIsPosted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    postJob({
      title,
      companyName: currentUser.name,
      companyType: currentUser.role === 'business' ? 'business' : 'farm',
      isCompanyVerified: true,
      location,
      employmentType,
      category,
      salaryMinNGN,
      salaryMaxNGN,
      salaryPeriod: 'month',
      description,
      requirements: requirementsText.split('\n').filter((l) => l.trim().length > 0),
      responsibilities: ['Oversee morning field deployment', 'Track chemical stock and tractor hours'],
      deadline: '2026-11-30'
    });
    setIsPosted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-canvas rounded-2xl max-w-lg w-full border border-stone-200 shadow-2xl overflow-hidden text-slate-900 max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50 shrink-0">
          <div>
            <h3 className="font-display font-medium text-base text-slate-900">
              Post Agricultural Job Vacancy
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Published directly to verified agricultural candidates
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-stone-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isPosted ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-display font-medium text-lg text-slate-900">
                Job Successfully Published!
              </h4>
              <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                Candidates can now discover and apply for "{title}". Applications will appear in your employer portal.
              </p>
            </div>
            <button
              onClick={onClose}
              className="py-2.5 px-6 bg-emerald-800 hover:bg-emerald-900 text-white rounded-full text-xs font-medium transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Job Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-xs py-2 px-3 border border-stone-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:border-emerald-600"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full text-xs py-2 px-3 border border-stone-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:border-emerald-600"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Employment Type</label>
                <select
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value as any)}
                  className="w-full text-xs py-2 px-3 border border-stone-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:border-emerald-600"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Seasonal">Seasonal</option>
                  <option value="Part-time">Part-time</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Monthly Min Salary</label>
                <input
                  type="number"
                  value={salaryMinNGN}
                  onChange={(e) => setSalaryMinNGN(Number(e.target.value))}
                  step="10000"
                  className="w-full text-xs py-2 px-3 border border-stone-300 rounded-xl bg-white text-slate-900 font-mono-numbers focus:outline-none focus:border-emerald-600"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Monthly Max Salary</label>
                <input
                  type="number"
                  value={salaryMaxNGN}
                  onChange={(e) => setSalaryMaxNGN(Number(e.target.value))}
                  step="10000"
                  className="w-full text-xs py-2 px-3 border border-stone-300 rounded-xl bg-white text-slate-900 font-mono-numbers focus:outline-none focus:border-emerald-600"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Job Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full text-xs p-3 border border-stone-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:border-emerald-600 resize-none leading-relaxed"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Candidate Requirements (One per line)
              </label>
              <textarea
                value={requirementsText}
                onChange={(e) => setRequirementsText(e.target.value)}
                rows={3}
                className="w-full text-xs p-3 border border-stone-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:border-emerald-600 resize-none leading-relaxed font-mono-numbers text-[11px]"
                required
              />
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
                Publish Listing
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
