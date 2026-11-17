import React, { useState } from 'react';
import { useRole } from '../../context/RoleContext';
import { useCurrency } from '../../context/CurrencyContext';
import { AdminGate, AdminOverview, AdminUsers, AdminReports, AdminAudit, AdminJobsQueue, AdminPayments } from './AdminLive';
import { AdminFinance, AdminSupport, AdminBooks, AdminSpecialists, AdminCreators } from './AdminPhase3';
import { AdminBusinesses, AdminAds } from './AdminPhase4';
import { Shield, CheckCircle } from 'lucide-react';

const TABS = [
  ['users', 'Members'],
  ['reports', 'Reports & appeals'],
  ['support', 'Support & disputes'],
  ['finance', 'Finance & payouts'],
  ['payments', 'Payments'],
  ['specialists', 'Specialist checks'],
  ['creators', 'Creator screening'],
  ['books', 'Books'],
  ['businesses', 'Business checks'],
  ['ads', 'Adverts & sponsorship'],
  ['jobs', 'Job listings'],
  ['opportunities', 'Farm opportunities (demo)'],
  ['audit', 'Audit log']
] as const;
type Tab = (typeof TABS)[number][0];

export const AdminPortal: React.FC<{ tab?: string }> = ({ tab }) => {
  const { opportunities, approveOpportunity } = useRole();
  const { formatMoney } = useCurrency();
  const [activeTab, setActiveTab] = useState<Tab>((TABS.find(([t]) => t === tab)?.[0] as Tab) ?? 'users');

  const live: Partial<Record<Tab, React.ReactNode>> = {
    users: <div className="space-y-6"><AdminOverview /><AdminUsers /></div>,
    reports: <AdminReports />,
    support: <AdminSupport />,
    finance: <AdminFinance />,
    payments: <AdminPayments />,
    specialists: <AdminSpecialists />,
    creators: <AdminCreators />,
    books: <AdminBooks />,
    businesses: <AdminBusinesses />,
    ads: <AdminAds />,
    jobs: <AdminJobsQueue />,
    audit: <AdminAudit />
  };

  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-8 lg:px-12 py-8 space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-ink text-lime flex items-center justify-center"><Shield className="w-6 h-6" /></div>
        <div>
          <h1 className="font-display font-normal text-[26px] tracking-[-0.02em] text-ink">Admin console</h1>
          <p className="text-[12px] text-slate-500">Moderation, money, verification and support. Every action here is recorded in the audit log.</p>
        </div>
      </div>

      <div className="flex border-b border-stone-200 gap-6 text-[13px] font-medium overflow-x-auto whitespace-nowrap [scrollbar-width:none]" role="tablist">
        {TABS.map(([id, label]) => (
          <button key={id} role="tab" aria-selected={activeTab === id} onClick={() => setActiveTab(id)}
            className={`pb-3 transition-colors ${activeTab === id ? 'text-ink border-b-2 border-ink' : 'text-slate-500 hover:text-slate-900'}`}>
            {label}
          </button>
        ))}
      </div>

      {live[activeTab] && <AdminGate>{live[activeTab]}</AdminGate>}

      {activeTab === 'opportunities' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-medium text-sm text-slate-900">
              Farm Investment & Expansion Proposals
            </h3>
            <span className="text-xs text-slate-500">
              Gated moderation: unreviewed opportunities remain private
            </span>
          </div>

          <div className="space-y-4">
            {opportunities.map((opp) => (
              <div
                key={opp.id}
                className="bg-white rounded-2xl p-6 border border-stone-200/90 shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-display font-medium text-base text-slate-900">
                        {opp.title}
                      </h4>
                      <span
                        className={`text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded ${
                          opp.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {opp.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {opp.farmName} · {opp.location} · {opp.hectares} Ha ({opp.cropOrLivestock})
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-mono-numbers font-semibold text-slate-900 block">
                      Target: {formatMoney(opp.fundingTargetNGN)}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Duration: {opp.durationMonths} Months ({opp.projectedReturnRange})
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed font-body">
                  {opp.summary}
                </p>

                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-slate-600 space-y-1">
                  <span className="font-medium text-slate-800 block">Verification Scope & Title Review:</span>
                  <p className="text-[11px]">{opp.verificationScope}</p>
                </div>

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Risk Assessment: {opp.riskRating}</span>
                  {opp.status === 'under_review' ? (
                    <button
                      onClick={() => approveOpportunity(opp.id)}
                      className="py-1.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Approve & Publish Listing
                    </button>
                  ) : (
                    <span className="text-emerald-700 font-medium">Publicly Visible</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
