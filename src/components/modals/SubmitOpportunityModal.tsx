import React, { useState } from 'react';
import { useRole } from '../../context/RoleContext';
import { useCurrency } from '../../context/CurrencyContext';
import { X, CheckCircle, ShieldCheck, AlertCircle } from 'lucide-react';
import { CASSAVA_FARM_IMAGE } from '../../data/mockData';

interface SubmitOpportunityModalProps {
  onClose: () => void;
}

export const SubmitOpportunityModal: React.FC<SubmitOpportunityModalProps> = ({ onClose }) => {
  const { submitFarmOpportunity } = useRole();
  const { formatMoney } = useCurrency();

  const [farmName, setFarmName] = useState('GreenPeak Commercial Agro Ltd');
  const [title, setTitle] = useState('Mechanized Soybean & Yellow Maize Cluster Expansion');
  const [location, setLocation] = useState('Iseyin, Oyo State');
  const [cropOrLivestock, setCropOrLivestock] = useState('Soybeans & Yellow Maize');
  const [hectares, setHectares] = useState(60);
  const [fundingTargetNGN, setFundingTargetNGN] = useState(12000000);
  const [durationMonths, setDurationMonths] = useState(8);
  const [projectedReturnRange, setProjectedReturnRange] = useState('16% – 20% (Target Harvest Return)');
  const [summary, setSummary] = useState(
    'Expansion of 60 hectares contiguous arable land for certified non-GMO soybean and hybrid yellow maize with guaranteed industrial feed-mill offtake.'
  );
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitFarmOpportunity({
      farmName,
      title,
      location,
      cropOrLivestock,
      hectares,
      fundingTargetNGN,
      durationMonths,
      projectedReturnRange,
      riskRating: 'Medium',
      summary,
      useOfFunds: [
        { item: 'Land preparation & ridging', percentage: 30 },
        { item: 'Certified seeds & basal fertilizer', percentage: 40 },
        { item: 'Pest monitoring & farm logistics', percentage: 20 },
        { item: 'Crop loss index insurance', percentage: 10 }
      ],
      milestonesCount: 4,
      farmImage: CASSAVA_FARM_IMAGE
    });
    setIsSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-canvas rounded-2xl max-w-lg w-full border border-stone-200 shadow-2xl overflow-hidden text-slate-900 max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50 shrink-0">
          <div>
            <h3 className="font-display font-medium text-base text-slate-900">
              Submit Farm Opportunity Proposal
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Subject to compliance review before public investor visibility
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
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-display font-medium text-lg text-slate-900">
                Proposal Submitted for Compliance Review
              </h4>
              <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto leading-relaxed">
                Your farm opportunity "{title}" is now in the administrative review queue. A platform compliance officer will verify your land title documentation and offtake contracts.
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
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>
                Investment funds are subject to strict Nigerian regulatory guidelines. Unapproved opportunities remain private and cannot solicit capital.
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Project Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-xs py-2 px-3 border border-stone-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:border-ink"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Farm Name</label>
                <input
                  type="text"
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  className="w-full text-xs py-2 px-3 border border-stone-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:border-ink"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Farm Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full text-xs py-2 px-3 border border-stone-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:border-ink"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Acreage (Ha)</label>
                <input
                  type="number"
                  value={hectares}
                  onChange={(e) => setHectares(Number(e.target.value))}
                  className="w-full text-xs py-2 px-3 border border-stone-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:border-ink font-mono-numbers"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Target Capital</label>
                <input
                  type="number"
                  value={fundingTargetNGN}
                  onChange={(e) => setFundingTargetNGN(Number(e.target.value))}
                  step="500000"
                  className="w-full text-xs py-2 px-3 border border-stone-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:border-ink font-mono-numbers"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Duration (Mos)</label>
                <input
                  type="number"
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(Number(e.target.value))}
                  className="w-full text-xs py-2 px-3 border border-stone-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:border-ink font-mono-numbers"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Project Summary & Financial Assumptions
              </label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={3}
                className="w-full text-xs p-3 border border-stone-300 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:border-ink resize-none leading-relaxed"
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
                className="flex-1 py-2.5 px-4 bg-ink hover:bg-black text-white rounded-full text-xs font-medium transition-colors shadow-sm"
              >
                Submit Proposal
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
