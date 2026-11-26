export type RoleType = 'enthusiast' | 'farmer' | 'specialist' | 'business' | 'admin';

export type Currency = 'NGN' | 'USD';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: RoleType;
  avatar: string;
  title: string;
  location: string;
  bio: string;
  isVerified: boolean;
  verificationBadgeText?: string;
  interests?: string[];
  balanceNGN: number;
  pendingBalanceNGN: number;
}

export interface Specialist {
  id: string;
  name: string;
  title: string;
  avatar: string;
  rating: number;
  reviewCount: number;
  location: string;
  specialties: string[];
  experienceYears: number;
  hourlyRateNGN: number;
  verifiedCredentials: string[];
  languages: string[];
  bio: string;
  isAvailableToday: boolean;
  upcomingSlots: string[];
}

export interface ConsultationBooking {
  id: string;
  specialistId: string;
  specialistName: string;
  specialistTitle: string;
  specialistAvatar: string;
  farmerName: string;
  farmName?: string;
  scheduledDate: string;
  scheduledTime: string;
  durationMinutes: number;
  feeNGN: number;
  platformFeeNGN: number;
  status: 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  objective: string;
  sessionNotes?: string;
  roomId: string;
}

export interface JobListing {
  id: string;
  title: string;
  companyName: string;
  companyType: 'farm' | 'business';
  companyLogo?: string;
  isCompanyVerified: boolean;
  location: string;
  employmentType: 'Full-time' | 'Contract' | 'Seasonal' | 'Part-time';
  salaryMinNGN: number;
  salaryMaxNGN: number;
  salaryPeriod: 'month' | 'project' | 'year';
  description: string;
  requirements: string[];
  responsibilities: string[];
  applicantsCount: number;
  deadline: string;
  postedAt: string;
  status: 'published' | 'under_review' | 'closed';
  category: string;
}

export interface JobApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  experienceSummary: string;
  cvFileName: string;
  status: 'pending' | 'reviewing' | 'shortlisted' | 'rejected';
  submittedAt: string;
}

export interface CommunityPost {
  id: string;
  authorName: string;
  authorRole: RoleType;
  authorTitle: string;
  authorAvatar: string;
  isVerified: boolean;
  isScreenedCreator: boolean;
  content: string;
  image?: string;
  topic: string;
  likesCount: number;
  isLiked?: boolean;
  commentsCount: number;
  sharesCount: number;
  publishedAt: string;
  isSponsored?: boolean;
}

export interface LiveEvent {
  id: string;
  title: string;
  hostName: string;
  hostTitle: string;
  hostAvatar: string;
  date: string;
  time: string;
  durationMinutes: number;
  category: string;
  attendeesCount: number;
  isLiveNow: boolean;
  isReplayAvailable: boolean;
  replayViews?: number;
  description: string;
  recordingUrl?: string;
  isRegistered?: boolean;
}

export interface DigitalBook {
  id: string;
  title: string;
  authorName: string;
  authorSpecialty: string;
  priceNGN: number;
  coverImage?: string;
  description: string;
  pageCount: number;
  downloadsCount: number;
  rating: number;
  category: string;
  sampleChapter: string;
  isPurchased?: boolean;
}

export interface FarmOpportunity {
  id: string;
  farmName: string;
  title: string;
  location: string;
  cropOrLivestock: string;
  hectares: number;
  fundingTargetNGN: number;
  fundedNGN: number;
  durationMonths: number;
  projectedReturnRange: string;
  riskRating: 'Low-Medium' | 'Medium' | 'Calculated High';
  summary: string;
  useOfFunds: { item: string; percentage: number }[];
  milestonesCount: number;
  status: 'approved' | 'under_review' | 'funded';
  verificationScope: string;
  farmImage: string;
}

export interface ProgressReport {
  id: string;
  opportunityId: string;
  farmName: string;
  reportingPeriod: string;
  overallStatus: 'on_track' | 'at_risk' | 'completed' | 'delayed';
  milestoneTitle: string;
  progressPercent: number;
  productionMetrics: { label: string; value: string; unit: string }[];
  narrative: string;
  evidenceNotes: string;
  evidenceImages: string[];
  submittedAt: string;
  approvedBy: string;
}

export interface BusinessAdCampaign {
  id: string;
  businessName: string;
  headline: string;
  tagline: string;
  targetCategory: string;
  targetRegion: string;
  budgetDailyNGN: number;
  totalSpendNGN: number;
  impressions: number;
  clicks: number;
  leadsGenerated: number;
  status: 'active' | 'paused' | 'under_review';
  bannerImage?: string;
}

export interface CreatorApplication {
  id: string;
  applicantName: string;
  topic: string;
  sampleOutline: string;
  scorePercent: number;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewerNotes?: string;
}

export interface LedgerEntry {
  id: string;
  date: string;
  type: 'Consultation Earned' | 'Platform Fee (10%)' | 'Book Sale Net' | 'Ad Campaign Spend' | 'Payout Disbursed' | 'Job Listing Fee';
  amountNGN: number;
  isCredit: boolean;
  reference: string;
  status: 'cleared' | 'pending' | 'processing';
}

export interface PlatformNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'booking' | 'event' | 'job' | 'ledger' | 'verification';
}
