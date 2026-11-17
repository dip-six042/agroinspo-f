/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { CurrencyProvider } from './context/CurrencyContext';
import { RoleProvider, useRole } from './context/RoleContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { Footer } from './components/Footer';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthView, AuthMode } from './components/views/AuthView';
import { OnboardingView } from './components/views/OnboardingView';
import { CommunityView } from './components/views/CommunityView';
import { SettingsView } from './components/views/SettingsView';
import { PaymentResultView } from './components/views/PaymentResultView';
import { VideoConsultationRoom } from './components/VideoConsultationRoom';
import { EnthusiastPortal } from './components/portals/EnthusiastPortal';
import { FarmerPortal } from './components/portals/FarmerPortal';
import { SpecialistPortal } from './components/portals/SpecialistPortal';
import { BusinessPortal } from './components/portals/BusinessPortal';
import { AdminPortal } from './components/portals/AdminPortal';
import { SpecialistsView } from './components/views/SpecialistsView';
import { JobsView } from './components/views/JobsView';
import { EventsView } from './components/views/EventsView';
import { OpportunitiesView } from './components/views/OpportunitiesView';
import { BookstoreView } from './components/views/BookstoreView';
import { ConsultationsView } from './components/views/consultations/ConsultationsView';
import { EarningsView } from './components/views/EarningsView';
import { CreatorView } from './components/views/CreatorView';
import { MessagesView } from './components/views/MessagesView';
import { SupportView } from './components/views/SupportView';
import { SuppliersView } from './components/views/SuppliersView';
import { BusinessView } from './components/views/business/BusinessView';
import { BookingModal } from './components/modals/BookingModal';
import { JobApplyModal } from './components/modals/JobApplyModal';
import { CreatorQuizModal } from './components/modals/CreatorQuizModal';
import { ProgressReportModal } from './components/modals/ProgressReportModal';
import { PostJobModal } from './components/modals/PostJobModal';
import { SubmitOpportunityModal } from './components/modals/SubmitOpportunityModal';
import { CreateAdModal } from './components/modals/CreateAdModal';
import { Specialist, JobListing, ProgressReport } from './types';
import { motion, AnimatePresence } from 'framer-motion';

// Shown above the demo portals for signed-in members, pointing to the tools that are live.
const LiveToolsBanner: React.FC<{ role: string; onNavigate: (v: string) => void }> = ({ role, onNavigate }) => {
  const links: [string, string][] = [
    ['Consultations', 'consultations'],
    ...(role === 'specialist' ? ([['Earnings', 'earnings'], ['My books', 'books:mine'], ['Adverts', 'business:ads']] as [string, string][])
      : role === 'business' ? ([['Business dashboard', 'business'], ['Leads', 'business:leads'], ['Adverts', 'business:ads']] as [string, string][])
      : [['Find a specialist', 'specialists'] as [string, string], ['Suppliers', 'suppliers'] as [string, string]]),
    ['Messages', 'messages'],
    ['Jobs', 'jobs'],
    ['Events', 'events'],
    ['Help & support', 'support']
  ];
  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-8 lg:px-12 pt-8">
      <div className="rounded-2xl bg-ink text-white px-5 py-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px]">
        <span className="text-white/70">The dashboard below is a design preview. Your live tools:</span>
        {links.map(([l, v]) => (
          <button key={v} onClick={() => onNavigate(v)} className="underline underline-offset-4 decoration-lime hover:text-lime">{l}</button>
        ))}
      </div>
    </div>
  );
};

