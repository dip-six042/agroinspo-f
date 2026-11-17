// Thin client for the Agro Inspo API. Cookies carry the session; every body is JSON.

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// When a team member works for a business, every request says which business it's for.
// The server checks their membership and role on each request; this is only a selector.
let actingBusinessId: string | null = null;
export const setActingBusiness = (id: string | null) => {
  actingBusinessId = id;
};
export const getActingBusiness = () => actingBusinessId;
const actingHeader = (): Record<string, string> => (actingBusinessId ? { 'X-Business-Id': actingBusinessId } : {});

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method,
      credentials: 'same-origin',
      headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...actingHeader() },
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  } catch {
    throw new ApiError(0, 'offline', 'Can’t reach Agro Inspo. Check your connection and try again.');
  }
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    /* empty or non-JSON body */
  }
  if (!res.ok) {
    throw new ApiError(
      res.status,
      data?.error?.code || 'error',
      data?.error?.message || (res.status === 404 ? 'The server is not running. Start it with npm run server.' : 'Something went wrong.')
    );
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body: unknown = {}) => request<T>('POST', path, body),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
  put: <T>(path: string, body: unknown) => request<T>('PUT', path, body),
  del: <T>(path: string) => request<T>('DELETE', path)
};

/* ---------- shared types ---------- */
export type Role = 'enthusiast' | 'farmer' | 'specialist' | 'business' | 'admin';

export interface Me {
  id: string;
  email: string;
  name: string;
  role: Role;
  title: string;
  location: string;
  bio: string;
  avatarUrl: string;
  interests: string[];
  goals: string[];
  privacy: { profileVisibility: 'public' | 'members'; showLocation: boolean; showActivity: boolean };
  notificationPrefs: { comments: boolean; likes: boolean; follows: boolean; email: boolean };
  emailVerified: boolean;
  onboarded: boolean;
  status: 'active' | 'suspended';
  createdAt: string;
  /** Business teams this person belongs to, and pending invitations to join one. */
  team?: { memberOf: number; invites: number };
}

export interface Author {
  id: string;
  name: string;
  role: Role;
  title: string;
  avatarUrl: string;
}

export interface Post {
  id: string;
  topic: string;
  body: string;
  imageUrl: string;
  isSponsored: boolean;
  kind?: 'discussion' | 'article';
  createdAt: string;
  author: Author;
  likeCount: number;
  commentCount: number;
  liked: boolean;
  saved: boolean;
}

export interface Comment {
  id: string;
  parentId: string | null;
  body: string;
  createdAt: string;
  author: Author;
}

export interface LiveNotification {
  id: string;
  kind: string;
  title: string;
  body: string;
  link: string;
  read: boolean;
  createdAt: string;
}

export const TOPIC_LABELS: Record<string, string> = {
  crops: 'Crops',
  poultry: 'Poultry',
  livestock: 'Livestock',
  aquaculture: 'Aquaculture',
  'soil-health': 'Soil health',
  irrigation: 'Irrigation',
  horticulture: 'Horticulture',
  'bsf-insect-farming': 'BSF & insect farming',
  mechanisation: 'Mechanisation',
  agribusiness: 'Agribusiness',
  careers: 'Careers'
};

export const GOAL_LABELS: Record<string, string> = {
  'learn-farming': 'Learn practical farming',
  'find-a-job': 'Find an agricultural job',
  'hire-workers': 'Hire farm workers',
  'get-expert-advice': 'Get expert advice',
  'offer-consulting': 'Offer consulting',
  'grow-my-business': 'Grow my business',
  'find-partners': 'Find partners'
};

export const REPORT_REASON_LABELS: Record<string, string> = {
  spam: 'Spam',
  scam: 'Scam or fraud',
  harassment: 'Harassment or hate',
  misinformation: 'Harmful misinformation',
  inappropriate: 'Inappropriate content',
  other: 'Something else'
};

