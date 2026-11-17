import React, { useState } from 'react';
import { useRole } from '../../context/RoleContext';
import { useCurrency } from '../../context/CurrencyContext';
import {
  Store,
  TrendingUp,
  Megaphone,
  PlusCircle,
  Eye,
  MousePointer,
  Users,
  ShieldCheck,
  CheckCircle,
  Package,
  Calendar,
  Sparkles
} from 'lucide-react';
import { HERO_IMAGE } from '../../data/mockData';

interface BusinessPortalProps {
  onPostJobModal: () => void;
  onCreateAdModal: () => void;
}

export const BusinessPortal: React.FC<BusinessPortalProps> = ({ onPostJobModal, onCreateAdModal }) => {
  const { currentUser, adCampaigns, jobs } = useRole();
  const { formatMoney } = useCurrency();

  const [activeTab, setActiveTab] = useState<'campaigns' | 'products' | 'jobs' | 'sponsorships'>('campaigns');

  const businessJobs = jobs.filter((j) => j.companyType === 'business');

  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-8 lg:px-12 py-8 space-y-8">
      {/* Business Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-purple-600/30"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-normal text-[22px] tracking-[-0.015em] text-ink">{currentUser.name}</h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-purple-50 text-purple-900 border border-purple-200 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
                {currentUser.verificationBadgeText}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{currentUser.title} · {currentUser.location}</p>
            <p className="text-xs text-slate-600 mt-1 max-w-xl">{currentUser.bio}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            onClick={onCreateAdModal}
            className="py-2 px-3.5 bg-purple-800 hover:bg-purple-900 text-white rounded-full text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>Launch Sponsored Ad</span>
          </button>
          <button
            onClick={onPostJobModal}
            className="py-2 px-3.5 bg-stone-100 hover:bg-stone-200 text-slate-800 rounded-full text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Post Business Role</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-stone-200 gap-6 text-[13px] font-medium overflow-x-auto whitespace-nowrap [scrollbar-width:none]" role="tablist">
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`pb-3 transition-colors ${
            activeTab === 'campaigns'
              ? 'text-ink font-medium border-b-2 border-ink'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Active Ad Campaigns ({adCampaigns.length})
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 transition-colors ${
            activeTab === 'products'
              ? 'text-ink font-medium border-b-2 border-ink'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Verified Products & Input Showroom
        </button>
        <button
          onClick={() => setActiveTab('jobs')}
          className={`pb-3 transition-colors ${
            activeTab === 'jobs'
              ? 'text-ink font-medium border-b-2 border-ink'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Company Vacancies ({businessJobs.length})
        </button>
        <button
          onClick={() => setActiveTab('sponsorships')}
          className={`pb-3 transition-colors ${
            activeTab === 'sponsorships'
              ? 'text-ink font-medium border-b-2 border-ink'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Event Sponsorship Packages
        </button>
      </div>

      {/* Tab 1: Ad Campaigns */}
      {activeTab === 'campaigns' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-medium text-sm text-slate-900">
              Live Sponsored Campaigns
            </h3>
            <button
              onClick={onCreateAdModal}
              className="text-xs font-medium text-purple-800 hover:underline"
            >
              + Create New Ad Campaign
            </button>
          </div>

          <div className="space-y-4">
            {adCampaigns.map((camp) => (
              <div
                key={camp.id}
                className="bg-white rounded-2xl p-6 border border-stone-200/90 shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200">
                        {camp.status}
                      </span>
                      <h4 className="font-display font-medium text-base text-slate-900">
                        {camp.headline}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Target Audience: {camp.targetCategory} · Region: {camp.targetRegion}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono-numbers font-semibold text-slate-900 block">
                      {formatMoney(camp.budgetDailyNGN)} / day
                    </span>
                    <span className="text-[11px] text-slate-400">Total Spend: {formatMoney(camp.totalSpendNGN)}</span>
                  </div>
                </div>

                {/* Performance Analytics Grid */}
                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                    <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mb-1">
                      <Eye className="w-3.5 h-3.5" />
                      <span>Impressions</span>
                    </div>
                    <span className="text-xl font-semibold font-mono-numbers text-slate-900">
                      {camp.impressions.toLocaleString()}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                    <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mb-1">
                      <MousePointer className="w-3.5 h-3.5" />
                      <span>Verified Clicks</span>
                    </div>
                    <span className="text-xl font-semibold font-mono-numbers text-slate-900">
                      {camp.clicks.toLocaleString()}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200">
                    <div className="flex items-center gap-1.5 text-purple-800 text-[11px] mb-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>Direct Farmer Inquiries</span>
                    </div>
                    <span className="text-xl font-semibold font-mono-numbers text-purple-950">
                      {camp.leadsGenerated} Leads
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Verified Products Showroom */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-3">
            <span className="text-[10px] uppercase font-semibold text-purple-800 bg-purple-50 px-2 py-0.5 rounded">
              Certified Seed Stock
            </span>
            <h4 className="font-display font-medium text-sm text-slate-900">
              SAMMAZ 52 Hybrid White Maize (NASC Certified)
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Guaranteed 95% germination with drought resistance and high stay-green rating. Supplied in tamper-proof 2kg and 20kg lots.
            </p>
            <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
              <span className="font-mono-numbers font-semibold text-slate-900">{formatMoney(32000)} / 20kg</span>
              <span className="text-[11px] text-emerald-700 font-medium">In Stock</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-3">
            <span className="text-[10px] uppercase font-semibold text-purple-800 bg-purple-50 px-2 py-0.5 rounded">
              Irrigation Hardware
            </span>
            <h4 className="font-display font-medium text-sm text-slate-900">
              Solar Deep-Well Submersible Pump (2.2 kW)
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Brushless DC stainless-steel impeller with MPPT controller and low-water sensor probes. Capable of 18,000 liters/hr at 60m head.
            </p>
            <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
              <span className="font-mono-numbers font-semibold text-slate-900">{formatMoney(680000)}</span>
              <span className="text-[11px] text-emerald-700 font-medium">Warranty 2 Yrs</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-3">
            <span className="text-[10px] uppercase font-semibold text-purple-800 bg-purple-50 px-2 py-0.5 rounded">
              Bio-Stimulant
            </span>
            <h4 className="font-display font-medium text-sm text-slate-900">
              RootMax Mycorrhizal Inoculant (Liquid Concentrate)
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Enhances phosphorus uptake in high-acidity soils by 40%. Suitable for seed treatment or drip line fertigation injection.
            </p>
            <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
              <span className="font-mono-numbers font-semibold text-slate-900">{formatMoney(18500)} / Liter</span>
              <span className="text-[11px] text-emerald-700 font-medium">NAFDAC Reg.</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Company Vacancies */}
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-medium text-sm text-slate-900">
              Active Business Job Postings
            </h3>
            <button
              onClick={onPostJobModal}
              className="py-1.5 px-3.5 bg-purple-800 hover:bg-purple-900 text-white rounded-full text-xs font-medium"
            >
              Post New Role
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {businessJobs.map((j) => (
              <div key={j.id} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-sm text-slate-900">{j.title}</h4>
                    <span className="text-xs text-slate-500">{j.location}</span>
                  </div>
                  <span className="text-xs font-mono-numbers text-purple-900 font-medium">
                    {j.applicantsCount} Applicants
                  </span>
                </div>
                <p className="text-xs text-slate-600 line-clamp-2">{j.description}</p>
                <div className="pt-2 border-t border-stone-100 flex justify-between text-xs">
                  <span className="text-slate-400">Closes: {j.deadline}</span>
                  <span className="font-medium text-emerald-800">Review Candidate CVs</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Event Sponsorship Packages */}
      {activeTab === 'sponsorships' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-4">
            <span className="text-xs font-medium text-purple-800 uppercase tracking-wider">
              Silver Sponsor
            </span>
            <div className="text-xl font-semibold font-mono-numbers text-slate-900">
              {formatMoney(250000)} / Event
            </div>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>✓ Logo placement in live webinar intro and replay library</li>
              <li>✓ 1-minute video spot before keynote speaker</li>
              <li>✓ Opt-in attendee leads list (GDPR/NDPR compliant)</li>
            </ul>
            <button
              onClick={() => alert('Sponsorship inquiry sent to conference coordinators.')}
              className="w-full py-2 bg-stone-100 hover:bg-purple-800 hover:text-white text-slate-800 rounded-xl text-xs font-medium transition-colors"
            >
              Reserve Silver Package
            </button>
          </div>

          <div className="bg-white rounded-2xl p-6 border-2 border-purple-500 shadow-md space-y-4 relative">
            <span className="text-xs font-medium text-purple-800 uppercase tracking-wider">
              Gold Headline Sponsor
            </span>
            <div className="text-xl font-semibold font-mono-numbers text-slate-900">
              {formatMoney(650000)} / Event
            </div>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>✓ Prominent keynote co-hosting & 15-min product showcase</li>
              <li>✓ Exclusive pinned banner across ecosystem feed for 14 days</li>
              <li>✓ Dedicated breakout demonstration room</li>
            </ul>
            <button
              onClick={() => alert('Sponsorship inquiry sent to conference coordinators.')}
              className="w-full py-2 bg-purple-800 hover:bg-purple-900 text-white rounded-xl text-xs font-medium transition-colors shadow-xs"
            >
              Reserve Gold Package
            </button>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-4">
            <span className="text-xs font-medium text-purple-800 uppercase tracking-wider">
              Annual Ecosystem Partner
            </span>
            <div className="text-xl font-semibold font-mono-numbers text-slate-900">
              {formatMoney(2400000)} / Year
            </div>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>✓ Year-round branding on all public masterclasses & recordings</li>
              <li>✓ Priority vetting on newly published farm input tenders</li>
              <li>✓ Custom field demonstration plots with partner farms</li>
            </ul>
            <button
              onClick={() => alert('Sponsorship inquiry sent to conference coordinators.')}
              className="w-full py-2 bg-stone-100 hover:bg-purple-800 hover:text-white text-slate-800 rounded-xl text-xs font-medium transition-colors"
            >
              Contact Platform Lead
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
