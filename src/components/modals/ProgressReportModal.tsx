import React from 'react';
import { ProgressReport, FarmOpportunity } from '../../types';
import { useCurrency } from '../../context/CurrencyContext';
import { X, CheckCircle, ShieldCheck, TrendingUp, Calendar, AlertTriangle, FileText, Image as ImageIcon } from 'lucide-react';

interface ProgressReportModalProps {
  report: ProgressReport;
  opportunity?: FarmOpportunity;
  onClose: () => void;
}

export const ProgressReportModal: React.FC<ProgressReportModalProps> = ({ report, opportunity, onClose }) => {
  const { formatMoney } = useCurrency();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-canvas rounded-2xl max-w-2xl w-full border border-stone-200 shadow-2xl overflow-hidden text-slate-900 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-medium text-base text-slate-900">
                Verified Progress Report #{report.id}
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                On Track · 65% Completed
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {report.farmName} · Reporting Period: {report.reportingPeriod}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-stone-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Milestone Focus */}
          <div className="p-4 bg-stone-100/70 rounded-xl border border-stone-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-700 uppercase tracking-wider">
                Current Milestone Deliverable
              </span>
              <span className="text-xs font-mono-numbers font-medium text-emerald-800">
                {report.progressPercent}% Target Attained
              </span>
            </div>
            <h4 className="font-display font-medium text-sm text-slate-900">
              {report.milestoneTitle}
            </h4>
            <div className="w-full bg-stone-200 rounded-full h-2 mt-3 overflow-hidden">
              <div
                className="bg-emerald-700 h-2 rounded-full transition-all duration-500"
                style={{ width: `${report.progressPercent}%` }}
              />
            </div>
          </div>

          {/* Operational Metrics Grid */}
          <div>
            <h5 className="text-xs font-medium text-slate-700 mb-3 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-800" />
              Verified Operations & Production Metrics
            </h5>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {report.productionMetrics.map((metric, i) => (
                <div key={i} className="p-3 rounded-xl bg-white border border-stone-200 shadow-xs">
                  <span className="text-[11px] text-slate-500 block truncate">{metric.label}</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-lg font-semibold font-mono-numbers text-slate-900">
                      {metric.value}
                    </span>
                    <span className="text-xs text-slate-500">{metric.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Narrative description */}
          <div>
            <h5 className="text-xs font-medium text-slate-700 mb-2 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-emerald-800" />
              Field Officer Narrative & Agronomic Observations
            </h5>
            <p className="text-xs text-slate-700 bg-white p-4 rounded-xl border border-stone-200 leading-relaxed">
              {report.narrative}
            </p>
          </div>

          {/* Evidence photos */}
          <div>
            <h5 className="text-xs font-medium text-slate-700 mb-2 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-emerald-800" />
              Photographic Field Evidence & Sensor Telemetry
            </h5>
            <div className="grid grid-cols-2 gap-3">
              {report.evidenceImages.map((img, i) => (
                <div key={i} className="relative rounded-xl overflow-hidden border border-stone-200 aspect-video group">
                  <img src={img} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2.5">
                    <span className="text-[11px] text-white font-medium drop-shadow">
                      {i === 0 ? 'Planting Block Orthomosaic' : 'Solar Pump Head Pressure Check'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              {report.evidenceNotes}
            </p>
          </div>

          {/* Verification Badge & Audit Footer */}
          <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-950">
              <span className="font-medium block">Independent Platform Compliance Verification</span>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                Report examined, geolocated, and formally signed off by {report.approvedBy} on {report.submittedAt}.
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-stone-200 bg-stone-50 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="py-2 px-5 bg-stone-800 hover:bg-stone-900 text-white rounded-full text-xs font-medium transition-colors"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
