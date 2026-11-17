import {
  Specialist,
  UserAccount,
  JobListing,
  CommunityPost,
  LiveEvent,
  DigitalBook,
  FarmOpportunity,
  ProgressReport,
  BusinessAdCampaign,
  CreatorApplication,
  LedgerEntry,
  ConsultationBooking,
  PlatformNotification
} from '../types';

import modernFarm from '../assets/images/modern_nigerian_farm_1793019543177.jpg';
import agronomistField from '../assets/images/african_agronomist_field_1793019544274.jpg';
import cassavaHarvest from '../assets/images/farm_cassava_harvest_1793018068561.jpg';
import farmerHero from '../assets/images/african_farmer_hero_1793019541629.jpg';
import droneSunset from '../assets/images/smart_drone_agritech_1793019543627.jpg';
import droneDaylight from '../assets/images/drone_farm_monitoring_1793019203766.jpg';
import greenhouseSpecialist from '../assets/images/specialist_agronomist_1793018068598.jpg';
import fieldRows from '../assets/images/hero_agro_inspo_1793018068235.jpg';

// Images are imported (not referenced as /src/... strings) so Vite fingerprints and ships them in production builds.
export const HERO_IMAGE = modernFarm;
export const AGRONOMIST_IMAGE = agronomistField;
export const CASSAVA_FARM_IMAGE = cassavaHarvest;
export const HERO_FARMER_SUNRISE = farmerHero;
export const DRONE_FARM_IMAGE = droneSunset;
export const DRONE_DAYLIGHT_IMAGE = droneDaylight;
export const GREENHOUSE_AGRONOMIST = greenhouseSpecialist;
export const PANORAMIC_FARM = modernFarm;
export const FIELD_ROWS_IMAGE = fieldRows;

export const INITIAL_USERS: Record<string, UserAccount> = {
  enthusiast: {
    id: 'user_enthusiast_1',
    name: 'Tunde Alabi',
    email: 'tunde.alabi@gmail.com',
    phone: '+234 803 234 5678',
    role: 'enthusiast',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80',
    title: 'Aspiring Agribusiness Professional',
    location: 'Lagos & Ibadan, Nigeria',
    bio: 'Passionate about smart soil diagnostics, precision grains, and sustainable poultry. Actively seeking farm management and agronomy roles.',
    isVerified: true,
    verificationBadgeText: 'ID & Degree Verified',
    interests: ['Cereal Grains', 'Greenhouse Tech', 'Poultry Science', 'Farm Management'],
    balanceNGN: 45000,
    pendingBalanceNGN: 0
  },
  farmer: {
    id: 'user_farmer_1',
    name: 'Chief Olayinka Adeleke',
    email: 'olayinka@greenpeakfarms.ng',
    phone: '+234 802 876 5432',
    role: 'farmer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=200&q=80',
    title: 'Managing Director, GreenPeak Agro Ltd',
    location: 'Iseyin / Oyo Town, Oyo State',
    bio: 'Operating 120 hectares of yellow maize, commercial cassava, and integrated aquaculture. Focused on mechanization and certified seed varieties.',
    isVerified: true,
    verificationBadgeText: 'Farm Title & CAC Verified',
    interests: ['Maize Production', 'Drip Irrigation', 'Tractor Fleet', 'Agricultural Exports'],
    balanceNGN: 680000,
    pendingBalanceNGN: 0
  },
  specialist: {
    id: 'spec_1',
    name: 'Dr. Folashade Adeleke, PhD',
    email: 'folashade@agroinspo.org',
    phone: '+234 805 112 3344',
    role: 'specialist',
    avatar: AGRONOMIST_IMAGE,
    title: 'Senior Agronomist & Soil Health Specialist',
    location: 'Ibadan, Oyo State / Nationwide',
    bio: '14+ years in tropical agronomy, soil chemistry, and integrated pest management. Consulted for 85+ commercial farms across West Africa.',
    isVerified: true,
    verificationBadgeText: 'Licensed Agrologist (NIAS / AIA)',
    interests: ['Soil Fertility', 'Crop Nutrition', 'Pest Control', 'Drip Fertigation'],
    balanceNGN: 245000,
    pendingBalanceNGN: 36000
  },
  business: {
    id: 'user_biz_1',
    name: 'AgriFlow Seed & Tech Ltd',
    email: 'partnerships@agriflow.ng',
    phone: '+234 809 333 4455',
    role: 'business',
    avatar: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=200&h=200&q=80',
    title: 'Certified Seed Multiplier & Irrigation Systems',
    location: 'Ikeja Commercial Hub, Lagos State',
    bio: 'Official distributor of high-germination hybrid seeds, solar drip irrigation kits, and organic bio-stimulants certified by NASC & NAFDAC.',
    isVerified: true,
    verificationBadgeText: 'CAC & NASC Certified Business',
    interests: ['Hybrid Maize Seeds', 'Solar Pumps', 'Bio-fertilizers', 'Contract Farming'],
    balanceNGN: 1420000,
    pendingBalanceNGN: 0
  },
  admin: {
    id: 'user_admin_1',
    name: 'Amina Sanusi',
    email: 'compliance@agroinspo.com',
    phone: '+234 803 000 9988',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&h=200&q=80',
    title: 'Chief Compliance & Platform Operations Lead',
    location: 'Abuja FCT, Nigeria',
    bio: 'Supervising platform verification protocols, investment proposal disclosures, dispute escalations, and payment reconciliations.',
    isVerified: true,
    verificationBadgeText: 'Master Admin Access',
    interests: ['Policy', 'Risk Mitigation', 'Reconciliation', 'Audit Trails'],
    balanceNGN: 8900000,
    pendingBalanceNGN: 0
  }
};

