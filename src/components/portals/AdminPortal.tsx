import React, { useState } from 'react';
import { AdminGate, AdminOverview, AdminUsers, AdminReports, AdminAudit, AdminJobsQueue, AdminPayments } from './AdminLive';
import { AdminFinance, AdminSupport, AdminBooks, AdminSpecialists, AdminCreators } from './AdminPhase3';
import { AdminBusinesses, AdminAds } from './AdminPhase4';
import { AdminInvestment } from './AdminInvestment';
import { Shield } from 'lucide-react';

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
  ['opportunities', 'Investment portal'],
  ['audit', 'Audit log']
] as const;
type Tab = (typeof TABS)[number][0];

export const AdminPortal: React.FC<{ tab?: string }> = ({ tab }) => {
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
    opportunities: <AdminInvestment />,
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
    </div>
  );
};