const MainContent: React.FC = () => {
  const { currentRole, activeMeeting, switchRole } = useRole();
  const { user, loading } = useAuth();

  // Views are strings like 'community', 'auth:signup:farmer' or 'settings:moderation'.
  const [currentView, setCurrentView] = useState<string>('landing');
  const [authToken, setAuthToken] = useState<string | undefined>();
  const [base, arg, arg2] = currentView.split(':');

  // Links from verification and password-reset emails arrive as ?verify=… or ?reset=…
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const verify = q.get('verify');
    const reset = q.get('reset');
    const payment = q.get('payment');
    const view = q.get('view');
    // Links in emails can open a specific page (only known, safe destinations).
    if (view && ['business', 'business:invites', 'support', 'earnings', 'consultations'].includes(view)) {
      setCurrentView(view);
      window.history.replaceState(null, '', window.location.pathname);
    } else if (payment) {
      setCurrentView(`payment:${payment}`);
      window.history.replaceState(null, '', window.location.pathname);
    } else if (verify || reset) {
      setAuthToken(verify || reset || undefined);
      setCurrentView(verify ? 'auth:verify' : 'auth:reset');
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  // A signed-in member always sees the portal for their own role.
  useEffect(() => {
    if (user) switchRole(user.role);
  }, [user?.role]);

  // Members who haven't finished onboarding are taken there first.
  useEffect(() => {
    if (!loading && user && !user.onboarded && base !== 'auth' && base !== 'onboarding') setCurrentView('onboarding');
  }, [user?.id, user?.onboarded, loading, base]);

  // Modal States
  const [selectedSpecialistForBooking, setSelectedSpecialistForBooking] = useState<Specialist | null>(null);
  const [selectedJobForApply, setSelectedJobForApply] = useState<JobListing | null>(null);
  const [isCreatorQuizOpen, setIsCreatorQuizOpen] = useState(false);
  const [activeProgressReport, setActiveProgressReport] = useState<ProgressReport | null>(null);
  const [isPostJobOpen, setIsPostJobOpen] = useState(false);
  const [isSubmitOppOpen, setIsSubmitOppOpen] = useState(false);
  const [isCreateAdOpen, setIsCreateAdOpen] = useState(false);

  const handleNavigate = (view: string) => {
    setCurrentView(view);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="relative min-h-screen bg-canvas text-ink flex flex-col font-sans">
      {/* Top Navbar adhering strictly to Top Bar Contract */}
      <Navbar currentView={currentView} onNavigate={handleNavigate} />

      {/* Main View Area with Framer Motion transitions */}
      <main className="flex-1 overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${base}-${arg ?? ''}-${currentRole}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            {base === 'auth' && (
              <AuthView
                mode={(arg as AuthMode) || 'login'}
                token={authToken}
                initialRole={arg2 as any}
                onNavigate={handleNavigate}
                onAuthenticated={(first) => handleNavigate(first ? 'onboarding' : 'community')}
              />
            )}

            {base === 'onboarding' && <OnboardingView onDone={() => handleNavigate('community')} />}

            {base === 'community' && <CommunityView onNavigate={handleNavigate} />}

            {base === 'settings' && <SettingsView initialTab={arg} onNavigate={handleNavigate} />}

            {base === 'payment' && arg && <PaymentResultView reference={arg} onNavigate={handleNavigate} />}

            {currentView === 'landing' && (
              <LandingPage
                onNavigate={handleNavigate}
                onBookSpecialist={(spec) => setSelectedSpecialistForBooking(spec)}
              />
            )}

            {base === 'specialists' && <SpecialistsView id={arg} onNavigate={handleNavigate} />}

            {base === 'consultations' && <ConsultationsView sub={arg} id={arg2} onNavigate={handleNavigate} />}

            {base === 'earnings' && <EarningsView onNavigate={handleNavigate} />}

            {base === 'creator' && <CreatorView onNavigate={handleNavigate} />}

            {base === 'messages' && <MessagesView id={arg} onNavigate={handleNavigate} />}

            {base === 'support' && <SupportView id={arg} onNavigate={handleNavigate} />}

            {base === 'suppliers' && <SuppliersView key={arg ?? ''} id={arg} onNavigate={handleNavigate} />}

            {base === 'business' && <BusinessView sub={arg} businessId={arg2} onNavigate={handleNavigate} />}

            {base === 'jobs' && <JobsView sub={arg} id={arg2} onNavigate={handleNavigate} />}

            {base === 'events' && <EventsView key={`${arg ?? ''}-${arg2 ?? ''}`} sub={arg} id={arg2} onNavigate={handleNavigate} />}

            {currentView === 'opportunities' && (
              <OpportunitiesView
                onViewProgressReport={(rep) => setActiveProgressReport(rep)}
                onSubmitOpportunityModal={() => setIsSubmitOppOpen(true)}
              />
            )}

            {base === 'books' && <BookstoreView sub={arg} onNavigate={handleNavigate} />}

            {base === 'portal' && (
              <div>
                {user && currentRole !== 'admin' && <LiveToolsBanner role={user.role} onNavigate={handleNavigate} />}
                {currentRole === 'enthusiast' && (
                  <EnthusiastPortal
                    onOpenCreatorQuiz={() => (user ? handleNavigate('creator') : setIsCreatorQuizOpen(true))}
                    onApplyJob={(job) => (user ? handleNavigate('jobs') : setSelectedJobForApply(job))}
                  />
                )}
                {currentRole === 'farmer' && (
                  <FarmerPortal
                    onBookSpecialist={(spec) => (user ? handleNavigate('specialists') : setSelectedSpecialistForBooking(spec))}
                    onViewProgressReport={(rep) => setActiveProgressReport(rep)}
                    onPostJobModal={() => (user ? handleNavigate('jobs:new') : setIsPostJobOpen(true))}
                    onSubmitOpportunityModal={() => setIsSubmitOppOpen(true)}
                  />
                )}
                {currentRole === 'specialist' && (
                  <SpecialistPortal
                    onPublishBookModal={() => handleNavigate(user ? 'books:mine' : 'auth:signup:specialist')}
                  />
                )}
                {currentRole === 'business' && (
                  <BusinessPortal
                    onPostJobModal={() => (user ? handleNavigate('jobs:new') : setIsPostJobOpen(true))}
                    onCreateAdModal={() => (user ? handleNavigate('business:ads') : setIsCreateAdOpen(true))}
                  />
                )}
                {currentRole === 'admin' && <AdminPortal key={arg ?? ''} tab={arg} />}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer onNavigate={handleNavigate} />

      {/* Active Encrypted In-Browser Video Consultation Room */}
      {activeMeeting && <VideoConsultationRoom />}

      {/* Booking Modal */}
      {selectedSpecialistForBooking && (
        <BookingModal
          specialist={selectedSpecialistForBooking}
          onClose={() => setSelectedSpecialistForBooking(null)}
          onSuccess={() => setCurrentView('portal')}
        />
      )}

      {/* Job Application Modal */}
      {selectedJobForApply && (
        <JobApplyModal
          job={selectedJobForApply}
          onClose={() => setSelectedJobForApply(null)}
        />
      )}

      {/* Creator Screening Quiz Modal */}
      {isCreatorQuizOpen && (
        <CreatorQuizModal onClose={() => setIsCreatorQuizOpen(false)} />
      )}

      {/* Milestone Progress Report Modal */}
      {activeProgressReport && (
        <ProgressReportModal
          report={activeProgressReport}
          onClose={() => setActiveProgressReport(null)}
        />
      )}

      {/* Post Job Modal */}
      {isPostJobOpen && (
        <PostJobModal onClose={() => setIsPostJobOpen(false)} />
      )}

      {/* Submit Farm Opportunity Proposal Modal */}
      {isSubmitOppOpen && (
        <SubmitOpportunityModal onClose={() => setIsSubmitOppOpen(false)} />
      )}

      {/* Create Sponsored Ad Modal */}
      {isCreateAdOpen && (
        <CreateAdModal onClose={() => setIsCreateAdOpen(false)} />
      )}
    </div>
  );
};

export default function App() {
  return (
    <CurrencyProvider>
      <AuthProvider>
        <RoleProvider>
          <MainContent />
        </RoleProvider>
      </AuthProvider>
    </CurrencyProvider>
  );
}