export const INITIAL_SPECIALISTS: Specialist[] = [
  {
    id: 'spec_1',
    name: 'Dr. Folashade Adeleke',
    title: 'Senior Agronomist & Soil Fertility Specialist',
    avatar: AGRONOMIST_IMAGE,
    rating: 4.96,
    reviewCount: 48,
    location: 'Ibadan, Oyo State',
    specialties: ['Soil Chemistry', 'Maize & Cassava Agronomy', 'Drip Fertigation'],
    experienceYears: 14,
    hourlyRateNGN: 18000,
    verifiedCredentials: ['PhD Soil Science (UI)', 'Registered Soil Scientist (SSSN)', 'IITA Alumni Research Fellow'],
    languages: ['English', 'Yoruba'],
    bio: 'Field-tested agronomic protocols tailored for tropical savanna soils. Specializing in balanced NPK/micronutrient optimization and pest defense.',
    isAvailableToday: true,
    upcomingSlots: ['10:00 AM Today', '02:00 PM Today', '11:00 AM Tomorrow', '04:00 PM Tomorrow']
  },
  {
    id: 'spec_2',
    name: 'Dr. Ibrahim Danladi, DVM',
    title: 'Livestock Veterinarian & Poultry Pathologist',
    avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=200&h=200&q=80',
    rating: 4.92,
    reviewCount: 39,
    location: 'Kaduna / Zaria',
    specialties: ['Broiler Biosecurity', 'Poultry Disease Diagnosis', 'Ruminant Nutrition'],
    experienceYears: 11,
    hourlyRateNGN: 22000,
    verifiedCredentials: ['Doctor of Veterinary Medicine (ABU)', 'Member NVMA', 'Certified Avian Specialist'],
    languages: ['English', 'Hausa'],
    bio: 'Specialist in controlling Newcastle disease, Gumboro outbreaks, and optimizing feed-conversion ratios in commercial broiler flocks.',
    isAvailableToday: true,
    upcomingSlots: ['01:00 PM Today', '03:30 PM Today', '09:00 AM Tomorrow']
  },
  {
    id: 'spec_3',
    name: 'Engr. Babatunde Lawal',
    title: 'Irrigation Engineer & Farm Mechanization Lead',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&h=200&q=80',
    rating: 4.88,
    reviewCount: 27,
    location: 'Abeokuta, Ogun State',
    specialties: ['Solar Pumping Design', 'Tractor Implements', 'Topographic Water Harvesting'],
    experienceYears: 9,
    hourlyRateNGN: 25000,
    verifiedCredentials: ['B.Eng Agricultural Engineering', 'COREN Registered', 'Certified Solar Water Pumper'],
    languages: ['English', 'Yoruba', 'Pidgin'],
    bio: 'Designs zero-fuel solar drip irrigation systems and tractor implement maintenance schedules for commercial estates.',
    isAvailableToday: false,
    upcomingSlots: ['10:00 AM Tomorrow', '02:00 PM Tomorrow']
  },
  {
    id: 'spec_4',
    name: 'Chioma Nwachukwu',
    title: 'Commercial Aquaculture Advisor & Hatchery Expert',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&h=200&q=80',
    rating: 4.95,
    reviewCount: 33,
    location: 'Warri / Port Harcourt',
    specialties: ['Catfish & Tilapia Hatcheries', 'Water Quality Management', 'Recirculating Systems (RAS)'],
    experienceYears: 8,
    hourlyRateNGN: 16000,
    verifiedCredentials: ['M.Sc Fisheries & Aquaculture (UNN)', 'WorldFish Certified Practitioner'],
    languages: ['English', 'Igbo'],
    bio: 'Helps fish farmers scale fingerling survival above 90% and formulate low-cost black soldier fly and duckweed supplemental feeds.',
    isAvailableToday: true,
    upcomingSlots: ['11:30 AM Today', '04:00 PM Today', '10:00 AM Tomorrow']
  }
];

