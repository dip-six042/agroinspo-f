import React, { useState, useEffect, useRef } from 'react';
import { useRole } from '../context/RoleContext';
import { useCurrency } from '../context/CurrencyContext';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  PhoneOff,
  MessageSquare,
  FileText,
  Clock,
  ShieldCheck,
  Send,
  Download,
  CheckCircle,
  ExternalLink
} from 'lucide-react';

export const VideoConsultationRoom: React.FC = () => {
  const { activeMeeting, closeMeetingRoom, updateSessionNotes, currentUser } = useRole();
  const { formatMoney } = useCurrency();

  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [activeTab, setActiveTab] = useState<'notes' | 'chat'>('notes');
  const [elapsedSeconds, setElapsedSeconds] = useState(745); // ~12 mins into 45 min consultation
  const [notes, setNotes] = useState(activeMeeting?.sessionNotes || '');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; text: string; time: string }>>([
    {
      sender: activeMeeting?.specialistName || 'Specialist',
      text: 'Good morning! I have reviewed the soil chemistry assay from your Iseyin farm.',
      time: '11:02 AM'
    },
    {
      sender: activeMeeting?.farmerName || 'Farmer',
      text: 'Thank you Doctor. We are particularly concerned about the nitrogen deficiency symptoms on block B.',
      time: '11:04 AM'
    },
    {
      sender: activeMeeting?.specialistName || 'Specialist',
      text: 'I am sharing my screen now with the recommended foliar application and CAN side-dressing rates.',
      time: '11:06 AM'
    }
  ]);
  const [newChatText, setNewChatText] = useState('');
  const [cameraError, setCameraError] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Attempt real webcam if user toggles video
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (isVideoOn && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: false })
        .then((s) => {
          stream = s;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = s;
          }
          setCameraError(false);
        })
        .catch(() => {
          setCameraError(true);
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isVideoOn]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatText.trim()) return;

    setChatMessages((prev) => [
      ...prev,
      {
        sender: currentUser.name,
        text: newChatText.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setNewChatText('');
  };

  const handleSaveNotes = () => {
    if (activeMeeting) {
      updateSessionNotes(activeMeeting.id, notes);
    }
  };

  const handleDownloadSummary = () => {
    const summaryText = `AGRO INSPO — OFFICIAL CONSULTATION SESSION RECORD
=====================================================
Meeting Reference : ${activeMeeting?.id}
Date & Time       : ${activeMeeting?.scheduledDate} ${activeMeeting?.scheduledTime}
Specialist        : ${activeMeeting?.specialistName} (${activeMeeting?.specialistTitle})
Client / Farmer   : ${activeMeeting?.farmerName}
Farm              : ${activeMeeting?.farmName || 'Commercial Farm'}
Agreed Objective  : ${activeMeeting?.objective}
Duration Elapsed  : ${formatTimer(elapsedSeconds)} / ${activeMeeting?.durationMinutes} mins
Consultation Fee  : ${formatMoney(activeMeeting?.feeNGN || 18000)}

SPECIALIST CLINICAL / AGRONOMIC SESSION NOTES:
---------------------------------------------
${notes || 'No custom notes entered.'}

PLATFORM COMPLIANCE ATTESTATION:
- Verified Agricultural Consultation under Agro Inspo Ecosystem Terms.
- Audio/Video session securely delivered. Session metadata recorded.
- Issued: ${new Date().toLocaleString()}
`;

    const blob = new Blob([summaryText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AgroInspo_Session_${activeMeeting?.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!activeMeeting) return null;

  return (
    <div className="fixed inset-0 z-50 bg-ink text-slate-100 flex flex-col font-sans">
      {/* Top Session Bar */}
      <div className="h-14 border-b border-white/10 px-6 flex items-center justify-between shrink-0 bg-ink-soft/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-medium text-white tracking-tight text-sm md:text-base">
            Consultation Session: {activeMeeting.objective}
          </span>
          <span className="hidden md:inline text-xs text-white/50">·</span>
          <span className="hidden md:flex items-center gap-1 text-xs text-emerald-300 font-mono-numbers">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Verified Encrypted Channel
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-black/40 rounded-full border border-white/10 text-xs font-mono-numbers text-emerald-400">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTimer(elapsedSeconds)}</span>
            <span className="text-white/40">/ {activeMeeting.durationMinutes}:00</span>
          </div>

          <button
            onClick={closeMeetingRoom}
            className="flex items-center gap-2 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-full text-xs font-medium transition-colors"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">End Call</span>
          </button>
        </div>
      </div>

      {/* Main Video Viewport & Side Panel */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left / Center: Video Stage */}
        <div className="flex-1 flex flex-col p-4 md:p-6 bg-black/60 relative">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 relative min-h-[300px]">
            {/* Remote Participant Stream (Specialist / Farmer) */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-white/10 shadow-2xl flex flex-col justify-end">
              {isScreenSharing ? (
                <div className="absolute inset-0 bg-ink-soft flex flex-col p-6 overflow-y-auto">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                    <div className="flex items-center gap-2 text-xs font-medium text-emerald-400">
                      <Monitor className="w-4 h-4" />
                      Screen Share: Diagnostic Soil & Foliar Protocol
                    </div>
                    <span className="text-xs text-white/50">GreenPeak Block B Analysis</span>
                  </div>
                  <div className="bg-black/40 rounded-xl p-4 border border-white/10 space-y-3 text-xs">
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-white/60">Sample Date:</span>
                      <span className="font-mono-numbers text-white">October 2026</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-white/60">Soil pH (1:1 H2O):</span>
                      <span className="font-mono-numbers text-amber-400">5.9 (Slightly Acidic)</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-white/60">Available Nitrogen:</span>
                      <span className="font-mono-numbers text-rose-400">14.2 mg/kg (Deficient)</span>
                    </div>
                    <div className="flex justify-between pb-2">
                      <span className="text-white/60">Recommended Action:</span>
                      <span className="text-emerald-300">Side-dress 85kg CAN / Ha prior to tasseling</span>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-emerald-950/40 border border-emerald-500/20 rounded-lg text-[11px] text-emerald-200">
                    Live telemetry feed from agricultural laboratory. Verified by Dr. Folashade Adeleke.
                  </div>
                </div>
              ) : (
                <img
                  src={activeMeeting.specialistAvatar}
                  alt={activeMeeting.specialistName}
                  className="absolute inset-0 w-full h-full object-cover opacity-90"
                />
              )}

              {/* Gradient scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

              <div className="relative p-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-white drop-shadow">
                    {activeMeeting.specialistName}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-900/80 border border-emerald-500/30 text-emerald-300">
                    Host Specialist
                  </span>
                </div>

                {/* Animated Audio Meter */}
                <div className="flex items-center gap-1">
                  <div className="w-1 h-3 bg-emerald-400 rounded-full animate-bounce" />
                  <div className="w-1 h-5 bg-emerald-400 rounded-full animate-pulse" />
                  <div className="w-1 h-2 bg-emerald-400 rounded-full animate-bounce" />
                </div>
              </div>
            </div>

            {/* Local Stream (User) */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-white/10 shadow-2xl flex flex-col justify-end">
              {isVideoOn ? (
                cameraError ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-800">
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-24 h-24 rounded-full object-cover border-2 border-emerald-500/40 mb-3 shadow"
                    />
                    <p className="text-xs text-white/70">Camera Stream Active (Simulated Feed)</p>
                    <p className="text-[11px] text-white/40 mt-1">Webcam hardware permission restricted in sandbox</p>
                  </div>
                ) : (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
                  />
                )
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950">
                  <div className="w-20 h-20 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-white font-semibold text-xl">
                    {currentUser.name.charAt(0)}
                  </div>
                  <span className="text-xs text-white/50 mt-3">Camera is turned off</span>
                </div>
              )}

              {/* Scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

              <div className="relative p-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-white drop-shadow">
                    {currentUser.name} (You)
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-white/10 text-white/70">
                    {currentUser.role === 'farmer' ? 'Farm Client' : 'Participant'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {!isAudioOn && (
                    <span className="p-1 rounded bg-rose-500/80 text-white">
                      <MicOff className="w-3.5 h-3.5" />
                    </span>
                  )}
                  {!isVideoOn && (
                    <span className="p-1 rounded bg-rose-500/80 text-white">
                      <VideoOff className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Floating In-Call Controls Bar */}
          <div className="h-16 mt-4 flex items-center justify-center gap-3">
            <button
              onClick={() => setIsAudioOn(!isAudioOn)}
              className={`p-3.5 rounded-full transition-all ${
                isAudioOn
                  ? 'bg-white/10 hover:bg-white/20 text-white'
                  : 'bg-rose-600 hover:bg-rose-500 text-white'
              }`}
              title={isAudioOn ? 'Mute Microphone' : 'Unmute Microphone'}
            >
              {isAudioOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>

            <button
              onClick={() => setIsVideoOn(!isVideoOn)}
              className={`p-3.5 rounded-full transition-all ${
                isVideoOn
                  ? 'bg-white/10 hover:bg-white/20 text-white'
                  : 'bg-rose-600 hover:bg-rose-500 text-white'
              }`}
              title={isVideoOn ? 'Turn Off Video' : 'Turn On Video'}
            >
              {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>

            <button
              onClick={() => setIsScreenSharing(!isScreenSharing)}
              className={`p-3.5 rounded-full transition-all ${
                isScreenSharing
                  ? 'bg-lime hover:bg-lime-deep text-ink'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
              title={isScreenSharing ? 'Stop Screen Sharing' : 'Share Presentation Screen'}
            >
              <Monitor className="w-5 h-5" />
            </button>

            <button
              onClick={() => setActiveTab(activeTab === 'notes' ? 'chat' : 'notes')}
              className="lg:hidden p-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white"
              title="Toggle Notes/Chat"
            >
              {activeTab === 'notes' ? <FileText className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
            </button>

            <button
              onClick={closeMeetingRoom}
              className="px-5 py-3.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs flex items-center gap-2 shadow-lg shadow-rose-950/40"
            >
              <PhoneOff className="w-4 h-4" />
              <span>Leave Room</span>
            </button>
          </div>
        </div>

        {/* Right Sidebar: Notes & In-Call Chat */}
        <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-white/10 bg-ink-soft flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-white/10">
            <button
              onClick={() => setActiveTab('notes')}
              className={`flex-1 py-3 text-xs font-medium flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'notes'
                  ? 'text-emerald-400 border-b-2 border-emerald-400 bg-white/5'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Session Notes</span>
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-3 text-xs font-medium flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'chat'
                  ? 'text-emerald-400 border-b-2 border-emerald-400 bg-white/5'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Live Chat</span>
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'notes' ? (
            <div className="flex-1 flex flex-col p-4 overflow-y-auto">
              <div className="mb-3">
                <span className="text-xs font-medium text-white">Deliverables & Recommendations</span>
                <p className="text-[11px] text-white/50 mt-0.5">
                  Live mutual records. Both client and specialist receive this verified summary.
                </p>
              </div>

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Type agronomic dosages, soil amendment prescriptions, and follow-up milestones here..."
                rows={10}
                className="w-full flex-1 bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/50 resize-none font-sans leading-relaxed"
              />

              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={handleSaveNotes}
                  className="flex-1 py-2 px-3 bg-lime hover:bg-lime-deep text-ink rounded-full text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Save Notes
                </button>
                <button
                  onClick={handleDownloadSummary}
                  className="py-2 px-3 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                  title="Download Official Record"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export .txt
                </button>
              </div>

              <div className="mt-4 p-3 bg-black/30 rounded-xl border border-white/5 text-[11px] space-y-1 text-white/60">
                <div className="flex justify-between">
                  <span>Specialist Fee:</span>
                  <span className="text-white font-mono-numbers">{formatMoney(activeMeeting.feeNGN)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform Commission:</span>
                  <span className="text-white font-mono-numbers">{formatMoney(activeMeeting.platformFeeNGN)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Reconciliation Ref:</span>
                  <span className="text-emerald-400 font-mono-numbers">{activeMeeting.id}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col p-4 overflow-hidden">
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${
                      msg.sender === currentUser.name ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div className="flex items-center gap-1 text-[10px] text-white/40 mb-1">
                      <span>{msg.sender}</span>
                      <span>·</span>
                      <span>{msg.time}</span>
                    </div>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                        msg.sender === currentUser.name
                          ? 'bg-emerald-700 text-white rounded-br-none'
                          : 'bg-white/10 text-slate-100 rounded-bl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendMessage} className="mt-3 flex gap-2 pt-2 border-t border-white/10">
                <input
                  type="text"
                  value={newChatText}
                  onChange={(e) => setNewChatText(e.target.value)}
                  placeholder="Type a message to specialist..."
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-emerald-500/50"
                />
                <button
                  type="submit"
                  className="p-2.5 bg-lime hover:bg-lime-deep text-ink rounded-full transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