export function timeAgo(iso: string): string {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d} d ago`;
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

export const initials = (name: string) =>
  name
    .replace(/^(Dr\.|Chief|Engr\.|Mr\.|Mrs\.|Ms\.)\s+/i, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');

/** First name for greetings, skipping honorifics like Dr. or Chief. */
export const firstName = (name: string) =>
  name.replace(/^((Dr|Engr|Prof|Mr|Mrs|Ms|Alhaji|Chief)\.?\s+)+/i, '').split(/\s+/)[0] || name;

/* ---------- Phase 2: jobs, events, payments ---------- */

/** Uploads a file as the raw request body (used for CVs). */
export async function uploadFile<T>(path: string, file: File): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': file.type || 'application/octet-stream', 'X-Filename': encodeURIComponent(file.name), ...actingHeader() },
      body: file
    });
  } catch {
    throw new ApiError(0, 'offline', 'Upload failed. Check your connection and try again.');
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data?.error?.code || 'error', data?.error?.message || 'Upload failed.');
  return data as T;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  responsibilities: string[];
  qualifications: string[];
  category: string;
  employmentType: string;
  workMode: string;
  location: string;
  payMin: number | null;
  payMax: number | null;
  payPeriod: string | null;
  openings: number;
  closingDate: string;
  applyMethod: 'platform' | 'external';
  externalUrl: string;
  plan: string;
  featured: boolean;
  status: string;
  publishedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  employer: { id: string; name: string; role: Role; title: string; emailVerified: boolean };
  saved: boolean;
  myApplication: { id: string; status: string } | null;
  flags?: string[];
  reviewNote?: string;
  applicantCount?: number;
}

export interface EventItem {
  id: string;
  title: string;
  description: string;
  topic: string;
  speakers: string;
  startsAt: string;
  endsAt: string;
  durationMin: number;
  capacity: number | null;
  priceNgn: number;
  recording: boolean;
  replayAccess: 'members' | 'registrants';
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  host: { id: string; name: string; title: string; role: Role };
  registeredCount: number;
  spotsLeft: number | null;
  myRegistration: 'registered' | 'pending_payment' | null;
  isHost: boolean;
  replayAvailable: boolean;
  canJoin: boolean;
  attendedCount?: number;
  replayUrl?: string;
  replayPublished?: boolean;
}

export interface PaymentInfo {
  reference: string;
  purpose: 'job_listing' | 'event_ticket' | 'consultation' | 'book_purchase' | 'advert' | 'sponsorship';
  subjectId: string;
  description: string;
  amountNgn: number;
  feeNgn: number;
  status: 'initiated' | 'pending' | 'successful' | 'failed' | 'refunded' | 'under_review';
  provider: string;
  paidAt: string | null;
  createdAt: string;
  checkoutUrl: string;
}

export const JOB_CATEGORY_LABELS: Record<string, string> = {
  'farm-management': 'Farm management',
  'crop-production': 'Crop production',
  'livestock-poultry': 'Livestock & poultry',
  aquaculture: 'Aquaculture',
  'agronomy-extension': 'Agronomy & extension',
  'agribusiness-sales': 'Agribusiness & sales',
  'processing-storage': 'Processing & storage',
  'machinery-irrigation': 'Machinery & irrigation',
  'research-lab': 'Research & lab',
  'admin-finance': 'Admin & finance'
};
export const JOB_TYPE_LABELS: Record<string, string> = {
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  contract: 'Contract',
  seasonal: 'Seasonal',
  internship: 'Internship'
};
export const WORK_MODE_LABELS: Record<string, string> = { onsite: 'On-site', remote: 'Remote', hybrid: 'Hybrid' };
export const JOB_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  payment_pending: 'Payment pending',
  under_review: 'Under review',
  published: 'Live',
  paused: 'Paused',
  expired: 'Expired',
  rejected: 'Needs changes',
  closed: 'Closed',
  archived: 'Removed'
};
export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  submitted: 'Submitted',
  reviewing: 'Being reviewed',
  shortlisted: 'Shortlisted',
  interview: 'Interview',
  offered: 'Offer made',
  hired: 'Hired',
  rejected: 'Not selected',
  withdrawn: 'Withdrawn'
};

export const formatEventDate = (iso: string) =>
  new Date(iso).toLocaleString('en-NG', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

/* ---------- Phase 3: consultations, earnings, books, creators, messages, support ---------- */

export interface SpecialistSummary {
  id: string;
  name: string;
  title: string;
  headline: string;
  location: string;
  bio: string;
  avatarUrl: string;
  specialties: string[];
  languages: string[];
  serviceArea: string;
  experienceYears: number;
  credentials: string[];
  credentialStatus: 'unverified' | 'pending' | 'verified';
  credentialNote: string;
  accepting: boolean;
  rating: number | null;
  reviewCount: number;
  fromPriceNgn: number | null;
  nextSlot: string | null;
  sessions: number;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  topic: string;
  mode: 'video' | 'audio';
  durationMin: number;
  priceNgn: number;
  active: boolean;
}

export interface Slot {
  id: string;
  startsAt: string;
  durationMin: number;
  status?: string;
}

export interface Booking {
  id: string;
  serviceTitle: string;
  startsAt: string;
  endsAt: string;
  durationMin: number;
  mode: 'video' | 'audio';
  objective: string;
  status: 'payment_pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'refunded' | 'disputed';
  priceNgn: number;
  commissionNgn?: number;
  netNgn?: number;
  specialist: { id: string; name: string; title: string };
  client: { id: string; name: string; title: string };
  notes: string;
  payment: { reference: string; status: string; refundedNgn: number } | null;
  rescheduled: boolean;
  reviewed: boolean;
  cancelReason: string;
  cancelledBy: 'specialist' | 'client' | 'admin' | null;
  role: 'specialist' | 'client';
  canJoin: boolean;
  freeCancel: boolean;
  canReview: boolean;
  canDispute: boolean;
}

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  payment_pending: 'Awaiting payment',
  confirmed: 'Confirmed',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'Missed',
  refunded: 'Refunded',
  disputed: 'In dispute'
};

export interface Balances {
  availableNgn: number;
  pendingNgn: number;
  heldNgn: number;
  inPayoutNgn: number;
  grossNgn: number;
  platformFeesNgn: number;
  refundsNgn: number;
  paidOutNgn: number;
}

export interface LedgerEntry {
  id: string;
  type: string;
  amountNgn: number;
  sourceType: string;
  sourceId: string;
  availableAt: string;
  memo: string;
  createdAt: string;
  pending: boolean;
}

export interface Book {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  topic: string;
  language: string;
  pages: number | null;
  priceNgn: number;
  status: 'draft' | 'under_review' | 'published' | 'rejected' | 'suspended';
  publishedAt: string | null;
  author: { id: string; name: string; title: string };
  hasCover: boolean;
  hasSample: boolean;
  owned: boolean;
  sales?: number;
  hasBookFile?: boolean;
  reviewNote?: string;
  rightsDeclared?: boolean;
  netPerSaleNgn?: number;
  purchase?: { id: string; paidAt: string };
}

export interface Ticket {
  id: string;
  category: string;
  subjectType: string;
  subjectId: string;
  title: string;
  status: 'open' | 'waiting_on_user' | 'resolved';
  resolution: string;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; name: string };
  messages?: { id: string; body: string; fromStaff: boolean; name: string; createdAt: string }[];
}

/** Starts a conversation with a member and returns its id. */
export const startConversation = (userId: string) => api.post<{ conversationId: string }>('/conversations', { userId }).then((r) => r.conversationId);

/* ---------- Phase 4: business, listings, adverts, sponsorship ---------- */

export interface BusinessProfile {
  id: string;
  name: string;
  legalName: string;
  tradingName: string;
  category: string;
  region: string;
  serviceArea: string;
  website: string;
  socials: string[];
  about: string;
  avatarUrl: string;
  verification: { status: 'unverified' | 'pending' | 'verified' | 'rejected'; scope: string; verifiedAt: string | null };
  // Private fields (owner and admins only)
  rcNumber?: string;
  address?: string;
  contactName?: string;
  contactRole?: string;
  phone?: string;
  verificationNote?: string;
  submittedAt?: string | null;
  evidence?: { fileId: string; label: string; filename: string }[];
  listingCount?: number;
  accountName?: string;
  email?: string;
}

export interface Listing {
  id: string;
  businessId: string;
  kind: 'product' | 'service';
  title: string;
  description: string;
  topic: string;
  priceType: 'fixed' | 'from' | 'quote';
  priceNgn: number | null;
  unit: string;
  serviceArea: string;
  availability: string;
  imageUrl: string;
  status: 'draft' | 'published' | 'hidden' | 'removed';
  createdAt: string;
  business?: { id: string; name: string; verified: boolean };
}

export interface AdMetrics {
  impressions: number;
  clicks: number;
  enquiries: number;
  ctrPct: number | null;
  spendNgn: number;
  daily: { day: string; impressions: number; clicks: number }[];
}

export interface Advert {
  id: string;
  placement: 'feed' | 'events' | 'jobs';
  package: string;
  days: number;
  headline: string;
  body: string;
  imageUrl: string;
  cta: 'enquire' | 'website';
  url: string;
  listingId: string | null;
  targetTopic: string;
  targetRegion: string;
  startsOn: string;
  endsOn: string;
  priceNgn: number;
  status: 'draft' | 'payment_pending' | 'in_review' | 'scheduled' | 'live' | 'paused' | 'rejected' | 'suspended' | 'cancelled' | 'ended';
  reviewNote: string;
  createdAt: string;
  advertiser: { id: string; name: string; role: string };
  flags?: string[];
  metrics?: AdMetrics;
  label?: string;
  advertiserVerification?: string;
}

export const AD_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft', payment_pending: 'Awaiting payment', in_review: 'In review', scheduled: 'Scheduled', live: 'Live', paused: 'Paused',
  rejected: 'Needs changes', suspended: 'Suspended', cancelled: 'Cancelled', ended: 'Ended'
};

export interface Lead {
  id: string;
  message: string;
  phone: string;
  status: 'new' | 'contacted' | 'won' | 'closed';
  createdAt: string;
  conversationId: string;
  from: { id: string; name: string; title: string; role: string };
  source: { type: 'advert' | 'listing' | 'profile'; label: string };
}

export interface SponsorPackage {
  id: string;
  eventId: string;
  name: string;
  priceNgn: number;
  benefits: string;
  deliverables: string[];
  speakingSlot: boolean;
  exclusive: boolean;
  slots: number;
  cancellation: string;
  active: boolean;
  available: number;
  hostNetNgn: number;
}

export interface Sponsorship {
  id: string;
  status: 'requested' | 'accepted' | 'declined' | 'confirmed' | 'cancelled' | 'refunded' | 'completed';
  displayName: string;
  link: string;
  message: string;
  declineNote: string;
  logoUrl: string;
  deliverables: { item: string; done: boolean; evidence: string; doneAt: string | null }[];
  createdAt: string;
  package: { id: string; name: string; priceNgn: number; cancellation: string };
  event: { id: string; title: string; startsAt: string; status: string };
  business: { id: string; name: string };
  role: 'host' | 'sponsor' | 'admin';
  canCancelWithRefund: boolean;
}

export const SPONSORSHIP_STATUS_LABELS: Record<string, string> = {
  requested: 'Waiting for the host', accepted: 'Accepted: pay to confirm', declined: 'Declined', confirmed: 'Confirmed',
  cancelled: 'Cancelled', refunded: 'Refunded', completed: 'Completed'
};

export const priceLabel = (l: Pick<Listing, 'priceType' | 'priceNgn' | 'unit'>) =>
  l.priceType === 'quote' || l.priceNgn == null
    ? 'Price on request'
    : `${l.priceType === 'from' ? 'From ' : ''}₦${l.priceNgn.toLocaleString('en-NG')}${l.unit ? ` ${l.unit}` : ''}`;

/* ---------- Business teams ---------- */
export interface MyBusinessLink { id: string; name: string; role: 'owner' | 'admin' | 'marketing' | 'sales'; permissions: string[] }
export interface BusinessInvite { id: string; business: { id: string; name: string }; role: string; roleLabel: string; invitedBy: string; expiresAt: string }
export interface TeamData {
  owner: { id: string; name: string; email: string };
  members: { id: string; name: string; email: string; role: 'admin' | 'marketing' | 'sales'; status: string; addedBy: string | null; since: string }[];
  invites: { id: string; email: string; role: string; expiresAt: string; expired: boolean }[];
  roles: Record<string, { label: string; description: string }>;
  myRole?: string;
}
export const TEAM_ROLE_LABELS: Record<string, string> = { owner: 'Owner', admin: 'Admin', marketing: 'Marketing', sales: 'Sales' };