export const INITIAL_BOOKINGS: ConsultationBooking[] = [
  {
    id: 'bk_101',
    specialistId: 'spec_1',
    specialistName: 'Dr. Folashade Adeleke',
    specialistTitle: 'Senior Agronomist',
    specialistAvatar: AGRONOMIST_IMAGE,
    farmerName: 'Chief Olayinka Adeleke',
    farmName: 'GreenPeak Agro (120 Ha)',
    scheduledDate: '2026-10-26',
    scheduledTime: '11:00 AM',
    durationMinutes: 45,
    feeNGN: 18000,
    platformFeeNGN: 2700,
    status: 'confirmed',
    objective: 'Nitrogen deficiency troubleshooting and mid-season fertigation schedule for block B yellow maize.',
    sessionNotes: 'Pre-consultation soil pH results (6.2) verified. Recommend foliar zinc sulfate application before tasseling.',
    roomId: 'room_greenpeak_soil_review'
  },
  {
    id: 'bk_102',
    specialistId: 'spec_2',
    specialistName: 'Dr. Ibrahim Danladi',
    specialistTitle: 'Poultry Pathologist',
    specialistAvatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=200&h=200&q=80',
    farmerName: 'Chief Olayinka Adeleke',
    farmName: 'GreenPeak Broiler Unit',
    scheduledDate: '2026-10-28',
    scheduledTime: '02:00 PM',
    durationMinutes: 60,
    feeNGN: 22000,
    platformFeeNGN: 3300,
    status: 'confirmed',
    objective: 'Audit pen ventilation parameters to curb heat stress mortality in 8,000 birds flock.',
    roomId: 'room_poultry_biosecurity_audit'
  }
];

