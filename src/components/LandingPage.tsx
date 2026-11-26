import React, { useEffect, useState } from 'react';
import { api, EventItem, Job, JOB_TYPE_LABELS, SpecialistSummary, TOPIC_LABELS } from '../lib/api';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './ui';
import { RoleType } from '../types';
import { placeLabel } from '../data/places';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ArrowUpRight,
  ArrowLeft,
  Video,
  Briefcase,
  Radio,
  Megaphone,
  MessagesSquare,
  Handshake,
  BadgeCheck,
  MapPin
} from 'lucide-react';
import {
  HERO_FARMER_SUNRISE,
  PANORAMIC_FARM,
  AGRONOMIST_IMAGE,
  GREENHOUSE_AGRONOMIST,
  DRONE_DAYLIGHT_IMAGE,
  CASSAVA_FARM_IMAGE,
  FIELD_ROWS_IMAGE,
  DRONE_FARM_IMAGE
} from '../data/mockData';

interface LandingPageProps {
  onNavigate: (view: string) => void;
}

const WRAP = 'max-w-[1320px] mx-auto px-4 sm:px-8 lg:px-12';

/* Small shared pieces ------------------------------------------------------ */

const ArrowDisc: React.FC<{ tone?: 'dark' | 'lime'; icon?: 'right' | 'up' }> = ({ tone = 'dark', icon = 'right' }) => (
  <span
    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:translate-x-0.5 ${
      tone === 'dark' ? 'bg-ink text-lime' : 'bg-lime text-ink'
    }`}
  >
    {icon === 'right' ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
  </span>
);

const Reveal: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-60px' }}
    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

const PagerButtons: React.FC<{ onPrev: () => void; onNext: () => void; light?: boolean }> = ({ onPrev, onNext, light }) => (
  <div className="flex items-center gap-1">
    <button
      onClick={onPrev}
      aria-label="Previous"
      className={`p-1.5 rounded-full transition-colors ${light ? 'text-white/80 hover:bg-white/15' : 'text-ink hover:bg-stone-100'}`}
    >
      <ArrowLeft className="w-4 h-4" />
    </button>
    <button
      onClick={onNext}
      aria-label="Next"
      className={`p-1.5 rounded-full transition-colors ${light ? 'text-white/80 hover:bg-white/15' : 'text-ink hover:bg-stone-100'}`}
    >
      <ArrowRight className="w-4 h-4" />
    </button>
  </div>
);

/* Content ------------------------------------------------------------------ */

const MISSION_CARDS = [
  {
    title: 'Our Mission',
    text: 'To connect farmers anywhere with verified expertise, skilled workers and reliable partners, so good farming knowledge reaches the field faster.'
  },
  {
    title: 'How We Earn Trust',
    text: 'Every badge states what was checked, by whom and when. Fees are shown before you pay, and sponsored content is always labelled.'
  },
  {
    title: 'Who It’s For',
    text: 'Learners and jobseekers, farms of every size, agricultural specialists, and the businesses that supply and support them.'
  }
];

const ABOUT_TABS = {
  about: {
    label: 'About Us',
    kicker: 'Who We Are at Agro Inspo',
    statement:
      'We’re building the practical home for agriculture worldwide: a place to learn, ask an expert, hire good hands and find the right partners, all from one trusted account.',
    body: 'Agro Inspo brings community, live learning, paid consultations, jobs and business listings together, with clear permissions for each kind of member and honest labels on everything we verify.'
  },
  how: {
    label: 'How It Works',
    kicker: 'From Sign-up to Harvest',
    statement:
      'Pick your pathway, tell us your interests and goals, and your feed, events, job alerts and expert suggestions shape themselves around your farm or career.',
    body: 'Farmers book specialists for audio or video calls, specialists get paid on a published schedule, businesses promote verified products, and everyone learns from the same live and recorded sessions.'
  },
  vision: {
    label: 'Vision',
    kicker: 'Where We’re Headed',
    statement:
      'A trusted agricultural ecosystem rather than a static directory, where knowledge, work and partnerships move across countries to the farms that need them.',
    body: 'Your city or state places your profile in a country. You can still browse specialists, jobs and live sessions from every other country.'
  },
  mission: {
    label: 'Mission',
    kicker: 'What Drives Us',
    statement:
      'To make expert agricultural advice, fair work and transparent partnerships accessible to every farmer, whatever the size of their land.',
    body: 'That means verified identities, clear service terms, controlled publication of farm opportunities and plain-language reporting at every step.'
  }
} as const;

type AboutKey = keyof typeof ABOUT_TABS;

const PATHWAYS: { role: RoleType; num: string; title: string; short: string; who: string; can: string[] }[] = [
  {
    role: 'enthusiast',
    num: '01',
    title: 'Agriculture Enthusiast',
    short: 'Enthusiast',
    who: 'Students, career changers and curious minds.',
    can: ['Join discussions and follow topics', 'Attend live events and replays', 'Build a CV and apply to jobs for free']
  },
  {
    role: 'farmer',
    num: '02',
    title: 'Farmer / Farm',
    short: 'Farmer',
    who: 'Smallholders, commercial farms and cooperatives.',
    can: ['Book specialists by audio or video', 'Post vacancies and hire workers', 'Track projects and progress reports']
  },
  {
    role: 'specialist',
    num: '03',
    title: 'Specialist / Consultant',
    short: 'Specialist',
    who: 'Agronomists, vets, engineers and advisors.',
    can: ['Offer paid consultations', 'Publish after topic screening', 'Sell handbooks, see earnings and payouts']
  },
  {
    role: 'business',
    num: '04',
    title: 'Agricultural Business',
    short: 'Business',
    who: 'Input dealers, processors, suppliers and employers.',
    can: ['Get a verified business profile', 'Run labelled adverts and promotions', 'Sponsor events and post jobs']
  }
];

const FEATURES = [
  {
    icon: Video,
    title: 'Specialist Consultations',
    text: 'Find agronomists, vets and engineers by specialty and country, see rates and terms up front, then meet by audio or video in the browser.'
  },
  {
    icon: Radio,
    title: 'Live Events & Replays',
    text: 'Register for masterclasses, get reminders, join live, and catch up later from a searchable library of permitted recordings.'
  },
  {
    icon: Briefcase,
    title: 'Agricultural Jobs',
    text: 'Farms and verified businesses post vacancies in any country; candidates search, save and apply without paying to apply.'
  },
  {
    icon: MessagesSquare,
    title: 'Community & Learning',
    text: 'A feed of posts, videos and threads from screened creators, shaped by the topics and goals you choose.'
  },
  {
    icon: Megaphone,
    title: 'Business Marketplace',
    text: 'Verified agribusinesses promote products and services, with every sponsored placement clearly labelled.'
  },
  {
    icon: Handshake,
    title: 'Projects & Partnerships',
    text: 'Organisations collaborate on farm projects with milestones, evidence and reviewed progress reports.'
  }
];

const EVENT_IMAGES = [GREENHOUSE_AGRONOMIST, DRONE_DAYLIGHT_IMAGE, CASSAVA_FARM_IMAGE, FIELD_ROWS_IMAGE, DRONE_FARM_IMAGE];

const TRUST = [
  {
    title: 'Identity & credentials',
    checked: 'Contact details verified at sign-up; specialists upload certificates for review.',
    notMeant: 'A badge is not a licence or a guarantee of advice outcomes.'
  },
  {
    title: 'Creator screening',
    checked: 'Topic-specific quiz or sample review before publishing rights are granted.',
    notMeant: 'Passing a topic test is not formal accreditation in that field.'
  },
  {
    title: 'Business verification',
    checked: 'Registration evidence and an authorised representative are checked.',
    notMeant: 'It does not certify product quality, solvency or performance.'
  }
];

const FEES = [
  { title: 'Consultations', text: 'Rate set by each specialist. Agro Inspo keeps 10%, and the total is shown before you pay.' },
  { title: 'Job listings', text: 'A fixed fee per listing for employers. Always free for candidates to apply.' },
  { title: 'Adverts & sponsorship', text: 'Package prices by placement and duration. Sponsored content is always labelled, and sponsorships pay a 10% platform fee.' },
  { title: 'Books & learning', text: 'Price set by the author. Agro Inspo keeps 10%, and access is granted to your library after payment.' }
];

/* Page --------------------------------------------------------------------- */

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const { formatMoney } = useCurrency();

  const [aboutTab, setAboutTab] = useState<AboutKey>('about');
  const [missionIndex, setMissionIndex] = useState(0);
  const [eventIndex, setEventIndex] = useState(0);

  const [liveJobs, setLiveJobs] = useState<Job[]>([]);
  const [liveEvents, setLiveEvents] = useState<EventItem[]>([]);
  const [liveExperts, setLiveExperts] = useState<SpecialistSummary[]>([]);
  useEffect(() => {
    api.get<{ specialists: SpecialistSummary[] }>('/specialists').then((r) => setLiveExperts(r.specialists)).catch(() => setLiveExperts([]));
    api.get<{ jobs: Job[] }>('/jobs?limit=4').then((r) => setLiveJobs(r.jobs)).catch(() => setLiveJobs([]));
    api.get<{ events: EventItem[] }>('/events?when=upcoming').then((r) => setLiveEvents(r.events)).catch(() => setLiveEvents([]));
  }, []);
  const featuredEvents = liveEvents.slice(0, 5).map((e) => ({
    id: e.id,
    title: e.title,
    category: TOPIC_LABELS[e.topic] ?? e.topic,
    date: new Date(e.startsAt).toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' }),
    time: new Date(e.startsAt).toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit' }),
    description: e.description,
    hostName: e.host.name,
    hostTitle: e.host.title,
    isLiveNow: e.status === 'live',
    isReplayAvailable: e.replayAvailable
  }));
  const activeEvent = featuredEvents[eventIndex] ?? featuredEvents[0];
  const openJobs = liveJobs.map((j) => ({
    id: j.id,
    title: j.title,
    companyName: j.employer.name,
    isCompanyVerified: j.employer.emailVerified,
    location: j.location,
    employmentType: JOB_TYPE_LABELS[j.employmentType] ?? j.employmentType,
    salaryMinNGN: j.payMin ?? 0,
    salaryMaxNGN: j.payMax ?? j.payMin ?? 0,
    salaryPeriod: j.payPeriod ?? 'month'
  }));
  const about = ABOUT_TABS[aboutTab];

  const cycle = (set: React.Dispatch<React.SetStateAction<number>>, len: number, dir: 1 | -1) =>
    set((i) => (i + dir + len) % len);

  const { user } = useAuth();
  // Visitors go to sign-up with the pathway pre-selected; members go to their portal.
  const joinAs = (role: RoleType) => {
    if (user) return onNavigate('portal');
    onNavigate(`auth:signup:${role}`);
  };

  return (
    <div className="pb-8">
      {/* 1 · HERO ------------------------------------------------------------ */}
      <section className="relative h-[100svh] min-h-[640px] max-h-[900px] overflow-hidden text-white">
        <img
          src={HERO_FARMER_SUNRISE}
          alt="Farmer holding a tablet in a maize field at sunrise"
          className="absolute inset-0 w-full h-full object-cover object-[60%_center]"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/35" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-transparent to-transparent" />

        <div className={`${WRAP} relative h-full flex flex-col justify-end pb-12 sm:pb-16`}>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-2xl"
            >
              <span className="inline-flex px-4 py-1.5 rounded-full border border-white/30 bg-white/10 backdrop-blur-md text-xs">
                Agriculture, worldwide
              </span>
              <h1 className="mt-6 font-display font-normal text-[44px] leading-[1.02] sm:text-[64px] lg:text-[76px] tracking-[-0.035em]">
                Grow, Learn and Hire in One Trusted Network.
              </h1>
              <p className="mt-6 max-w-lg text-[15px] leading-relaxed text-white/80">
                Agro Inspo is a global agricultural platform connecting farmers, agricultural professionals, businesses,
                organizations and enthusiasts to knowledge, services, opportunities and communities across borders. Learn,
                connect, collaborate and grow, wherever you are.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-5">
                <button
                  onClick={() => joinAs('farmer')}
                  className="group inline-flex items-center gap-3 h-12 pl-6 pr-2.5 rounded-full bg-lime hover:bg-lime-deep text-ink text-sm font-medium transition-colors"
                >
                  Join the Ecosystem
                  <ArrowDisc />
                </button>
                <button
                  onClick={() => onNavigate('specialists')}
                  className="inline-flex items-center h-12 px-5 rounded-full bg-black/55 text-white text-sm backdrop-blur-md border border-white/25 hover:bg-black/70 transition-colors"
                >
                  Find an Expert
                </button>
              </div>
            </motion.div>

            {/* Glass mission card, bottom right */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-[340px] hidden md:block"
            >
              <div className="rounded-2xl border border-white/20 bg-black/50 backdrop-blur-xl p-6">
                <div className="flex items-center justify-between gap-3">
                  <span className="kicker text-[13px] text-white">{MISSION_CARDS[missionIndex].title}</span>
                  <PagerButtons
                    light
                    onPrev={() => cycle(setMissionIndex, MISSION_CARDS.length, -1)}
                    onNext={() => cycle(setMissionIndex, MISSION_CARDS.length, 1)}
                  />
                </div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={missionIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <p className="mt-3 text-[13px] leading-relaxed text-white/75">{MISSION_CARDS[missionIndex].text}</p>
                  </motion.div>
                </AnimatePresence>
                <button
                  onClick={() => {
                    setAboutTab('mission');
                    document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="mt-5 inline-flex items-center gap-2 text-[13px] border-b border-white/40 pb-0.5 hover:border-white"
                >
                  Learn More <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2 · ABOUT: pill tabs + statement + bento ------------------------------ */}
      <section id="about" className={`${WRAP} pt-14 sm:pt-20 scroll-mt-4`}>
        <div className="border-t border-stone-200 pt-8 flex gap-2 overflow-x-auto -mx-1 px-1" role="tablist">
          {(Object.keys(ABOUT_TABS) as AboutKey[]).map((k) => (
            <button
              key={k}
              role="tab"
              aria-selected={aboutTab === k}
              onClick={() => setAboutTab(k)}
              className={`h-10 px-5 rounded-full text-[13px] whitespace-nowrap border transition-colors ${
                aboutTab === k ? 'bg-lime border-lime text-ink' : 'border-stone-300 text-ink hover:border-ink'
              }`}
            >
              {ABOUT_TABS[k].label}
            </button>
          ))}
        </div>

        <div className="mt-12 sm:mt-16 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          <div className="lg:col-span-4">
            <span className="kicker text-slate-600">{about.kicker}</span>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={aboutTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="lg:col-span-8"
            >
              <h2 className="font-display font-normal text-[28px] sm:text-[40px] leading-[1.18] tracking-[-0.025em] text-balance">
                {about.statement}
              </h2>
              <p className="mt-6 max-w-2xl text-[14px] leading-relaxed text-slate-500">{about.body}</p>
              <button
                onClick={() => document.getElementById('pathways')?.scrollIntoView({ behavior: 'smooth' })}
                className="mt-8 h-10 px-5 rounded-full border border-stone-300 hover:border-ink text-[13px] transition-colors"
              >
                Learn More
              </button>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bento strip: photo · stat · photo · lime stat */}
        <div className="mt-16 sm:mt-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl overflow-hidden h-[240px] sm:h-[300px] bg-stone-200">
            <img src={PANORAMIC_FARM} alt="Mechanised farm with tractor and solar-powered sheds" className="w-full h-full object-cover" loading="lazy" />
          </div>

          <button
            onClick={() => document.getElementById('pathways')?.scrollIntoView({ behavior: 'smooth' })}
            className="group rounded-2xl h-[240px] sm:h-[300px] bg-mist p-6 flex flex-col text-left hover:bg-stone-200/70 transition-colors"
          >
            <div className="w-full flex items-start justify-between">
              <span className="font-display text-[56px] leading-none tracking-[-0.04em]">4</span>
              <ArrowDisc icon="up" />
            </div>
            <span className="mt-auto font-display text-[17px] font-medium">Ways to Join</span>
            <span className="mt-2 text-[13px] leading-relaxed text-slate-500">
              Enthusiast, farmer, specialist or business. Each pathway has its own tools, permissions and verification.
            </span>
          </button>

          <div className="rounded-2xl overflow-hidden h-[240px] sm:h-[300px] bg-stone-200">
            <img src={AGRONOMIST_IMAGE} alt="Agronomist testing soil in a tomato greenhouse" className="w-full h-full object-cover" loading="lazy" />
          </div>

          <button
            onClick={() => onNavigate('jobs')}
            className="group rounded-2xl h-[240px] sm:h-[300px] bg-lime p-6 flex flex-col text-left hover:bg-lime-deep transition-colors"
          >
            <div className="w-full flex items-start justify-between">
              <span className="inline-flex items-start font-display text-[56px] leading-none">
                <span className="mr-[0.42em]">₦</span>
                <span className="tracking-[-0.04em]">0</span>
              </span>
              <ArrowDisc icon="up" />
            </div>
            <span className="mt-auto font-display text-[17px] font-medium">To Apply for a Job</span>
            <span className="mt-2 text-[13px] leading-relaxed text-ink/70">
              Candidates never pay to apply for an ordinary vacancy. Employers pay a listing fee, shown before checkout.
            </span>
          </button>
        </div>
      </section>

      {/* 3 · FOUR PATHWAYS ------------------------------------------------------ */}
      <section id="pathways" className={`${WRAP} pt-24 sm:pt-32 scroll-mt-4`}>
        <Reveal className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          <div className="lg:col-span-4">
            <span className="kicker text-slate-600">Choose Your Pathway</span>
          </div>
          <h2 className="lg:col-span-8 font-display font-normal text-[28px] sm:text-[40px] leading-[1.15] tracking-[-0.025em]">
            One account, four ways to take part.
          </h2>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PATHWAYS.map((p) => (
            <button
              key={p.role}
              onClick={() => joinAs(p.role)}
              className="group text-left rounded-2xl border border-stone-200 bg-white p-6 flex flex-col min-h-[320px] hover:border-ink transition-colors"
            >
              <span className="font-mono-numbers text-xs text-slate-400">{p.num}</span>
              <h3 className="mt-8 font-display text-[22px] font-normal leading-tight">{p.title}</h3>
              <p className="mt-2 text-[13px] text-slate-500">{p.who}</p>
              <ul className="mt-6 space-y-2 text-[13px] text-slate-700">
                {p.can.map((c) => (
                  <li key={c} className="flex gap-2.5">
                    <span className="mt-[7px] w-1 h-1 rounded-full bg-ink shrink-0" />
                    {c}
                  </li>
                ))}
              </ul>
              <span className="mt-auto pt-8 w-full flex items-center justify-between text-[13px] font-medium">
                Join as {p.short}
                <ArrowDisc />
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* 4 · DARK FEATURE PANEL ------------------------------------------------- */}
      <section className={`${WRAP} pt-24 sm:pt-32`}>
        <Reveal>
          <div className="rounded-[28px] bg-ink text-white p-8 sm:p-14 lg:p-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4">
                <span className="kicker text-white/60">What We Do</span>
              </div>
              <div className="lg:col-span-8">
                <h2 className="font-display font-normal text-[28px] sm:text-[36px] leading-[1.2] tracking-[-0.02em] max-w-2xl">
                  Everything a farm, a farmer or a farming career needs, designed for trust, clarity and growth.
                </h2>

                <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-12">
                  {FEATURES.map(({ icon: Icon, title, text }) => (
                    <div key={title}>
                      <span className="w-9 h-9 rounded-lg bg-[#2a3210] text-lime flex items-center justify-center">
                        <Icon className="w-[18px] h-[18px]" />
                      </span>
                      <h3 className="mt-5 text-[15px] font-medium">{title}</h3>
                      <p className="mt-2 text-[13px] leading-relaxed text-white/55 max-w-sm">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* 5 · EVENTS PHOTO PANEL ------------------------------------------------- */}
      {!activeEvent && (
        <section className={`${WRAP} pt-16`}>
          <div className="rounded-[28px] border border-dashed border-stone-300 p-10 text-center">
            <p className="font-display text-[28px]">No live sessions yet.</p>
            <p className="mt-2 text-[14px] text-slate-500">Scheduled webinars from consultants and businesses will show here.</p>
          </div>
        </section>
      )}
      {activeEvent && (
        <section className={`${WRAP} pt-4`}>
          <Reveal>
            <div className="relative rounded-[28px] overflow-hidden min-h-[560px] text-white flex flex-col justify-between p-6 sm:p-10">
              <AnimatePresence mode="wait">
                <motion.img
                  key={eventIndex}
                  src={EVENT_IMAGES[eventIndex % EVENT_IMAGES.length]}
                  alt=""
                  initial={{ opacity: 0.4 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                />
              </AnimatePresence>
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/10 to-transparent" />

              <div className="relative flex flex-wrap items-center justify-between gap-3">
                <span className="px-3.5 py-1.5 rounded-full border border-white/30 bg-white/10 backdrop-blur-md text-xs">
                  Live Events &amp; Replays
                </span>
                {activeEvent.isLiveNow ? (
                  <span className="kicker text-lime">Live now</span>
                ) : activeEvent.isReplayAvailable ? (
                  <span className="kicker text-white/80">Replay available</span>
                ) : (
                  <span className="kicker text-white/80">Upcoming</span>
                )}
              </div>

              <div className="relative">
                <div className="max-w-2xl">
                  <span className="text-xs text-white/70 font-mono-numbers">
                    {activeEvent.category} · {activeEvent.date} · {activeEvent.time}
                  </span>
                  <h3 className="mt-3 font-display font-normal text-[30px] sm:text-[40px] leading-[1.1] tracking-[-0.025em]">
                    {activeEvent.title}
                  </h3>
                  <p className="mt-3 text-[14px] leading-relaxed text-white/75 line-clamp-3">{activeEvent.description}</p>
                  <p className="mt-3 text-[13px] text-white/60">
                    Hosted by {activeEvent.hostName} · {activeEvent.hostTitle}
                  </p>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                  <div className="flex items-center gap-3">
                    {featuredEvents.slice(0, 3).map((e, i) => (
                      <button
                        key={e.id}
                        onClick={() => setEventIndex(i)}
                        aria-label={`Show ${e.title}`}
                        className={`w-24 h-16 sm:w-32 sm:h-20 rounded-xl overflow-hidden border transition-all ${
                          eventIndex === i ? 'border-white' : 'border-white/20 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={EVENT_IMAGES[i % EVENT_IMAGES.length]} alt="" className="w-full h-full object-cover" loading="lazy" />
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-6">
                    <button
                      onClick={() => onNavigate(`events:${activeEvent.id}`)}
                      className="group inline-flex items-center gap-3 h-11 pl-5 pr-2 rounded-full bg-lime text-ink text-[13px] font-medium"
                    >
                      {activeEvent.isReplayAvailable && !activeEvent.isLiveNow ? 'Watch Replay' : 'Register'}
                      <ArrowDisc />
                    </button>
                    <div className="flex items-center gap-3">
                      <span className="font-mono-numbers text-xs text-white/70">
                        [{eventIndex + 1}/{featuredEvents.length}]
                      </span>
                      <PagerButtons
                        light
                        onPrev={() => cycle(setEventIndex, featuredEvents.length, -1)}
                        onNext={() => cycle(setEventIndex, featuredEvents.length, 1)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      )}

      {/* 6 · EXPERTS + JOBS ----------------------------------------------------- */}
      <section className={`${WRAP} pt-24 sm:pt-32 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-12`}>
        <Reveal>
          <span className="kicker text-slate-600">Experts</span>
          <h2 className="mt-5 font-display font-normal text-[26px] sm:text-[32px] leading-[1.2] tracking-[-0.02em] max-w-md">
            Book a vetted specialist by audio or video call.
          </h2>
          <ul className="mt-10 border-t border-stone-200">
            {liveExperts.length === 0 && <li className="py-8 text-[14px] text-slate-500">No specialists have published a profile yet.</li>}
            {liveExperts.slice(0, 4).map((s) => ({
              id: s.id, name: s.name, avatar: s.avatarUrl, verified: s.credentialStatus === 'verified', title: s.title, location: placeLabel(s.location, s.country),
              years: s.experienceYears, price: s.fromPriceNgn, open: () => onNavigate(`specialists:${s.id}`)
            })).map((s) => (
              <li key={s.id} className="border-b border-stone-200">
                <button
                  type="button"
                  onClick={s.open}
                  className="w-full flex items-center gap-3 sm:gap-4 py-4 text-left rounded-xl hover:bg-stone-50 transition-colors"
                >
                  {s.avatar ? <img src={s.avatar} alt="" className="w-12 h-12 rounded-xl object-cover bg-stone-200 shrink-0" loading="lazy" /> : <Avatar name={s.name} size={48} className="rounded-xl" />}
                  <span className="min-w-0 flex-1">
                    <span className="text-[14px] font-medium flex items-center gap-1.5">
                      <span className="truncate">{s.name}</span>
                      {s.verified && <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" aria-label="Credentials checked" />}
                    </span>
                    <span className="block text-[12px] text-slate-500 truncate">{s.title}</span>
                    <span className="text-[12px] text-slate-400 flex items-center gap-1 mt-0.5 min-w-0">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{s.location} · {s.years} yrs</span>
                    </span>
                  </span>
                  <span className="shrink-0 flex flex-col items-end gap-2">
                    {s.price != null && (
                      <span className="text-right">
                        <span className="block text-[13px] font-mono-numbers whitespace-nowrap">from {formatMoney(s.price)}</span>
                        <span className="block text-[11px] text-slate-400">per session</span>
                      </span>
                    )}
                    <span className="inline-flex h-8 items-center px-3.5 rounded-full border border-stone-300 text-[12px]">
                      Book
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <button
            onClick={() => onNavigate('specialists')}
            className="group mt-8 inline-flex items-center gap-3 text-[13px] font-medium"
          >
            See all experts <ArrowDisc />
          </button>
        </Reveal>

        <Reveal>
          <span className="kicker text-slate-600">Jobs</span>
          <h2 className="mt-5 font-display font-normal text-[26px] sm:text-[32px] leading-[1.2] tracking-[-0.02em] max-w-md">
            Agricultural vacancies, free for candidates to apply.
          </h2>
          <ul className="mt-10 border-t border-stone-200">
            {openJobs.length === 0 && <li className="py-8 text-[14px] text-slate-500">No vacancies are listed yet.</li>}
            {openJobs.map((j) => (
              <li key={j.id}>
                <button
                  onClick={() => onNavigate(`jobs:view:${j.id}`)}
                  className="group w-full text-left flex items-center gap-4 py-4 border-b border-stone-200"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium truncate group-hover:underline underline-offset-4">{j.title}</p>
                    <p className="text-[12px] text-slate-500 flex items-center gap-1.5 truncate">
                      {j.companyName}
                      {j.isCompanyVerified && <BadgeCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-label="Verified employer" />}
                    </p>
                    <p className="text-[12px] text-slate-400 mt-0.5">
                      {j.location} · {j.employmentType}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[13px] font-mono-numbers">
                      {formatMoney(j.salaryMinNGN)}–{formatMoney(j.salaryMaxNGN)}
                    </p>
                    <p className="text-[11px] text-slate-400">per {j.salaryPeriod}</p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-ink shrink-0" />
                </button>
              </li>
            ))}
          </ul>
          <button onClick={() => onNavigate('jobs')} className="group mt-8 inline-flex items-center gap-3 text-[13px] font-medium">
            Browse all jobs <ArrowDisc />
          </button>
        </Reveal>
      </section>

      {/* 7 · TRUST & VERIFICATION ---------------------------------------------- */}
      <section className={`${WRAP} pt-24 sm:pt-32`}>
        <Reveal className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          <div className="lg:col-span-4">
            <span className="kicker text-slate-600">Trust &amp; Verification</span>
          </div>
          <div className="lg:col-span-8">
            <h2 className="font-display font-normal text-[28px] sm:text-[40px] leading-[1.15] tracking-[-0.025em] text-balance">
              Every badge says what was checked, by whom and when. Never more than that.
            </h2>
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
              {TRUST.map((t) => (
                <div key={t.title} className="rounded-2xl bg-mist p-6">
                  <BadgeCheck className="w-5 h-5" />
                  <h3 className="mt-6 text-[15px] font-medium">{t.title}</h3>
                  <p className="mt-3 text-[13px] leading-relaxed text-slate-600">{t.checked}</p>
                  <p className="mt-3 text-[12px] leading-relaxed text-slate-400">{t.notMeant}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 text-[12px] leading-relaxed text-slate-500 max-w-2xl">
              Members can report, block or mute any account or post, and appeal moderation decisions. Farm opportunities are only
              published after review, and investment features stay off until legal and compliance approval.
            </p>
          </div>
        </Reveal>
      </section>

      {/* 8 · HOW FEES WORK ------------------------------------------------------ */}
      <section className={`${WRAP} pt-24 sm:pt-32`}>
        <div className="rounded-[28px] bg-mist p-8 sm:p-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4">
              <span className="kicker text-slate-600">Pricing &amp; How It Works</span>
              <h2 className="mt-5 font-display font-normal text-[26px] sm:text-[32px] leading-[1.2] tracking-[-0.02em]">
                Clear fees, shown before you pay.
              </h2>
              <button
                onClick={() => joinAs('farmer')}
                className="group mt-8 inline-flex items-center gap-3 h-11 pl-5 pr-2 rounded-full bg-ink text-white text-[13px] font-medium"
              >
                Get Started <ArrowDisc tone="lime" />
              </button>
            </div>
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-x-10">
              {FEES.map((f) => (
                <div key={f.title} className="py-6 border-t border-stone-300/70">
                  <h3 className="text-[15px] font-medium">{f.title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-slate-600">{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
