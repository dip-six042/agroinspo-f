import React, { useState } from 'react';
import { useRole } from '../../context/RoleContext';
import { useCurrency } from '../../context/CurrencyContext';
import {
  Briefcase,
  Video,
  DollarSign,
  BookOpen,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle,
  TrendingUp,
  Download,
  PlusCircle,
  FileText
} from 'lucide-react';

interface SpecialistPortalProps {
  onPublishBookModal: () => void;
  onOpenWebinars?: () => void;
}

export const SpecialistPortal: React.FC<SpecialistPortalProps> = ({ onPublishBookModal, onOpenWebinars }) => {
  const { currentUser, bookings, books, ledger, openMeetingRoom } = useRole();
  const { formatMoney } = useCurrency();

  const [activeTab, setActiveTab] = useState<'consultations' | 'earnings' | 'books' | 'rates'>('consultations');
  const [hourlyRateInput, setHourlyRateInput] = useState(18000);
  const [isRateSaved, setIsRateSaved] = useState(false);

  // Filter bookings where specialist is host
  const specialistBookings = bookings;
  const specialistBooks = books.filter((b) => b.authorName.includes('Folashade') || b.authorName.includes('Adeleke'));

  const totalEarnedNGN = ledger
    .filter((l) => l.isCredit)
    .reduce((sum, l) => sum + l.amountNGN, 0);

  const handleSaveRate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsRateSaved(true);
    setTimeout(() => setIsRateSaved(false), 2000);
  };

  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-8 lg:px-12 py-8 space-y-8">
      {/* Specialist Profile Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-sky-600/30"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-normal text-[22px] tracking-[-0.015em] text-ink">{currentUser.name}</h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-sky-50 text-sky-900 border border-sky-200">
                {currentUser.verificationBadgeText}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{currentUser.title} · {currentUser.location}</p>
            <p className="text-xs text-slate-600 mt-1 max-w-xl">{currentUser.bio}</p>
          </div>
        </div>

        {/* Financial Quick Metrics */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="p-3.5 bg-sky-50/70 border border-sky-200 rounded-2xl text-left">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">
              Available Balance
            </span>
            <span className="text-lg font-semibold font-mono-numbers text-sky-950">
              {formatMoney(currentUser.balanceNGN)}
            </span>
          </div>

          <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-2xl text-left">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">
              Pending earnings
            </span>
            <span className="text-lg font-semibold font-mono-numbers text-slate-800">
              {formatMoney(currentUser.pendingBalanceNGN || 36000)}
            </span>
          </div>
          {onOpenWebinars && (
            <button onClick={onOpenWebinars} className="py-2 px-3.5 bg-ink hover:bg-black text-white rounded-full text-xs font-medium flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5" /> Live sessions & webinars
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-stone-200 gap-6 text-[13px] font-medium overflow-x-auto whitespace-nowrap [scrollbar-width:none]" role="tablist">
        <button
          onClick={() => setActiveTab('consultations')}
          className={`pb-3 transition-colors ${
            activeTab === 'consultations'
              ? 'text-ink font-medium border-b-2 border-ink'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Scheduled Client Consultations ({specialistBookings.length})
        </button>
        <button
          onClick={() => setActiveTab('earnings')}
          className={`pb-3 transition-colors ${
            activeTab === 'earnings'
              ? 'text-ink font-medium border-b-2 border-ink'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Financial Ledger & Payouts ({ledger.length})
        </button>
        <button
          onClick={() => setActiveTab('books')}
          className={`pb-3 transition-colors ${
            activeTab === 'books'
              ? 'text-ink font-medium border-b-2 border-ink'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Digital Bookstore & Royalties ({specialistBooks.length})
        </button>
        <button
          onClick={() => setActiveTab('rates')}
          className={`pb-3 transition-colors ${
            activeTab === 'rates'
              ? 'text-ink font-medium border-b-2 border-ink'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Consulting Rates & Time Slots
        </button>
      </div>

      {/* Tab 1: Scheduled Consultations */}
      {activeTab === 'consultations' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-medium text-sm text-slate-900">
              Assigned Client Bookings
            </h3>
            <span className="text-xs text-slate-500">
              Sessions conducted through Agro Inspo encrypted video room
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {specialistBookings.map((bk) => (
              <div
                key={bk.id}
                className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-xs space-y-4 hover:border-sky-600/40 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-medium block">
                      Client / Farm Owner
                    </span>
                    <h4 className="font-display font-medium text-base text-slate-900">
                      {bk.farmerName}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">{bk.farmName}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono-numbers font-semibold text-sky-900 block">
                      {formatMoney(bk.feeNGN - bk.platformFeeNGN)}
                    </span>
                    <span className="text-[10px] text-slate-400">Net Payable</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-600 bg-stone-50 p-2.5 rounded-xl border border-stone-200/70 font-mono-numbers">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>{bk.scheduledDate} at {bk.scheduledTime}</span>
                  <span>·</span>
                  <span>{bk.durationMinutes} minutes</span>
                </div>

                <div className="text-xs text-slate-700 bg-stone-50/50 p-3 rounded-xl border border-stone-200/70 space-y-1">
                  <span className="font-medium text-slate-900 block text-[11px] uppercase tracking-wider text-slate-400">
                    Client Clinical Objective:
                  </span>
                  <p className="leading-relaxed">{bk.objective}</p>
                </div>

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    Reference: {bk.id}
                  </span>
                  <button
                    onClick={() => openMeetingRoom(bk)}
                    className="py-1.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Launch Live Video Room</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Financial Ledger & Payouts */}
      {activeTab === 'earnings' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
            <div>
              <h3 className="font-display font-medium text-base text-slate-900">
                Immutable Earnings Ledger & Payout Schedule
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Transparent 15% platform fee deduction with scheduled bank transfers
              </p>
            </div>
            <button
              onClick={() => alert('Payout request of ' + formatMoney(currentUser.balanceNGN) + ' submitted for next Friday batch settlement.')}
              className="py-2 px-4 bg-sky-800 hover:bg-sky-900 text-white rounded-xl text-xs font-medium transition-colors self-start sm:self-auto shadow-xs"
            >
              Request Bank Payout Batch
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-slate-500 border-b border-stone-200 font-medium">
                <tr>
                  <th className="py-2.5 px-4">Date / Time</th>
                  <th className="py-2.5 px-4">Description / Type</th>
                  <th className="py-2.5 px-4">Reference</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                  <th className="py-2.5 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {ledger.map((entry) => (
                  <tr key={entry.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="py-3 px-4 font-mono-numbers text-slate-600">{entry.date}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{entry.type}</td>
                    <td className="py-3 px-4 font-mono-numbers text-slate-500">{entry.reference}</td>
                    <td className={`py-3 px-4 font-mono-numbers font-medium text-right ${entry.isCredit ? 'text-emerald-700' : 'text-slate-700'}`}>
                      {entry.isCredit ? '+' : '-'}{formatMoney(entry.amountNGN)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-stone-100 text-slate-700">
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Digital Bookstore */}
      {activeTab === 'books' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-medium text-sm text-slate-900">
              Your Published Digital Agricultural Handbooks
            </h3>
            <button
              onClick={onPublishBookModal}
              className="py-1.5 px-3.5 bg-sky-800 hover:bg-sky-900 text-white rounded-full text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Publish New Handbook</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {specialistBooks.map((bk) => (
              <div
                key={bk.id}
                className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] uppercase font-semibold tracking-wider text-sky-800 bg-sky-50 px-2 py-0.5 rounded">
                      {bk.category}
                    </span>
                    <span className="text-xs font-mono-numbers font-medium text-slate-900">
                      {formatMoney(bk.priceNGN)}
                    </span>
                  </div>
                  <h4 className="font-display font-medium text-base text-slate-900">
                    {bk.title}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {bk.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-slate-500 pt-1 font-mono-numbers">
                    <span>{bk.pageCount} pages</span>
                    <span>·</span>
                    <span>{bk.downloadsCount} total purchases</span>
                    <span>·</span>
                    <span>★ {bk.rating}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                  <span className="text-emerald-700 font-medium">
                    Estimated Royalties: {formatMoney(bk.downloadsCount * bk.priceNGN * 0.85)}
                  </span>
                  <button
                    onClick={() => alert(`Previewing chapter: ${bk.sampleChapter}`)}
                    className="text-sky-800 font-medium hover:underline"
                  >
                    View Sample Chapter
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Consulting Rates */}
      {activeTab === 'rates' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-xs max-w-xl space-y-6">
          <div>
            <h3 className="font-display font-medium text-base text-slate-900">
              Configure Service Rates & Availability
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Farmers book directly according to these published rates
            </p>
          </div>

          <form onSubmit={handleSaveRate} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Standard 45-Minute Consultation Fee ({formatMoney(hourlyRateInput)})
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={hourlyRateInput}
                  onChange={(e) => setHourlyRateInput(Number(e.target.value))}
                  step="1000"
                  min="5000"
                  className="w-full text-xs py-2 px-3 border border-stone-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:border-sky-600 font-mono-numbers"
                  required
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Net earnings after 15% platform commission: {formatMoney(hourlyRateInput * 0.85)}
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Consultation Delivery Channels
              </label>
              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded text-sky-800" />
                  <span>Interactive Agro Inspo In-Browser Video Call</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded text-sky-800" />
                  <span>Direct High-Definition Audio Call</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="py-2.5 px-5 bg-sky-800 hover:bg-sky-900 text-white rounded-full text-xs font-medium transition-colors"
            >
              {isRateSaved ? 'Saved Successfully ✓' : 'Update Consultation Rate'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