export const INITIAL_JOBS: JobListing[] = [
  {
    id: 'job_1',
    title: 'Assistant Commercial Farm Manager (Grains & Tubers)',
    companyName: 'GreenPeak Agro Ltd',
    companyType: 'farm',
    companyLogo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80',
    isCompanyVerified: true,
    location: 'Iseyin, Oyo State (On-site with housing)',
    employmentType: 'Full-time',
    salaryMinNGN: 250000,
    salaryMaxNGN: 380000,
    salaryPeriod: 'month',
    category: 'Farm Management',
    description: 'We are seeking an energetic Agronomy or Agricultural Economics graduate to supervise field operations, equipment schedules, and worker crews across 120 hectares of mechanized maize and cassava.',
    requirements: [
      'B.Agric or HND in Agronomy, Crop Production, or Agricultural Extension',
      'At least 2 years commercial farm field experience',
      'Hands-on familiarity with tractor implements, boom sprayers, and fertilizer application',
      'Willingness to reside on farm estate near Iseyin'
    ],
    responsibilities: [
      'Daily morning deployment of 30+ farm operators and field hands',
      'Record tractor operating hours, diesel consumption, and chemical inventory',
      'Inspect crop blocks for early armyworm infestation or weed pressure'
    ],
    applicantsCount: 6,
    deadline: '2026-11-15',
    postedAt: '2026-10-20',
    status: 'published'
  },
  {
    id: 'job_2',
    title: 'Commercial Broiler Flock Supervisor',
    companyName: 'Sunrise Agro-Ventures Ltd',
    companyType: 'farm',
    isCompanyVerified: true,
    location: 'Abeokuta, Ogun State',
    employmentType: 'Full-time',
    salaryMinNGN: 180000,
    salaryMaxNGN: 260000,
    salaryPeriod: 'month',
    category: 'Livestock & Poultry',
    description: 'Responsible for monitoring temperature, lighting, ventilation, and feed intake across 4 modern deep-litter broiler houses with a capacity of 25,000 birds.',
    requirements: [
      'Animal Science or Animal Health diploma/degree',
      '3+ years hands-on commercial broiler management',
      'Clear understanding of biosecurity and vaccination regimes'
    ],
    responsibilities: [
      'Enforce biosecurity footbaths and visitor vehicle disinfection',
      'Track average daily weight gain and feed conversion ratio (FCR)',
      'Administer water vaccinations and manage cooling pads during heat waves'
    ],
    applicantsCount: 11,
    deadline: '2026-11-20',
    postedAt: '2026-10-22',
    status: 'published'
  },
  {
    id: 'job_3',
    title: 'Technical Sales Agronomist (Irrigation & Seeds)',
    companyName: 'AgriFlow Seed & Tech Ltd',
    companyType: 'business',
    companyLogo: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=100&h=100&q=80',
    isCompanyVerified: true,
    location: 'Ibadan / South-West Region (Field Based)',
    employmentType: 'Full-time',
    salaryMinNGN: 300000,
    salaryMaxNGN: 450000,
    salaryPeriod: 'month',
    category: 'Agribusiness Sales',
    description: 'Drive regional adoption of certified hybrid seeds and solar drip kits among commercial farm clusters and cooperative unions.',
    requirements: [
      'B.Sc in Agronomy or related discipline',
      'Valid driving license and proven field demonstration skills',
      'Existing relationships with commercial farm owners in Ogun, Oyo, and Osun'
    ],
    responsibilities: [
      'Conduct on-farm trial plots demonstrating hybrid maize seed vigor',
      'Quote and supervise installation of solar pump systems',
      'Achieve quarterly sales benchmarks'
    ],
    applicantsCount: 4,
    deadline: '2026-11-10',
    postedAt: '2026-10-18',
    status: 'published'
  }
];

export const INITIAL_POSTS: CommunityPost[] = [
  {
    id: 'post_1',
    authorName: 'Dr. Folashade Adeleke',
    authorRole: 'specialist',
    authorTitle: 'Senior Agronomist · Verified Creator',
    authorAvatar: AGRONOMIST_IMAGE,
    isVerified: true,
    isScreenedCreator: true,
    topic: 'Maize Agronomy',
    content: 'Farmers often notice yellowing on lower leaves around V6 to V8 stage and rush to apply more NPK 15-15-15. In acidic savanna soils (pH < 5.8), nitrogen uptake is bottlenecked by low phosphorus mobility. Before wasting 50kg bags, check your soil pH and consider side-dressing with calcium ammonium nitrate (CAN) rather than raw urea during hot afternoons to avoid ammonia volatilization.',
    image: CASSAVA_FARM_IMAGE,
    likesCount: 142,
    isLiked: false,
    commentsCount: 28,
    sharesCount: 19,
    publishedAt: '3 hours ago'
  },
  {
    id: 'post_2',
    authorName: 'AgriFlow Seed & Tech Ltd',
    authorRole: 'business',
    authorTitle: 'Certified Seed Distributor · Verified Business',
    authorAvatar: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=200&h=200&q=80',
    isVerified: true,
    isScreenedCreator: false,
    isSponsored: true,
    topic: 'Hybrid Seed Technology',
    content: 'Dry season irrigation farming starts with seed stamina. Our SAMMAZ 52 hybrid maize offers proven drought tolerance and yield potential of up to 7.8 tons/hectare under standard fertigation. Available now across all South-West distribution depots with certified NASC tamper-evident holograms.',
    likesCount: 89,
    isLiked: false,
    commentsCount: 15,
    sharesCount: 7,
    publishedAt: 'Yesterday'
  },
  {
    id: 'post_3',
    authorName: 'Tunde Alabi',
    authorRole: 'enthusiast',
    authorTitle: 'Agricultural Enthusiast & Job Seeker',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80',
    isVerified: true,
    isScreenedCreator: false,
    topic: 'Black Soldier Fly (BSF)',
    content: 'Just completed a small 5-crate trial breeding Black Soldier Fly larvae using spent brewer grain from local breweries. We achieved a 1:4.2 substrate conversion ratio in 14 days! Considering fish meal is currently ₦1,850/kg, BSF protein meal could cut local catfish feed costs by over 35%. Looking to connect with hatcheries interested in trial batches!',
    likesCount: 215,
    isLiked: true,
    commentsCount: 42,
    sharesCount: 31,
    publishedAt: '2 days ago'
  }
];

