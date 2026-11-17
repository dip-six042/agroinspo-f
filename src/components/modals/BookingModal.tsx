import React, { useState } from 'react';
import { Specialist } from '../../types';
import { useRole } from '../../context/RoleContext';
import { useCurrency } from '../../context/CurrencyContext';
import { Calendar, Clock, ShieldCheck, X, CheckCircle, Video } from 'lucide-react';

interface BookingModalProps {
  specialist: Specialist;
  onClose: () => void;
  onSuccess: (bookingId: string) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({ specialist, onClose, onSuccess }) => {
  const { bookConsultation, openMeetingRoom } = useRole();
  const { formatMoney } = useCurrency();

  const [selectedDate, setSelectedDate] = useState('2026-10-27');
  const [selectedSlot, setSelectedSlot] = useState(specialist.upcomingSlots[0] || '10:00 AM');
  const [objective, setObjective] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookedBooking, setBookedBooking] = useState<any>(null);

  const fee = specialist.hourlyRateNGN;
  const platformFee = Math.round(fee * 0.15);
  const total = fee;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!objective.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const newBooking = bookConsultation(specialist.id, selectedDate, selectedSlot, objective);
      setBookedBooking(newBooking);
      setIsSubmitting(false);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-canvas rounded-2xl max-w-lg w-full border border-stone-200 shadow-2xl overflow-hidden text-slate-900">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div>
            <h3 className="font-display font-medium text-base text-slate-900">
              Book Audio / Video Consultation
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Paid session with an agricultural specialist
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-stone-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {bookedBooking ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-display font-medium text-lg text-slate-900">
                Consultation Confirmed!
              </h4>
              <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto">
                Session booked with {specialist.name} for {bookedBooking.scheduledDate} at {bookedBooking.scheduledTime}.
              </p>
            </div>

            <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Booking Ref:</span>
                <span className="font-mono-numbers font-medium text-slate-900">{bookedBooking.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Paid:</span>
                <span className="font-mono-numbers font-medium text-emerald-700">{formatMoney(bookedBooking.feeNGN)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Video Platform:</span>
                <span className="text-slate-700">Agro Inspo Secure Room</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => {
                  onClose();
                  openMeetingRoom(bookedBooking);
                }}
                className="flex-1 py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <Video className="w-4 h-4" />
                Launch Live Room Now
              </button>
              <button
                onClick={() => {
                  onSuccess(bookedBooking.id);
                  onClose();
                }}
                className="py-2.5 px-4 bg-stone-200 hover:bg-stone-300 text-slate-800 rounded-xl text-xs font-medium transition-colors"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Specialist mini card */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-stone-100/70 border border-stone-200">
              <img
                src={specialist.avatar}
                alt={specialist.name}
                className="w-12 h-12 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <h4 className="font-medium text-xs text-slate-900 truncate">
                  {specialist.name}
                </h4>
                <p className="text-[11px] text-slate-500 truncate">{specialist.title}</p>
                <p className="text-[11px] text-emerald-800 font-mono-numbers mt-0.5">
                  {formatMoney(fee)} / 45-minute session
                </p>
              </div>
            </div>

            {/* Date Selection */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Select Consultation Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={selectedDate}
                  min="2026-10-26"
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full text-xs py-2 px-3 border border-stone-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:border-emerald-600"
                  required
                />
              </div>
            </div>

            {/* Time Slot Picker */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Available Specialist Slots
              </label>
              <div className="grid grid-cols-2 gap-2">
                {specialist.upcomingSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`py-2 px-3 text-xs rounded-xl border text-left transition-all ${
                      selectedSlot === slot
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-900 font-medium ring-1 ring-emerald-600'
                        : 'border-stone-200 hover:border-stone-300 text-slate-700 bg-white'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            {/* Farm Issue / Objective */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Consultation Goal / Farm Situation
              </label>
              <textarea
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="Describe your crop or livestock condition, acreage, symptoms, or specific agronomic questions..."
                rows={3}
                required
                className="w-full text-xs p-3 border border-stone-300 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 resize-none leading-relaxed"
              />
            </div>

            {/* Fee transparency */}
            <div className="p-3 bg-stone-100 rounded-xl border border-stone-200 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>Consultant Rate (45 mins):</span>
                <span className="font-mono-numbers">{formatMoney(fee - platformFee)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Platform commission (included):</span>
                <span className="font-mono-numbers">{formatMoney(platformFee)}</span>
              </div>
              <div className="flex justify-between font-medium text-slate-900 pt-1 border-t border-stone-200">
                <span>Total Payable:</span>
                <span className="font-mono-numbers text-emerald-800">{formatMoney(total)}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span>Paid through Kora when you book. Refunded in full if the specialist cancels or doesn’t join.</span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 border border-stone-300 hover:bg-stone-100 rounded-full text-xs font-medium text-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white rounded-full text-xs font-medium transition-colors disabled:opacity-50 shadow-sm"
              >
                {isSubmitting ? 'Confirming...' : `Pay & Confirm (${formatMoney(total)})`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
