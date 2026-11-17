import React from 'react';
import { useRole } from '../../context/RoleContext';
import { useCurrency } from '../../context/CurrencyContext';
import { FarmOpportunity } from '../../types';
import {
  TrendingUp,
  ShieldCheck,
  MapPin,
  AlertTriangle,
  FileText,
  Calendar,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

interface OpportunitiesViewProps {
  onViewProgressReport: (report: any) => void;
  onSubmitOpportunityModal: () => void;
}

export const OpportunitiesView: React.FC<OpportunitiesViewProps> = ({
  onViewProgressReport,
  onSubmitOpportunityModal
}) => {
  const { opportunities, progressReports } = useRole();
  const { formatMoney } = useCurrency();

  const approvedOpps = opportunities.filter((o) => o.status === 'approved');

  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-8 lg:px-12 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>Audited Agricultural Proposals</span>
          </div>
          <h1 className="font-display text-[34px] sm:text-[48px] font-normal leading-[1.08] tracking-[-0.03em] text-ink">
            Vetted Farm Investment Opportunities
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
            Review vetted commercial outgrower expansions and greenhouse developments. Every approved project features mandatory scheduled milestone reporting and audited field evidence.
          </p>
        </div>

        <button
          onClick={onSubmitOpportunityModal}
          className="py-2.5 px-5 bg-ink hover:bg-black text-white rounded-full text-xs font-medium self-start sm:self-auto transition-colors shadow-xs"
        >
          Submit Farm Proposal
        </button>
      </div>

      {/* Regulatory Disclosure Banner */}
      <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs text-amber-950 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Mandatory Risk Disclosure:</strong> Farm investment features are presented under strict Nigerian regulatory compliance guidelines. Past crop yields do not guarantee future profitability. All funds move through licensed custody partners with milestone-based disbursement.
        </p>
      </div>

      {/* Opportunities List */}
      <div className="space-y-8">
        {approvedOpps.map((opp) => {
          const matchingReports = progressReports.filter((r) => r.opportunityId === opp.id);
          const percentFunded = Math.round((opp.fundedNGN / opp.fundingTargetNGN) * 100);

          return (
            <div
              key={opp.id}
              className="bg-white rounded-3xl border border-stone-200/90 overflow-hidden shadow-xs hover:shadow-xl transition-all"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 sm:p-8">
                {/* Visual Image & Quick Stats */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="rounded-2xl overflow-hidden aspect-4/3 relative border border-stone-200">
                    <img src={opp.farmImage} alt={opp.title} className="w-full h-full object-cover" />
                    <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs text-white text-[11px] font-mono-numbers">
                      {opp.hectares} Hectares
                    </div>
                  </div>

                  {/* Funding Bar */}
                  <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-700">Committed Capital:</span>
                      <span className="font-mono-numbers text-emerald-800">
                        {formatMoney(opp.fundedNGN)} / {formatMoney(opp.fundingTargetNGN)}
                      </span>
                    </div>
                    <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-700 h-2 rounded-full"
                        style={{ width: `${percentFunded}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500 font-mono-numbers">
                      <span>{percentFunded}% Subscribed</span>
                      <span>{opp.durationMonths} Months Duration</span>
                    </div>
                  </div>
                </div>

                {/* Details & Milestones */}
                <div className="lg:col-span-7 flex flex-col justify-between space-y-5">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{opp.farmName}</span>
                      <span>·</span>
                      <span>{opp.location}</span>
                    </div>

                    <h3 className="font-display font-medium text-xl text-slate-900 leading-snug">
                      {opp.title}
                    </h3>

                    <p className="text-xs text-slate-600 leading-relaxed font-body">
                      {opp.summary}
                    </p>

                    {/* Return & Risk */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                        <span className="text-[10px] uppercase font-medium text-slate-400 block">
                          Projected Harvest Return
                        </span>
                        <span className="text-sm font-semibold text-emerald-800">
                          {opp.projectedReturnRange}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                        <span className="text-[10px] uppercase font-medium text-slate-400 block">
                          Risk Classification
                        </span>
                        <span className="text-sm font-semibold text-slate-800">
                          {opp.riskRating}
                        </span>
                      </div>
                    </div>

                    {/* Compliance Scope */}
                    <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 space-y-0.5">
                      <span className="font-medium block">Independent Compliance Scope:</span>
                      <p className="text-[11px] text-emerald-800">{opp.verificationScope}</p>
                    </div>
                  </div>

                  {/* Actions & Report Trigger */}
                  <div className="pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
                    {matchingReports.length > 0 ? (
                      <button
                        onClick={() => onViewProgressReport(matchingReports[0])}
                        className="py-2 px-4 bg-stone-100 hover:bg-stone-200 text-slate-800 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 text-emerald-800" />
                        <span>View Month 3 Progress Report ({matchingReports[0].progressPercent}%)</span>
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">Scheduled Report Due Next Month</span>
                    )}

                    <button
                      onClick={() => alert(`Participation expression submitted for ${opp.title}. Compliance verification pack dispatched to email.`)}
                      className="py-2 px-5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
                    >
                      <span>Submit Expression of Interest</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