export const INITIAL_EVENTS: LiveEvent[] = [
  {
    id: 'evt_1',
    title: 'Dry Season Vegetable Economics: Solar Drip Irrigation Setup & ROI',
    hostName: 'Engr. Babatunde Lawal & Dr. Folashade Adeleke',
    hostTitle: 'Irrigation Lead & Commercial Agronomist',
    hostAvatar: AGRONOMIST_IMAGE,
    date: '2026-10-29',
    time: '04:00 PM (WAT)',
    durationMinutes: 75,
    category: 'Irrigation & Engineering',
    attendeesCount: 264,
    isLiveNow: false,
    isReplayAvailable: false,
    description: 'Learn the real capital expenditure breakdown for 2-hectare solar drip systems, discharge calculations per dripper, and how to plan dry-season habanero pepper and cucumber cycles for high-margin December-January harvest.',
    isRegistered: true
  },
  {
    id: 'evt_2',
    title: 'Poultry Biosecurity Masterclass: Zero-Mortality Broiler brooding Protocols',
    hostName: 'Dr. Ibrahim Danladi, DVM',
    hostTitle: 'Avian Veterinarian',
    hostAvatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=200&h=200&q=80',
    date: '2026-10-24',
    time: '02:00 PM (WAT)',
    durationMinutes: 90,
    category: 'Livestock & Health',
    attendeesCount: 512,
    isLiveNow: false,
    isReplayAvailable: true,
    replayViews: 1420,
    recordingUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    description: 'Full replay available: How to manage brooding charcoal heaters, water acidifiers, and feed tray sanitation during the critical day 1 to day 14 development phase.'
  }
];

export const INITIAL_BOOKS: DigitalBook[] = [
  {
    id: 'bk_prod_1',
    title: 'The Commercial Cassava Handbook: High-Starch Yields in West Africa',
    authorName: 'Dr. Folashade Adeleke',
    authorSpecialty: 'Senior Agronomist',
    priceNGN: 7500,
    description: 'A comprehensive 140-page guide covering stem selection, mechanized ridge preparation, selective pre-emergence herbicides, and factory-grade starch testing for commercial outgrowers.',
    pageCount: 142,
    downloadsCount: 384,
    rating: 4.9,
    category: 'Crop Production',
    sampleChapter: 'Chapter 1: Certified Stem Cutting Storage & Fungicide Dip Treatments before planting.',
    isPurchased: false
  },
  {
    id: 'bk_prod_2',
    title: 'Broiler Production Blueprint: 1.8kg in 38 Days at FCR 1.55',
    authorName: 'Dr. Ibrahim Danladi, DVM',
    authorSpecialty: 'Poultry Pathologist',
    priceNGN: 9000,
    description: 'Practical temperature curves, lighting regimens, water acidification, and anticoccidial rotation plans for humid and savannah climates.',
    pageCount: 118,
    downloadsCount: 620,
    rating: 4.95,
    category: 'Livestock Science',
    sampleChapter: 'Chapter 3: Biosecurity Protocols for Farm Gate, Feed Store, and Car Footbaths.',
    isPurchased: true
  },
  {
    id: 'bk_prod_3',
    title: 'Zero-Fuel Solar Drip Irrigation: Engineering & Sizing Guide',
    authorName: 'Engr. Babatunde Lawal',
    authorSpecialty: 'Irrigation Engineer',
    priceNGN: 11000,
    description: 'Step-by-step pump sizing worksheets, friction loss tables for PVC mainlines, filtration mesh selection, and fertigation venture injectors.',
    pageCount: 165,
    downloadsCount: 290,
    rating: 4.85,
    category: 'Engineering & Mechanization',
    sampleChapter: 'Chapter 2: Calculating Head Loss across 250m Slope Gradients.',
    isPurchased: false
  }
];

