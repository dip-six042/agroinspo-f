import React, { useState } from 'react';
import { useRole } from '../../context/RoleContext';
import { X, CheckCircle, AlertCircle, HelpCircle, Award } from 'lucide-react';

interface CreatorQuizModalProps {
  onClose: () => void;
}

const QUIZ_QUESTIONS = [
  {
    question: 'When side-dressing urea on sandy-loam soils in hot weather, what primary risk must be managed?',
    options: [
      'Ammonia volatilization into the atmosphere without adequate moisture or soil incorporation',
      'Instant root burning regardless of application rate',
      'Excessive soil compaction from hand spreaders',
      'Premature grain drying during early vegetative stage'
    ],
    correctIndex: 0
  },
  {
    question: 'What is the recommended soil pH range for optimal nutrient availability for commercial maize in West Africa?',
    options: [
      'pH 4.0 to 4.8',
      'pH 5.8 to 6.8',
      'pH 7.8 to 8.5',
      'pH does not affect macro-nutrient uptake'
    ],
    correctIndex: 1
  },
  {
    question: 'In commercial broiler management, what does an FCR (Feed Conversion Ratio) of 1.6 mean?',
    options: [
      'The bird gains 1.6 kg for every 1 kg of feed consumed',
      'The flock requires 1.6 kg of feed to produce 1 kg of live body weight',
      'Water consumption is 1.6 times dry mash intake',
      'Mortality rate is capped at 1.6% per week'
    ],
    correctIndex: 1
  },
  {
    question: 'Under Agro Inspo creator guidelines, what is required before publishing chemical pesticide dosage recommendations?',
    options: [
      'Promising 100% cure rate to encourage farmer confidence',
      'Citing approved active ingredients, safety pre-harvest intervals (PHI), and protective equipment warnings',
      'Selling unlabelled decanted chemical bottles in comments',
      'Guaranteeing double farm profit within 30 days'
    ],
    correctIndex: 1
  }
];

export const CreatorQuizModal: React.FC<CreatorQuizModalProps> = ({ onClose }) => {
  const { submitCreatorQuiz } = useRole();

  const [topic, setTopic] = useState('Tropical Agronomy & Soil Diagnostics');
  const [outline, setOutline] = useState(
    'Practical series on early fall armyworm scouting, bio-stimulants, and balanced NPK scheduling for commercial cereal growers.'
  );
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>(new Array(QUIZ_QUESTIONS.length).fill(-1));
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const handleSelectAnswer = (qIndex: number, optionIndex: number) => {
    const updated = [...selectedAnswers];
    updated[qIndex] = optionIndex;
    setSelectedAnswers(updated);
  };

  const allAnswered = selectedAnswers.every((ans) => ans !== -1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allAnswered) return;

    let correctCount = 0;
    QUIZ_QUESTIONS.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        correctCount += 1;
      }
    });

    const calculatedScore = Math.round((correctCount / QUIZ_QUESTIONS.length) * 100);
    setScore(calculatedScore);
    submitCreatorQuiz(topic, outline, calculatedScore);
    setIsSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-canvas rounded-2xl max-w-xl w-full border border-stone-200 shadow-2xl overflow-hidden text-slate-900 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50 shrink-0">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-800" />
            <div>
              <h3 className="font-display font-medium text-base text-slate-900">
                Creator Screening Assessment
              </h3>
              <p className="text-xs text-slate-500">
                Topic competency & community integrity verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-stone-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="p-6 text-center space-y-4 overflow-y-auto">
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto ${
                score >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {score >= 80 ? <CheckCircle className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
            </div>

            <div>
              <span className="font-mono-numbers text-3xl font-semibold text-slate-900">{score}%</span>
              <h4 className="font-display font-medium text-lg text-slate-900 mt-1">
                {score >= 80 ? 'Creator Screening Passed!' : 'Assessment Under Administrative Review'}
              </h4>
              <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto leading-relaxed">
                {score >= 80
                  ? 'Congratulations! You have satisfied Agro Inspo baseline technical accuracy and disclosure standards. Your profile is now authorized to publish vetted articles and join creator discussions.'
                  : 'You scored below the 80% automated threshold. Your sample outline and quiz have been submitted to the platform agronomy board for manual evaluation.'}
              </p>
            </div>

            <div className="p-3 bg-stone-100 rounded-xl text-left text-xs space-y-1 text-slate-600">
              <div className="flex justify-between">
                <span>Subject Track:</span>
                <span className="font-medium text-slate-900">{topic}</span>
              </div>
              <div className="flex justify-between">
                <span>Verification Scope:</span>
                <span className="text-slate-700">Topic Knowledge Test (Not formal professional license)</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="py-2.5 px-6 bg-emerald-800 hover:bg-emerald-900 text-white rounded-full text-xs font-medium transition-colors shadow-sm"
            >
              Return to Hub
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                To safeguard farmers against misleading agronomic advice, creators must pass this technical quiz and declare their curriculum before publishing rights are granted.
              </p>
            </div>

            {/* Topic track */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Select Primary Publishing Track
              </label>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full text-xs py-2 px-3 border border-stone-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:border-emerald-600"
              >
                <option value="Tropical Agronomy & Soil Diagnostics">Tropical Agronomy & Soil Diagnostics</option>
                <option value="Commercial Poultry & Biosecurity">Commercial Poultry & Biosecurity</option>
                <option value="Aquaculture & Hatchery Economics">Aquaculture & Hatchery Economics</option>
                <option value="Post-Harvest Grain Storage & Logistics">Post-Harvest Grain Storage & Logistics</option>
                <option value="Solar Drip Irrigation Engineering">Solar Drip Irrigation Engineering</option>
              </select>
            </div>

            {/* Proposed Content Sample */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Proposed Content Summary / Practical Knowledge Sample
              </label>
              <textarea
                value={outline}
                onChange={(e) => setOutline(e.target.value)}
                rows={2}
                className="w-full text-xs p-3 border border-stone-300 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 resize-none leading-relaxed"
                required
              />
            </div>

            {/* Multiple Choice Questions */}
            <div className="space-y-4 pt-2 border-t border-stone-200">
              <span className="text-xs font-medium text-slate-900 block">
                Technical Knowledge Evaluation (Pass Mark: 80%)
              </span>

              {QUIZ_QUESTIONS.map((q, qIdx) => (
                <div key={qIdx} className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
                  <p className="text-xs font-medium text-slate-900">
                    {qIdx + 1}. {q.question}
                  </p>
                  <div className="space-y-1.5 pt-1">
                    {q.options.map((opt, optIdx) => (
                      <label
                        key={optIdx}
                        className={`flex items-start gap-2.5 p-2 rounded-lg text-xs cursor-pointer border transition-colors ${
                          selectedAnswers[qIdx] === optIdx
                            ? 'bg-emerald-50 border-emerald-600 text-emerald-950 font-medium'
                            : 'bg-white border-stone-200 text-slate-700 hover:bg-stone-100'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q_${qIdx}`}
                          checked={selectedAnswers[qIdx] === optIdx}
                          onChange={() => handleSelectAnswer(qIdx, optIdx)}
                          className="mt-0.5 text-emerald-800 focus:ring-emerald-600"
                        />
                        <span className="leading-snug">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Action buttons */}
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
                disabled={!allAnswered}
                className="flex-1 py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white rounded-full text-xs font-medium transition-colors disabled:opacity-50 shadow-sm"
              >
                Submit Assessment
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
