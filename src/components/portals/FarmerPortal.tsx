import React, { useState } from 'react';
import { useRole } from '../../context/RoleContext';
import { useCurrency } from '../../context/CurrencyContext';
import {
  Tractor,
  Video,
  PlusCircle,
  FileText,
  Calendar,
  Clock,
  MapPin,
  TrendingUp,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { CASSAVA_FARM_IMAGE } from '../../data/mockData';

interface FarmerPortalProps {
  onBookSpecialist: (specialist: any) => void;
  onViewProgressReport: (report: any) => void;
  onPostJobModal: () => void;
  onSubmitOpportunityModal: () => void;
}

export const FarmerPortal: React.FC<FarmerPortalProps> = ({
  onBookSpecialist,
  onViewProgressReport,
  onPostJobModal,
  onSubmitOpportunityModal
}) => {
  const { currentUser, bookings, specialists, opportunities, progressReports, openMeetingRoom } = useRole();
  const { formatMoney } = useCurrency();

  const [activeTab, setActiveTab] = useState<'consultations' | 'farm_profile' | 'projects'>('consultations');

  // Filter bookings for this farmer
  const farmerBookings = bookings;

  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-8 lg:px-12 py-8 space-y-8">
      {/* Farm Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-ink/30"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-normal text-[22px] tracking-[-0.015em] text-ink">{currentUser.name}</h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-900 border border-amber-200">
                {currentUser.verificationBadgeText}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{currentUser.title} · {currentUser.location}</p>
            <p className="text-xs text-slate-600 mt-1 max-w-xl">{currentUser.bio}</p>
          </div>
        </div>

        {/* Action quick buttons */}
        <div className="flex flex-wrap sm:flex-nowrap gap-2">
          <button
            onClick={onPostJobModal}
            className="py-2 px-3.5 bg-stone-100 hover:bg-stone-200 text-slate-800 rounded-full text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Post Farm Vacancy</span>
          </button>
          <button
            onClick={onSubmitOpportunityModal}
            className="py-2 px-3.5 bg-ink hover:bg-black text-white rounded-full text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Investment waiting list</span>
          </button>
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
          Specialist Consultations ({farmerBookings.length})
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={`pb-3 transition-colors ${
            activeTab === 'projects'
              ? 'text-ink font-medium border-b-2 border-ink'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Farm Expansion & Progress Reports ({progressReports.length})
        </button>
        <button
          onClick={() => setActiveTab('farm_profile')}
          className={`pb-3 transition-colors ${
            activeTab === 'farm_profile'
              ? 'text-ink font-medium border-b-2 border-ink'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Farm Operating Identity & Land Records
        </button>
      </div>

      {/* Tab 1: Specialist Consultations */}
      {activeTab === 'consultations' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-medium text-sm text-slate-900">
              Upcoming & Confirmed Video Consultations
            </h3>
            <span className="text-xs text-slate-500 font-mono-numbers">
              {farmerBookings.length} Active Sessions
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {farmerBookings.map((bk) => (
              <div
                key={bk.id}
                className="bg-white rounded-2xl p-5 border border-stone-200/90 shadow-xs space-y-4 hover:border-ink/40 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={bk.specialistAvatar}
                      alt={bk.specialistName}
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                    <div>
                      <h4 className="font-medium text-xs text-slate-900">{bk.specialistName}</h4>
                      <p className="text-[11px] text-slate-500">{bk.specialistTitle}</p>
                      <div className="flex items-center gap-1.5 text-[11px] text-amber-900 font-mono-numbers mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>{bk.scheduledDate} at {bk.scheduledTime}</span>
                      </div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {bk.status}
                  </span>
                </div>

                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 text-xs text-slate-700 space-y-1">
                  <span className="font-medium text-slate-900 block text-[11px] uppercase tracking-wider text-slate-400">
                    Clinical / Agronomic Focus:
                  </span>
                  <p className="leading-relaxed">{bk.objective}</p>
                </div>

                {bk.sessionNotes && (
                  <div className="text-[11px] text-slate-600 italic bg-amber-50/50 p-2.5 rounded-lg border border-amber-200/60">
                    <strong>Specialist Notes:</strong> {bk.sessionNotes}
                  </div>
                )}

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-xs font-mono-numbers font-medium text-slate-900">
                    {formatMoney(bk.feeNGN)} (paid)
                  </span>
                  <button
                    onClick={() => openMeetingRoom(bk)}
                    className="py-1.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Join Live Consultation Room</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Specialist Hiring Strip */}
          <div className="pt-4 border-t border-stone-200 space-y-4">
            <h4 className="font-display font-medium text-xs text-slate-900 uppercase tracking-wider">
              Need immediate advice? Available Specialists
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {specialists.map((spec) => (
                <div
                  key={spec.id}
                  className="bg-white rounded-xl p-4 border border-stone-200 space-y-2 flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <span className="font-medium text-xs text-slate-900 block truncate">{spec.name}</span>
                    <span className="text-[11px] text-slate-500 block truncate">{spec.title}</span>
                    <span className="text-xs font-mono-numbers text-amber-900 font-semibold block pt-1">
                      {formatMoney(spec.hourlyRateNGN)} / 45m
                    </span>
                  </div>
                  <button
                    onClick={() => onBookSpecialist(spec)}
                    className="w-full py-1.5 px-3 bg-stone-100 hover:bg-ink hover:text-white text-slate-800 rounded-lg text-xs font-medium transition-colors"
                  >
                    Book Now
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Farm Expansion & Progress Reports */}
      {activeTab === 'projects' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-medium text-sm text-slate-900">
              Farm Projects & Submitted Milestone Reports
            </h3>
            <button
              onClick={onSubmitOpportunityModal}
              className="text-xs font-medium text-amber-800 hover:underline"
            >
              Investment waiting list
            </button>
          </div>

          <div className="space-y-4">
            {progressReports.map((report) => (
              <div
                key={report.id}
                className="bg-white rounded-2xl p-6 border border-stone-200/90 shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-display font-medium text-base text-slate-900">
                        {report.farmName} — {report.reportingPeriod}
                      </h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {report.overallStatus.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Milestone: {report.milestoneTitle} ({report.progressPercent}% Target Attained)
                    </p>
                  </div>

                  <button
                    onClick={() => onViewProgressReport(report)}
                    className="py-1.5 px-4 bg-stone-100 hover:bg-stone-200 text-slate-800 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors self-start sm:self-auto"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View Evidence & Audit Logs</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {report.productionMetrics.map((m, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                      <span className="text-[11px] text-slate-500 block">{m.label}</span>
                      <span className="text-base font-semibold font-mono-numbers text-slate-900">
                        {m.value} {m.unit}
                      </span>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-slate-700 bg-stone-50/50 p-3 rounded-xl border border-stone-200 leading-relaxed font-body">
                  {report.narrative}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Farm Operating Identity */}
      {activeTab === 'farm_profile' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-stone-200">
            <div>
              <h3 className="font-display font-medium text-lg text-slate-900">
                GreenPeak Commercial Farms Estate
              </h3>
              <p className="text-xs text-slate-500">Iseyin Local Government Area, Oyo State, Nigeria</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              Verified Agricultural Estate
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
              <span className="text-slate-400 block font-medium uppercase">Total Acreage</span>
              <span className="text-lg font-semibold font-mono-numbers text-slate-900">120 Hectares</span>
              <p className="text-[11px] text-slate-500">85 Ha Mechanized Yellow Maize · 35 Ha Cassava</p>
            </div>

            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
              <span className="text-slate-400 block font-medium uppercase">Mechanization</span>
              <span className="text-lg font-semibold text-slate-900">3 Tractors & Implements</span>
              <p className="text-[11px] text-slate-500">Ploughs, harrows, boom sprayers & ridge planters</p>
            </div>

            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
              <span className="text-slate-400 block font-medium uppercase">Irrigation Source</span>
              <span className="text-lg font-semibold text-slate-900">Solar Deep-Well Drip</span>
              <p className="text-[11px] text-slate-500">24 cubic meters/hr solar pumping capacity</p>
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden aspect-21/9 border border-stone-200 relative">
            <img src={CASSAVA_FARM_IMAGE} alt="GreenPeak Farm Estate" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
              <span className="text-white text-xs font-medium">Registered Farm Boundaries · Survey Plan #OY-AGR-2024-819</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