export const INITIAL_OPPORTUNITIES: FarmOpportunity[] = [
  {
    id: 'opp_1',
    farmName: 'GreenPeak Agro Ltd',
    title: 'Commercial Yellow Maize & Drip Cassava Outgrower Expansion',
    location: 'Iseyin, Oyo State',
    cropOrLivestock: 'Maize & High-Yield Cassava',
    hectares: 85,
    fundingTargetNGN: 18500000,
    fundedNGN: 14200000,
    durationMonths: 9,
    projectedReturnRange: '18% – 22% (Target Harvest Return)',
    riskRating: 'Medium',
    summary: 'Expansion of 85 hectares mechanized grain cluster with confirmed off-take purchase agreement with Grand Cereals Ltd and animal feed millers.',
    useOfFunds: [
      { item: 'Land clearing & mechanized harrowing', percentage: 28 },
      { item: 'Certified SAMMAZ 52 seeds & basal fertilizers', percentage: 34 },
      { item: 'Drip lines & solar pump extension', percentage: 22 },
      { item: 'Working capital & crop monitoring insurance', percentage: 16 }
    ],
    milestonesCount: 5,
    status: 'approved',
    verificationScope: 'C-of-O Land Title Inspected · IITA Soil Test Verified · Offtaker LOI on File',
    farmImage: CASSAVA_FARM_IMAGE
  },
  {
    id: 'opp_2',
    farmName: 'Plateau Highland Berries & Tomato Estate',
    title: 'Controlled Environment Greenhouse Tomato & Bell Pepper Complex',
    location: 'Jos South, Plateau State',
    cropOrLivestock: 'Indeterminate Greenhouse Tomatoes',
    hectares: 12,
    fundingTargetNGN: 24000000,
    fundedNGN: 9600000,
    durationMonths: 12,
    projectedReturnRange: '20% – 25% (Semi-Annual Harvest Cycles)',
    riskRating: 'Low-Medium',
    summary: 'Four multi-span tropical greenhouses with climate sensors, bumblebee pollination, and direct supermarket supply channels in Abuja and Lagos.',
    useOfFunds: [
      { item: 'Greenhouse galvanized frame erection', percentage: 40 },
      { item: 'Coco-peat substrate & drip fertigation system', percentage: 25 },
      { item: 'Cold-room solar storage unit', percentage: 20 },
      { item: 'GlobalGAP certification & operational reserve', percentage: 15 }
    ],
    milestonesCount: 6,
    status: 'approved',
    verificationScope: 'Plateau Min. of Agric Farm Inspection · Water Well Potability Verified',
    farmImage: HERO_IMAGE
  }
];

