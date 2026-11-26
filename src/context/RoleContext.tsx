import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  RoleType,
  UserAccount,
  Specialist,
  ConsultationBooking,
  JobListing,
  JobApplication,
  CommunityPost,
  LiveEvent,
  DigitalBook,
  FarmOpportunity,
  ProgressReport,
  BusinessAdCampaign,
  CreatorApplication,
  LedgerEntry,
  PlatformNotification
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_SPECIALISTS,
  INITIAL_BOOKINGS,
  INITIAL_JOBS,
  INITIAL_POSTS,
  INITIAL_EVENTS,
  INITIAL_BOOKS,
  INITIAL_OPPORTUNITIES,
  INITIAL_PROGRESS_REPORTS,
  INITIAL_AD_CAMPAIGNS,
  INITIAL_CREATOR_APPLICATIONS,
  INITIAL_LEDGER,
  INITIAL_NOTIFICATIONS
} from '../data/mockData';

interface RoleContextType {
  currentRole: RoleType;
  switchRole: (role: RoleType) => void;
  currentUser: UserAccount;
  specialists: Specialist[];
  bookings: ConsultationBooking[];
  jobs: JobListing[];
  jobApplications: JobApplication[];
  posts: CommunityPost[];
  events: LiveEvent[];
  books: DigitalBook[];
  opportunities: FarmOpportunity[];
  progressReports: ProgressReport[];
  adCampaigns: BusinessAdCampaign[];
  creatorApplications: CreatorApplication[];
  ledger: LedgerEntry[];
  notifications: PlatformNotification[];
  activeMeeting: ConsultationBooking | null;
  openMeetingRoom: (booking: ConsultationBooking) => void;
  closeMeetingRoom: () => void;
  bookConsultation: (specialistId: string, scheduledDate: string, scheduledTime: string, objective: string) => ConsultationBooking;
  applyForJob: (jobId: string, applicantData: { name: string; email: string; phone: string; experienceSummary: string; cvFileName: string }) => void;
  postJob: (jobData: Omit<JobListing, 'id' | 'applicantsCount' | 'postedAt' | 'status'>) => void;
  createAdCampaign: (campaignData: Omit<BusinessAdCampaign, 'id' | 'impressions' | 'clicks' | 'leadsGenerated' | 'totalSpendNGN'>) => void;
  submitCreatorQuiz: (topic: string, sampleOutline: string, score: number) => void;
  approveCreatorApplication: (appId: string) => void;
  approveOpportunity: (oppId: string) => void;
  purchaseBook: (bookId: string) => void;
  toggleLikePost: (postId: string) => void;
  createPost: (content: string, topic: string) => void;
  registerForEvent: (eventId: string) => void;
  markNotificationRead: (notifId: string) => void;
  markAllNotificationsRead: () => void;
  updateSessionNotes: (bookingId: string, notes: string) => void;
  submitFarmOpportunity: (oppData: Omit<FarmOpportunity, 'id' | 'fundedNGN' | 'status' | 'verificationScope'>) => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRole] = useState<RoleType>(() => {
    const saved = localStorage.getItem('agroinspo_role');
    return (saved as RoleType) || 'farmer';
  });

  const [users, setUsers] = useState<Record<string, UserAccount>>(() => {
    const saved = localStorage.getItem('agroinspo_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [specialists] = useState<Specialist[]>(INITIAL_SPECIALISTS);
  const [bookings, setBookings] = useState<ConsultationBooking[]>(() => {
    const saved = localStorage.getItem('agroinspo_bookings');
    return saved ? JSON.parse(saved) : INITIAL_BOOKINGS;
  });

  const [jobs, setJobs] = useState<JobListing[]>(() => {
    const saved = localStorage.getItem('agroinspo_jobs');
    return saved ? JSON.parse(saved) : INITIAL_JOBS;
  });

  const [jobApplications, setJobApplications] = useState<JobApplication[]>(() => {
    const saved = localStorage.getItem('agroinspo_applications');
    return saved ? JSON.parse(saved) : [];
  });

  const [posts, setPosts] = useState<CommunityPost[]>(() => {
    const saved = localStorage.getItem('agroinspo_posts');
    return saved ? JSON.parse(saved) : INITIAL_POSTS;
  });

  const [events, setEvents] = useState<LiveEvent[]>(() => {
    const saved = localStorage.getItem('agroinspo_events');
    return saved ? JSON.parse(saved) : INITIAL_EVENTS;
  });

  const [books, setBooks] = useState<DigitalBook[]>(() => {
    const saved = localStorage.getItem('agroinspo_books');
    return saved ? JSON.parse(saved) : INITIAL_BOOKS;
  });

  const [opportunities, setOpportunities] = useState<FarmOpportunity[]>(() => {
    const saved = localStorage.getItem('agroinspo_opps');
    return saved ? JSON.parse(saved) : INITIAL_OPPORTUNITIES;
  });

  const [progressReports, setProgressReports] = useState<ProgressReport[]>(() => {
    const saved = localStorage.getItem('agroinspo_reports');
    return saved ? JSON.parse(saved) : INITIAL_PROGRESS_REPORTS;
  });

  const [adCampaigns, setAdCampaigns] = useState<BusinessAdCampaign[]>(() => {
    const saved = localStorage.getItem('agroinspo_ads');
    return saved ? JSON.parse(saved) : INITIAL_AD_CAMPAIGNS;
  });

  const [creatorApplications, setCreatorApplications] = useState<CreatorApplication[]>(() => {
    const saved = localStorage.getItem('agroinspo_creator_apps');
    return saved ? JSON.parse(saved) : INITIAL_CREATOR_APPLICATIONS;
  });

  const [ledger, setLedger] = useState<LedgerEntry[]>(() => {
    const saved = localStorage.getItem('agroinspo_ledger');
    return saved ? JSON.parse(saved) : INITIAL_LEDGER;
  });

  const [notifications, setNotifications] = useState<PlatformNotification[]>(() => {
    const saved = localStorage.getItem('agroinspo_notifs');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [activeMeeting, setActiveMeeting] = useState<ConsultationBooking | null>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('agroinspo_role', currentRole);
  }, [currentRole]);

  useEffect(() => {
    localStorage.setItem('agroinspo_bookings', JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem('agroinspo_jobs', JSON.stringify(jobs));
  }, [jobs]);

  useEffect(() => {
    localStorage.setItem('agroinspo_applications', JSON.stringify(jobApplications));
  }, [jobApplications]);

  useEffect(() => {
    localStorage.setItem('agroinspo_posts', JSON.stringify(posts));
  }, [posts]);

  useEffect(() => {
    localStorage.setItem('agroinspo_events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('agroinspo_books', JSON.stringify(books));
  }, [books]);

  useEffect(() => {
    localStorage.setItem('agroinspo_opps', JSON.stringify(opportunities));
  }, [opportunities]);

  useEffect(() => {
    localStorage.setItem('agroinspo_ads', JSON.stringify(adCampaigns));
  }, [adCampaigns]);

  useEffect(() => {
    localStorage.setItem('agroinspo_creator_apps', JSON.stringify(creatorApplications));
  }, [creatorApplications]);

  useEffect(() => {
    localStorage.setItem('agroinspo_ledger', JSON.stringify(ledger));
  }, [ledger]);

  useEffect(() => {
    localStorage.setItem('agroinspo_notifs', JSON.stringify(notifications));
  }, [notifications]);

  const switchRole = (role: RoleType) => {
    setCurrentRole(role);
  };

  const currentUser = users[currentRole] || users.farmer;

  const openMeetingRoom = (booking: ConsultationBooking) => {
    setActiveMeeting(booking);
  };

  const closeMeetingRoom = () => {
    setActiveMeeting(null);
  };

  const bookConsultation = (
    specialistId: string,
    scheduledDate: string,
    scheduledTime: string,
    objective: string
  ): ConsultationBooking => {
    const spec = specialists.find((s) => s.id === specialistId) || specialists[0];
    const fee = spec.hourlyRateNGN;
    const platformFee = Math.round(fee * 0.1);

    const newBooking: ConsultationBooking = {
      id: `bk_${Date.now()}`,
      specialistId: spec.id,
      specialistName: spec.name,
      specialistTitle: spec.title,
      specialistAvatar: spec.avatar,
      farmerName: currentUser.name,
      farmName: currentUser.role === 'farmer' ? 'GreenPeak Farms' : 'Private Estate',
      scheduledDate,
      scheduledTime,
      durationMinutes: 45,
      feeNGN: fee,
      platformFeeNGN: platformFee,
      status: 'confirmed',
      objective,
      roomId: `room_${Date.now().toString(36)}`
    };

    setBookings((prev) => [newBooking, ...prev]);

    // Add ledger entry
    const newLedger: LedgerEntry = {
      id: `led_${Date.now()}`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      type: 'Consultation Earned',
      amountNGN: fee - platformFee,
      isCredit: true,
      reference: `CONS-${newBooking.id.toUpperCase()}`,
      status: 'pending'
    };
    setLedger((prev) => [newLedger, ...prev]);

    // Add notification
    const newNotif: PlatformNotification = {
      id: `notif_${Date.now()}`,
      title: 'Consultation Booked',
      message: `Confirmed with ${spec.name} for ${scheduledDate} at ${scheduledTime}.`,
      timestamp: 'Just now',
      read: false,
      type: 'booking'
    };
    setNotifications((prev) => [newNotif, ...prev]);

    return newBooking;
  };

  const applyForJob = (
    jobId: string,
    applicantData: {
      name: string;
      email: string;
      phone: string;
      experienceSummary: string;
      cvFileName: string;
    }
  ) => {
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return;

    const newApp: JobApplication = {
      id: `app_${Date.now()}`,
      jobId,
      jobTitle: job.title,
      companyName: job.companyName,
      applicantName: applicantData.name,
      applicantEmail: applicantData.email,
      applicantPhone: applicantData.phone,
      experienceSummary: applicantData.experienceSummary,
      cvFileName: applicantData.cvFileName,
      status: 'pending',
      submittedAt: new Date().toISOString().split('T')[0]
    };

    setJobApplications((prev) => [newApp, ...prev]);

    // Update job count
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, applicantsCount: j.applicantsCount + 1 } : j))
    );

    // Notification
    const newNotif: PlatformNotification = {
      id: `notif_${Date.now()}`,
      title: 'Job Application Sent',
      message: `Your application for "${job.title}" at ${job.companyName} was submitted.`,
      timestamp: 'Just now',
      read: false,
      type: 'job'
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const postJob = (jobData: Omit<JobListing, 'id' | 'applicantsCount' | 'postedAt' | 'status'>) => {
    const newJob: JobListing = {
      ...jobData,
      id: `job_${Date.now()}`,
      applicantsCount: 0,
      postedAt: new Date().toISOString().split('T')[0],
      status: 'published'
    };

    setJobs((prev) => [newJob, ...prev]);

    const newNotif: PlatformNotification = {
      id: `notif_${Date.now()}`,
      title: 'Job Listing Active',
      message: `Vacancy "${newJob.title}" has been published to the ecosystem.`,
      timestamp: 'Just now',
      read: false,
      type: 'job'
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const createAdCampaign = (
    campaignData: Omit<BusinessAdCampaign, 'id' | 'impressions' | 'clicks' | 'leadsGenerated' | 'totalSpendNGN'>
  ) => {
    const newAd: BusinessAdCampaign = {
      ...campaignData,
      id: `camp_${Date.now()}`,
      impressions: 0,
      clicks: 0,
      leadsGenerated: 0,
      totalSpendNGN: 0
    };

    setAdCampaigns((prev) => [newAd, ...prev]);

    const newNotif: PlatformNotification = {
      id: `notif_${Date.now()}`,
      title: 'Ad Campaign Created',
      message: `Campaign "${newAd.headline}" is now live and serving impressions.`,
      timestamp: 'Just now',
      read: false,
      type: 'ledger'
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const submitCreatorQuiz = (topic: string, sampleOutline: string, score: number) => {
    const newApp: CreatorApplication = {
      id: `capp_${Date.now()}`,
      applicantName: currentUser.name,
      topic,
      sampleOutline,
      scorePercent: score,
      status: score >= 80 ? 'approved' : 'pending',
      submittedAt: new Date().toISOString().split('T')[0],
      reviewerNotes: score >= 80 ? 'Automated threshold passed. Fast-track approval.' : 'Awaiting admin panel review.'
    };

    setCreatorApplications((prev) => [newApp, ...prev]);

    // If approved, update user status
    if (score >= 80 && currentUser.role === 'enthusiast') {
      setUsers((prev) => ({
        ...prev,
        enthusiast: {
          ...prev.enthusiast,
          title: 'Screened Agricultural Creator',
          verificationBadgeText: 'Screened Creator Badge'
        }
      }));
    }

    const newNotif: PlatformNotification = {
      id: `notif_${Date.now()}`,
      title: 'Creator Assessment Submitted',
      message: `Your score: ${score}%. ${score >= 80 ? 'Approved for topic publishing!' : 'Under review by platform moderators.'}`,
      timestamp: 'Just now',
      read: false,
      type: 'verification'
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const approveCreatorApplication = (appId: string) => {
    setCreatorApplications((prev) =>
      prev.map((app) => (app.id === appId ? { ...app, status: 'approved' } : app))
    );

    const newNotif: PlatformNotification = {
      id: `notif_${Date.now()}`,
      title: 'Creator Approved',
      message: `Creator application ${appId} was granted publishing authorization.`,
      timestamp: 'Just now',
      read: false,
      type: 'verification'
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const approveOpportunity = (oppId: string) => {
    setOpportunities((prev) =>
      prev.map((opp) => (opp.id === oppId ? { ...opp, status: 'approved' } : opp))
    );

    const newNotif: PlatformNotification = {
      id: `notif_${Date.now()}`,
      title: 'Farm Proposal Approved',
      message: `Investment listing ${oppId} was verified and published.`,
      timestamp: 'Just now',
      read: false,
      type: 'verification'
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const purchaseBook = (bookId: string) => {
    setBooks((prev) =>
      prev.map((b) => (b.id === bookId ? { ...b, isPurchased: true, downloadsCount: b.downloadsCount + 1 } : b))
    );

    const b = books.find((x) => x.id === bookId);
    if (!b) return;

    // Deduct user balance or log ledger
    const newLedger: LedgerEntry = {
      id: `led_${Date.now()}`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      type: 'Book Sale Net',
      amountNGN: Math.round(b.priceNGN * 0.9),
      isCredit: true,
      reference: `BOOK-${b.id.toUpperCase()}`,
      status: 'cleared'
    };
    setLedger((prev) => [newLedger, ...prev]);

    const newNotif: PlatformNotification = {
      id: `notif_${Date.now()}`,
      title: 'Handbook Purchased',
      message: `You now have full digital library access to "${b.title}".`,
      timestamp: 'Just now',
      read: false,
      type: 'ledger'
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const toggleLikePost = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const isLiked = !p.isLiked;
          return {
            ...p,
            isLiked,
            likesCount: isLiked ? p.likesCount + 1 : p.likesCount - 1
          };
        }
        return p;
      })
    );
  };

  const createPost = (content: string, topic: string) => {
    const newPost: CommunityPost = {
      id: `post_${Date.now()}`,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      authorTitle: currentUser.title,
      authorAvatar: currentUser.avatar,
      isVerified: currentUser.isVerified,
      isScreenedCreator: currentUser.role === 'specialist' || currentUser.verificationBadgeText?.includes('Creator') || false,
      topic,
      content,
      likesCount: 0,
      isLiked: false,
      commentsCount: 0,
      sharesCount: 0,
      publishedAt: 'Just now'
    };

    setPosts((prev) => [newPost, ...prev]);
  };

  const registerForEvent = (eventId: string) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? {
              ...e,
              isRegistered: !e.isRegistered,
              attendeesCount: e.isRegistered ? e.attendeesCount - 1 : e.attendeesCount + 1
            }
          : e
      )
    );
  };

  const markNotificationRead = (notifId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const updateSessionNotes = (bookingId: string, notes: string) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, sessionNotes: notes } : b))
    );
    if (activeMeeting?.id === bookingId) {
      setActiveMeeting((prev) => (prev ? { ...prev, sessionNotes: notes } : null));
    }
  };

  const submitFarmOpportunity = (
    oppData: Omit<FarmOpportunity, 'id' | 'fundedNGN' | 'status' | 'verificationScope'>
  ) => {
    const newOpp: FarmOpportunity = {
      ...oppData,
      id: `opp_${Date.now()}`,
      fundedNGN: 0,
      status: 'under_review',
      verificationScope: 'Title inspection and agronomy site visit scheduled'
    };

    setOpportunities((prev) => [newOpp, ...prev]);

    const newNotif: PlatformNotification = {
      id: `notif_${Date.now()}`,
      title: 'Farm Opportunity Submitted',
      message: `"${newOpp.title}" is in the compliance review queue.`,
      timestamp: 'Just now',
      read: false,
      type: 'verification'
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  return (
    <RoleContext.Provider
      value={{
        currentRole,
        switchRole,
        currentUser,
        specialists,
        bookings,
        jobs,
        jobApplications,
        posts,
        events,
        books,
        opportunities,
        progressReports,
        adCampaigns,
        creatorApplications,
        ledger,
        notifications,
        activeMeeting,
        openMeetingRoom,
        closeMeetingRoom,
        bookConsultation,
        applyForJob,
        postJob,
        createAdCampaign,
        submitCreatorQuiz,
        approveCreatorApplication,
        approveOpportunity,
        purchaseBook,
        toggleLikePost,
        createPost,
        registerForEvent,
        markNotificationRead,
        markAllNotificationsRead,
        updateSessionNotes,
        submitFarmOpportunity
      }}
    >
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};
