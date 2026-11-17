import React, { useState } from 'react';
import { useRole } from '../../context/RoleContext';
import { useCurrency } from '../../context/CurrencyContext';
import { X, CheckCircle, Megaphone } from 'lucide-react';
import { HERO_IMAGE } from '../../data/mockData';

interface CreateAdModalProps {
  onClose: () => void;
}

export const CreateAdModal: React.FC<CreateAdModalProps> = ({ onClose }) => {
  const { createAdCampaign, currentUser } = useRole();
  const { formatMoney } = useCurrency();

  const [headline, setHeadline] = useState('High-Yield Hybrid Maize Seeds with Certified NASC Hologram');
  const [tagline, setTagline] = useState('Drought tolerant, 95% germination rate, nationwide delivery');
  const [targetCategory, setTargetCategory] = useState('Commercial Grain & Maize Growers');
  const [targetRegion, setTargetRegion] = useState('South-West & North-Central Nigeria');
  const [budgetDailyNGN, setBudgetDailyNGN] = useState(15000);
  const [isCreated, setIsCreated] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createAdCampaign({
      businessName: currentUser.name,
      headline,
      tagline,
      targetCategory,
      targetRegion,
      budgetDailyNGN,
      status: 'active',
      bannerImage: HERO_IMAGE
    });
    setIsCreated(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-canvas rounded-2xl max-w-lg w-full border border-stone-200 shadow-2xl overflow-hidden text-slate-900 max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50 shrink-0">
          <div>
            <h3 className="font-display font-medium text-base text-slate-900">
              Create Sponsored Ad Campaign
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Targeted across Agro Inspo ecosystem feed and specialist directories
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-stone-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isCreated ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-display font-medium text-lg text-slate-900">
                Campaign Launched!
              </h4>
              <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                "{headline}" is now live and tracking impressions, clicks, and farmer inquiries.
              </p>
            </div>
            <button
              onClick={onClose}
              className="py-2.5 px-6 bg-purple-800 hover:bg-purple-900 text-white rounded-full text-xs font-medium transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Ad Headline</label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="w-full text-xs py-2 px-3 border border-stone-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:border-purple-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Supporting Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full text-xs py-2 px-3 border border-stone-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:border-purple-600"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Target Farmers</label>
                <input
                  type="text"
                  value={targetCategory}
                  onChange={(e) => setTargetCategory(e.target.value)}
                  className="w-full text-xs py-2 px-3 border border-stone-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:border-purple-600"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Target Region</label>
                <input
                  type="text"
                  value={targetRegion}
                  onChange={(e) => setTargetRegion(e.target.value)}
                  className="w-full text-xs py-2 px-3 border border-stone-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:border-purple-600"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Daily Budget ({formatMoney(budgetDailyNGN)} / day)
              </label>
              <input
                type="number"
                value={budgetDailyNGN}
                onChange={(e) => setBudgetDailyNGN(Number(e.target.value))}
                step="2500"
                min="5000"
                className="w-full text-xs py-2 px-3 border border-stone-300 rounded-xl bg-white text-slate-900 font-mono-numbers focus:outline-none focus:border-purple-600"
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
                className="flex-1 py-2.5 px-4 bg-purple-800 hover:bg-purple-900 text-white rounded-full text-xs font-medium transition-colors shadow-sm"
              >
                Launch Campaign
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