export const INITIAL_PROGRESS_REPORTS: ProgressReport[] = [
  {
    id: 'rep_1',
    opportunityId: 'opp_1',
    farmName: 'GreenPeak Agro Ltd',
    reportingPeriod: 'Month 3 (Planting & Early Vegetative Phase)',
    overallStatus: 'on_track',
    milestoneTitle: 'Mechanized Planting & Basal Fertigation Complete',
    progressPercent: 65,
    productionMetrics: [
      { label: 'Hectares Planted', value: '85', unit: 'Ha' },
      { label: 'Germination Rate', value: '94.2', unit: '%' },
      { label: 'Soil pH Post-Lime', value: '6.3', unit: 'pH' },
      { label: 'Fertilizer Applied', value: '170', unit: 'Bags' }
    ],
    narrative: 'All 85 hectares were ploughed, harrowed, and planted with certified SAMMAZ 52 hybrid seeds within the target 7-day planting window. Basal NPK 15-15-15 was banded simultaneously with mechanical planters. Drip tape layout on the 20-hectare cassava block is operating at 1.4 bar pressure with zero leaks.',
    evidenceNotes: 'Drone survey orthomosaic and soil moisture sensor logs uploaded. Next milestone: V6 side-dressing and selective weed control.',
    evidenceImages: [CASSAVA_FARM_IMAGE, HERO_IMAGE],
    submittedAt: '2026-10-15',
    approvedBy: 'Amina Sanusi (Compliance Officer)'
  }
];

export const INITIAL_AD_CAMPAIGNS: BusinessAdCampaign[] = [
  {
    id: 'camp_1',
    businessName: 'AgriFlow Seed & Tech Ltd',
    headline: 'Certified Hybrid Maize Seeds with Guaranteed 95% Germination',
    tagline: 'Delivered nationwide with tamper-proof NASC seed lot holograms.',
    targetCategory: 'Cereal Grains & Commercial Farmers',
    targetRegion: 'South-West & North-Central Nigeria',
    budgetDailyNGN: 15000,
    totalSpendNGN: 105000,
    impressions: 14820,
    clicks: 864,
    leadsGenerated: 72,
    status: 'active',
    bannerImage: HERO_IMAGE
  }
];

export const INITIAL_CREATOR_APPLICATIONS: CreatorApplication[] = [
  {
    id: 'appl_1',
    applicantName: 'Tunde Alabi',
    topic: 'Insect Protein & Black Soldier Fly Farming',
    sampleOutline: 'Practical guide to nursery brooding, larval feeding on organic waste, and proximate nutrient analysis for poultry feed substitution.',
    scorePercent: 92,
    status: 'pending',
    submittedAt: '2026-10-24',
    reviewerNotes: 'Excellent agronomic grounding and realistic financial calculations. Recommend granting Creator Badge.'
  }
];

export const INITIAL_LEDGER: LedgerEntry[] = [
  {
    id: 'led_1',
    date: '2026-10-26 10:15',
    type: 'Consultation Earned',
    amountNGN: 15300,
    isCredit: true,
    reference: 'CONS-GRN-892',
    status: 'cleared'
  },
  {
    id: 'led_2',
    date: '2026-10-26 10:15',
    type: 'Platform Fee (15%)',
    amountNGN: 2700,
    isCredit: false,
    reference: 'COMM-GRN-892',
    status: 'cleared'
  },
  {
    id: 'led_3',
    date: '2026-10-25 14:30',
    type: 'Book Sale Net',
    amountNGN: 6375,
    isCredit: true,
    reference: 'BOOK-CS-391',
    status: 'cleared'
  },
  {
    id: 'led_4',
    date: '2026-10-20 09:00',
    type: 'Payout Disbursed',
    amountNGN: 180000,
    isCredit: false,
    reference: 'PAYOUT-GTB-4819',
    status: 'cleared'
  }
];

export const INITIAL_NOTIFICATIONS: PlatformNotification[] = [
  {
    id: 'notif_1',
    title: 'Consultation Confirmed',
    message: 'Your video consultation with Dr. Folashade Adeleke is confirmed for today at 11:00 AM.',
    timestamp: '15 mins ago',
    read: false,
    type: 'booking'
  },
  {
    id: 'notif_2',
    title: 'New Job Candidate',
    message: 'Tunde Alabi applied for Assistant Commercial Farm Manager.',
    timestamp: '2 hours ago',
    read: false,
    type: 'job'
  },
  {
    id: 'notif_3',
    title: 'Milestone Report Approved',
    message: 'Month 3 Progress Report for Maize Expansion was verified by Compliance.',
    timestamp: '1 day ago',
    read: true,
    type: 'verification'
  }
];
