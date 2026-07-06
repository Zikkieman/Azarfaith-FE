export type CampaignType = "money" | "item" | "volunteer" | "professional" | "emergency";

export type Update = { id: string; date: string; title: string; body: string };
export type Comment = { id: string; author: string; avatar: string; date: string; body: string };
export type Donation = { id: string; donor: string; amount: number; date: string; note?: string };

const photos = [
  "1532635241-17e820acc59f",
  "1488521787991-ed7bbaae773c",
  "1517022812141-23620dba5c23",
  "1509099836639-18ba1795216d",
  "1517486808906-6ca8b3f04846",
  "1542838132-92c53300491e",
  "1593113646773-028c64a8f1b8",
  "1497375638960-ca368c7231e4",
  "1593113598332-cd288d649433",
  "1532634922-8fe0b757fb13",
  "1576091160550-2173dba999ef",
  "1559027615-cd4628902d4a",
];

const p = (i: number) =>
  `https://images.unsplash.com/photo-${photos[i % photos.length]}?auto=format&fit=crop&w=1200&q=80`;

export type Category =
  | "Church Building"
  | "Missions & Outreach"
  | "Orphanage"
  | "Education"
  | "Food & Relief"
  | "Medical Mission"
  | "Emergency"
  | "Community Development";

export type OrgCategory = "church" | "mission" | "orphanage" | "school" | "other";

export type Org = {
  id: string;
  name: string;
  tagline: string;
  category: OrgCategory;
  location: string;
  denomination: string;
  founded: string;
  bio: string;
  photos: string[];
  videos: string[];
  campaignIds: string[];
  verificationStatus: "unverified" | "pending" | "verified" | "rejected";
  totalReceived: number;
  supporters: number;
};

export type Campaign = {
  id: string;
  mode: "one-time" | "ongoing";
  type: CampaignType;
  title: string;
  story: string;
  faithCategory: Category;
  orgId?: string;
  raiser: { name: string; avatar: string; location: string; trustScore: number };
  cover: string;
  gallery: string[];
  goal?: number;
  raised: number;
  donors: number;
  currency: "NGN";
  location: string;
  urgency: "low" | "medium" | "high" | "critical";
  createdAt: string;
  verificationStatus: "unverified" | "pending" | "verified" | "rejected";
  updates: Update[];
  comments: Comment[];
  donations: Donation[];
  needs?: string[];
  frequencies?: Array<"weekly" | "monthly" | "quarterly">;
};

export type RecurringDonation = {
  id: string;
  donorId: string;
  targetId: string;
  targetName: string;
  targetCover: string;
  amount: number;
  frequency: "weekly" | "monthly" | "quarterly";
  mode: "auto" | "pledge";
  nextDate: string;
  active: boolean;
};

export const formatMoney = (amount: number, currency: Campaign["currency"] = "NGN") => {
  const symbols: Record<Campaign["currency"], string> = { NGN: "₦" };
  return `${symbols[currency]}${amount.toLocaleString()}`;
};

export const orgs: Org[] = [
  {
    id: "o1",
    name: "ECWA Mission Board",
    tagline: "Reaching the unreached in Northern Nigeria",
    category: "mission",
    location: "Kaduna, Nigeria",
    denomination: "ECWA",
    founded: "1904",
    bio: "The Evangelical Church Winning All (ECWA) Mission Board plants churches and trains missionaries across Northern Nigeria. We operate in Borno, Yobe, Adamawa, and Kano states — reaching communities that have never heard the gospel. Our missionaries live among the people, learn their languages, and serve alongside them.",
    photos: [p(0), p(1), p(2)],
    videos: [],
    campaignIds: ["gfc1", "gfc4"],
    verificationStatus: "verified",
    totalReceived: 12400000,
    supporters: 847,
  },
  {
    id: "o2",
    name: "Church Under The Bridge Lagos",
    tagline: "Every Sunday, under the bridge, for the forgotten",
    category: "church",
    location: "Lagos Island, Nigeria",
    denomination: "Non-denominational",
    founded: "2008",
    bio: "We gather every Sunday under the bridge on Lagos Island, worshipping with the homeless, street traders, and urban poor. After service we share a meal with everyone present. We don't have walls but we have community. Every week we need food, bibles, and support to keep showing up.",
    photos: [p(3), p(4), p(5)],
    videos: [],
    campaignIds: ["gfc2"],
    verificationStatus: "verified",
    totalReceived: 8750000,
    supporters: 1203,
  },
  {
    id: "o3",
    name: "Grace Harvest Orphanage",
    tagline: "47 children who call this home",
    category: "orphanage",
    location: "Jos, Plateau State",
    denomination: "Baptist",
    founded: "2012",
    bio: "Grace Harvest cares for 47 orphaned and vulnerable children in Plateau State. We provide shelter, meals, education, and a Christian home. Many of our children were displaced by conflict in Plateau State. We survive on faith and the generosity of donors who see these children as worth fighting for.",
    photos: [p(6), p(7), p(8)],
    videos: [],
    campaignIds: ["gfc5"],
    verificationStatus: "verified",
    totalReceived: 5300000,
    supporters: 412,
  },
  {
    id: "o4",
    name: "CAPROS Nigeria",
    tagline: "Going where the church hasn't gone yet",
    category: "mission",
    location: "Abuja, Nigeria",
    denomination: "Interdenominational",
    founded: "1975",
    bio: "Campus for Christ Research and Outreach Society (CAPROS) sends missionaries to the most remote, underserved communities in Nigeria. We specialize in unreached people groups — those who have had no significant contact with Christian witness. Our teams often travel by foot, canoe, and motorcycle.",
    photos: [p(9), p(10), p(11)],
    videos: [],
    campaignIds: ["gfc3"],
    verificationStatus: "unverified",
    totalReceived: 2100000,
    supporters: 189,
  },
  {
    id: "o5",
    name: "Lifegate Christian Academy",
    tagline: "Quality education rooted in faith",
    category: "school",
    location: "Ibadan, Oyo State",
    denomination: "Pentecostal",
    founded: "2001",
    bio: "Lifegate Christian Academy provides affordable, quality education to over 400 children in an underserved community in Ibadan. Our teachers are committed Christians who believe education and faith go hand in hand. We subsidize fees for the poorest families and have never turned a child away for inability to pay.",
    photos: [p(0), p(3), p(6)],
    videos: [],
    campaignIds: [],
    verificationStatus: "unverified",
    totalReceived: 1850000,
    supporters: 94,
  },
];

export const campaigns: Campaign[] = [
  {
    id: "gfc1",
    mode: "ongoing",
    type: "money",
    title: "Support ECWA Missionaries in Borno",
    story:
      "Our team of 12 missionaries lives in Borno State, one of the most challenging mission fields in Nigeria. They need monthly support for food, transport, and ministry materials. Your recurring gift keeps them on the field.",
    faithCategory: "Missions & Outreach",
    orgId: "o1",
    raiser: {
      name: "ECWA Mission Board",
      avatar: p(0),
      location: "Kaduna, Nigeria",
      trustScore: 94,
    },
    cover: p(1),
    gallery: [p(1), p(2), p(3)],
    raised: 1840000,
    donors: 214,
    currency: "NGN",
    location: "Borno State, Nigeria",
    urgency: "medium",
    createdAt: "2025-01-15",
    verificationStatus: "verified",
    updates: [
      {
        id: "u1",
        date: "2025-05-10",
        title: "12 communities reached this quarter",
        body: "Our Borno team completed outreaches in 12 new communities. 3 small groups now meeting weekly. Thank you for making this possible.",
      },
    ],
    comments: [
      {
        id: "c1",
        author: "Funke O.",
        avatar: p(4),
        date: "3 days ago",
        body: "Praying for your team. What you're doing matters.",
      },
    ],
    donations: [
      { id: "d1", donor: "Anonymous", amount: 50000, date: "1d" },
      { id: "d2", donor: "Chukwuemeka A.", amount: 25000, date: "2d", note: "For the Borno team" },
    ],
    frequencies: ["weekly", "monthly", "quarterly"],
  },
  {
    id: "gfc2",
    mode: "ongoing",
    type: "money",
    title: "Keep the Church Under The Bridge Running",
    story:
      "Every Sunday we show up under Third Mainland Bridge and serve whoever comes. We need ₦150,000 monthly for food, bibles, and basic supplies. We've never missed a Sunday in 16 years and we don't plan to start.",
    faithCategory: "Church Building",
    orgId: "o2",
    raiser: {
      name: "Church Under The Bridge Lagos",
      avatar: p(3),
      location: "Lagos Island, Nigeria",
      trustScore: 97,
    },
    cover: p(4),
    gallery: [p(4), p(5)],
    raised: 4200000,
    donors: 763,
    currency: "NGN",
    location: "Lagos, Nigeria",
    urgency: "high",
    createdAt: "2024-08-01",
    verificationStatus: "verified",
    updates: [
      {
        id: "u2",
        date: "2025-05-18",
        title: "340 people fed last Sunday",
        body: "Record attendance this week. We were nearly out of food by the end. Thank God for a ₦80,000 donation that helped us manage.",
      },
      {
        id: "u3",
        date: "2025-05-04",
        title: "100 new bibles distributed",
        body: "100 new bibles distributed to people who had never owned one. Some wept. This is why we do this.",
      },
    ],
    comments: [
      {
        id: "c2",
        author: "Tunde A.",
        avatar: p(4),
        date: "1 week ago",
        body: "I've visited twice. The love here is real.",
      },
    ],
    donations: [
      { id: "d3", donor: "Anonymous", amount: 10000, date: "2h" },
      { id: "d4", donor: "Joy M.", amount: 5000, date: "1d", note: "Every Sunday without fail" },
    ],
    frequencies: ["weekly", "monthly"],
  },
  {
    id: "gfc3",
    mode: "ongoing",
    type: "money",
    title: "Missionary Kolade — Wells & Community Work",
    story:
      "Kolade Akinwale has been digging wells and building latrines in underserved communities across North-Central Nigeria for 7 years. He doesn't have a target — he just needs consistent support to keep going. Follow his work, give what you can, whenever you can.",
    faithCategory: "Missions & Outreach",
    orgId: "o4",
    raiser: { name: "Kolade Akinwale", avatar: p(9), location: "Kwara, Nigeria", trustScore: 88 },
    cover: p(10),
    gallery: [p(10), p(11), p(0)],
    raised: 890000,
    donors: 156,
    currency: "NGN",
    location: "North-Central Nigeria",
    urgency: "low",
    createdAt: "2024-12-01",
    verificationStatus: "unverified",
    updates: [
      {
        id: "u4",
        date: "2025-05-12",
        title: "5th well completed in Kwara",
        body: "Took 18 days. Community of 400 people now have clean water. Next stop: Edu Local Government.",
      },
    ],
    comments: [],
    donations: [
      { id: "d5", donor: "Seun A.", amount: 20000, date: "3d", note: "Keep digging Kolade" },
    ],
    frequencies: ["weekly", "monthly", "quarterly"],
  },
  {
    id: "gfc4",
    mode: "one-time",
    type: "money",
    title: "Build a permanent worship hall for ECWA Kano",
    story:
      "Our congregation of 180 believers in Kano has been meeting under a tent for 3 years. We have land, architectural drawings, and a builder ready. We need ₦8.5M to complete the shell structure — walls, roof, and windows. This is more than a building. It's a statement of presence in Kano.",
    faithCategory: "Church Building",
    orgId: "o1",
    raiser: { name: "ECWA Mission Board", avatar: p(0), location: "Kano, Nigeria", trustScore: 94 },
    cover: p(2),
    gallery: [p(2), p(3), p(4)],
    goal: 8500000,
    raised: 5120000,
    donors: 234,
    currency: "NGN",
    location: "Kano, Nigeria",
    urgency: "medium",
    createdAt: "2025-03-10",
    verificationStatus: "verified",
    updates: [
      {
        id: "u5",
        date: "2025-05-08",
        title: "Foundation complete",
        body: "The foundation was laid last Saturday. Over 60 congregation members helped dig. 60% funded — we're almost there.",
      },
    ],
    comments: [
      {
        id: "c3",
        author: "Pastor David O.",
        avatar: p(5),
        date: "5 days ago",
        body: "I built a church in 2019 and know what this moment feels like. Donating ₦500,000 right now.",
      },
    ],
    donations: [
      { id: "d6", donor: "Anonymous", amount: 500000, date: "5d" },
      { id: "d7", donor: "Rejoice I.", amount: 100000, date: "1w" },
    ],
  },
  {
    id: "gfc5",
    mode: "one-time",
    type: "item",
    title: "Grace Harvest needs 20 bunk beds for new children",
    story:
      "We recently took in 8 more children displaced from Plateau. Our dormitories are over capacity. We need 20 bunk beds with mattresses urgently. ₦1.2M will cover beds, mattresses, and bedding for all new children.",
    faithCategory: "Orphanage",
    orgId: "o3",
    raiser: {
      name: "Grace Harvest Orphanage",
      avatar: p(6),
      location: "Jos, Nigeria",
      trustScore: 91,
    },
    cover: p(7),
    gallery: [p(7), p(8)],
    goal: 1200000,
    raised: 780000,
    donors: 89,
    currency: "NGN",
    location: "Jos, Plateau State",
    urgency: "high",
    createdAt: "2025-05-01",
    verificationStatus: "verified",
    updates: [],
    comments: [
      {
        id: "c4",
        author: "Blessing C.",
        avatar: p(9),
        date: "2 days ago",
        body: "These children deserve proper rest. Donating now.",
      },
    ],
    donations: [{ id: "d8", donor: "Anonymous", amount: 50000, date: "2d" }],
    needs: ["Bunk bed + mattress", "Bedding set", "Pillow"],
  },
  {
    id: "gfc6",
    mode: "one-time",
    type: "money",
    title: "Emergency food for displaced Christians in Mangu",
    story:
      "Following recent violence in Mangu, Plateau State, over 200 Christian families have been displaced. They are sheltering in a church compound with no food supplies. We need ₦3M urgently to provide 2 weeks of food for these families.",
    faithCategory: "Emergency",
    raiser: {
      name: "Plateau Relief Network",
      avatar: p(11),
      location: "Jos, Nigeria",
      trustScore: 79,
    },
    cover: p(9),
    gallery: [p(9), p(10)],
    goal: 3000000,
    raised: 1650000,
    donors: 178,
    currency: "NGN",
    location: "Mangu, Plateau State",
    urgency: "critical",
    createdAt: "2025-05-14",
    verificationStatus: "pending",
    updates: [
      {
        id: "u6",
        date: "2025-05-16",
        title: "First food delivery made",
        body: "We delivered rice, beans, and oil to 60 families yesterday. 140 families still waiting. Please keep giving.",
      },
    ],
    comments: [],
    donations: [{ id: "d9", donor: "Anonymous", amount: 200000, date: "1d" }],
  },
];

export const categories: { label: Category; icon: string }[] = [
  { label: "Church Building", icon: "⛪" },
  { label: "Missions & Outreach", icon: "🌍" },
  { label: "Orphanage", icon: "🏠" },
  { label: "Education", icon: "📚" },
  { label: "Food & Relief", icon: "🍚" },
  { label: "Medical Mission", icon: "🩺" },
  { label: "Emergency", icon: "🚨" },
  { label: "Community Development", icon: "🤝" },
];

export const myRecurringDonations: RecurringDonation[] = [
  {
    id: "rd1",
    donorId: "me",
    targetId: "gfc1",
    targetName: "ECWA Missionaries in Borno",
    targetCover: p(1),
    amount: 25000,
    frequency: "monthly",
    mode: "auto",
    nextDate: "2025-07-01",
    active: true,
  },
  {
    id: "rd2",
    donorId: "me",
    targetId: "gfc2",
    targetName: "Church Under The Bridge",
    targetCover: p(4),
    amount: 10000,
    frequency: "weekly",
    mode: "pledge",
    nextDate: "2025-06-15",
    active: true,
  },
];

export const me = {
  name: "Tunde Adebayo",
  avatar: p(4),
  location: "Lagos, Nigeria",
  joined: "January 2024",
  totalGiven: 480000,
  verifications: ["BVN verified", "Phone verified", "Email verified"],
};

// ─── Admin Types ───────────────────────────────────────────

export type UserRole = "donor" | "org_admin" | "platform_admin";
export type UserStatus = "active" | "suspended";

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  role: UserRole;
  status: UserStatus;
  phoneVerified: boolean;
  emailVerified: boolean;
  bvnVerified: boolean;
  suspendedAt?: string;
  suspendReason?: string;
  joinedAt: string;
  totalGiven: number;
  donationsCount: number;
  campaignsCreated: number;
};

export type PlatformSettings = {
  platformFeePercent: number;
  minDonation: number;
  maxDonation: number;
  maxTipAmount: number;
  campaignExpiryDays: number;
  autoApproveVerifiedOrgs: boolean;
  requirePhoneForCampaigns: boolean;
  reapplicationDays: number;
  emailNotifications: boolean;
  smsNotifications: boolean;
  adminNotificationEmail: string;
};

export type AdminNotification = {
  id: string;
  type: "org_verification" | "campaign_moderation" | "user_report" | "system";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
};

// ─── Admin Mock Data ───────────────────────────────────────

const avatarUrls = [p(0), p(1), p(2), p(3), p(4), p(5), p(6), p(7), p(8), p(9)];

export const users: User[] = [
  {
    id: "u1",
    name: "Tunde Adebayo",
    email: "tunde@azarfaith.com",
    phone: "+2348012345678",
    avatar: avatarUrls[4],
    role: "platform_admin",
    status: "active",
    phoneVerified: true,
    emailVerified: true,
    bvnVerified: true,
    joinedAt: "2024-01-15",
    totalGiven: 480000,
    donationsCount: 34,
    campaignsCreated: 0,
  },
  {
    id: "u2",
    name: "Chidinma Okoro",
    email: "chidinma@gmail.com",
    phone: "+2348023456789",
    avatar: avatarUrls[0],
    role: "donor",
    status: "active",
    phoneVerified: true,
    emailVerified: true,
    bvnVerified: false,
    joinedAt: "2024-03-10",
    totalGiven: 320000,
    donationsCount: 22,
    campaignsCreated: 0,
  },
  {
    id: "u3",
    name: "Pastor Emeka Nwosu",
    email: "emeka@churchunderthebridge.org",
    phone: "+2348034567890",
    avatar: avatarUrls[3],
    role: "org_admin",
    status: "active",
    phoneVerified: true,
    emailVerified: true,
    bvnVerified: true,
    joinedAt: "2024-02-20",
    totalGiven: 150000,
    donationsCount: 12,
    campaignsCreated: 2,
  },
  {
    id: "u4",
    name: "Grace Adekunle",
    email: "grace@graceharvest.org",
    phone: "+2348045678901",
    avatar: avatarUrls[1],
    role: "org_admin",
    status: "active",
    phoneVerified: true,
    emailVerified: true,
    bvnVerified: false,
    joinedAt: "2024-04-05",
    totalGiven: 85000,
    donationsCount: 8,
    campaignsCreated: 1,
  },
  {
    id: "u5",
    name: "Kolade Akinwale",
    email: "kolade@capros.org",
    phone: "+2348056789012",
    avatar: avatarUrls[9],
    role: "org_admin",
    status: "active",
    phoneVerified: true,
    emailVerified: false,
    bvnVerified: false,
    joinedAt: "2024-12-01",
    totalGiven: 0,
    donationsCount: 0,
    campaignsCreated: 1,
  },
  {
    id: "u6",
    name: "Funke Oladipo",
    email: "funke@yahoo.com",
    phone: "+2348067890123",
    avatar: avatarUrls[2],
    role: "donor",
    status: "active",
    phoneVerified: true,
    emailVerified: true,
    bvnVerified: true,
    joinedAt: "2024-05-18",
    totalGiven: 275000,
    donationsCount: 19,
    campaignsCreated: 0,
  },
  {
    id: "u7",
    name: "David Ogundimu",
    email: "david.og@gmail.com",
    phone: "+2348078901234",
    avatar: avatarUrls[5],
    role: "donor",
    status: "suspended",
    phoneVerified: true,
    emailVerified: true,
    bvnVerified: false,
    suspendedAt: "2025-05-20",
    suspendReason: "Reported for suspicious donation patterns",
    joinedAt: "2024-06-22",
    totalGiven: 45000,
    donationsCount: 5,
    campaignsCreated: 0,
  },
  {
    id: "u8",
    name: "Blessing Chukwu",
    email: "blessing.c@gmail.com",
    phone: "+2348089012345",
    avatar: avatarUrls[6],
    role: "donor",
    status: "active",
    phoneVerified: true,
    emailVerified: false,
    bvnVerified: false,
    joinedAt: "2025-01-08",
    totalGiven: 120000,
    donationsCount: 9,
    campaignsCreated: 0,
  },
  {
    id: "u9",
    name: "Isaac Bello",
    email: "isaac@lifegate.edu.ng",
    phone: "+2348090123456",
    avatar: avatarUrls[7],
    role: "org_admin",
    status: "active",
    phoneVerified: true,
    emailVerified: true,
    bvnVerified: false,
    joinedAt: "2024-09-14",
    totalGiven: 60000,
    donationsCount: 4,
    campaignsCreated: 1,
  },
  {
    id: "u10",
    name: "Ngozi Eze",
    email: "ngozi@plateaurelief.org",
    phone: "+2348001234567",
    avatar: avatarUrls[8],
    role: "donor",
    status: "active",
    phoneVerified: true,
    emailVerified: true,
    bvnVerified: true,
    joinedAt: "2025-02-14",
    totalGiven: 200000,
    donationsCount: 11,
    campaignsCreated: 1,
  },
];

export const platformSettings: PlatformSettings = {
  platformFeePercent: 2.5,
  minDonation: 100,
  maxDonation: 5000000,
  maxTipAmount: 2500,
  campaignExpiryDays: 90,
  autoApproveVerifiedOrgs: false,
  requirePhoneForCampaigns: true,
  reapplicationDays: 30,
  emailNotifications: true,
  smsNotifications: true,
  adminNotificationEmail: "admin@azarfaith.com",
};

export const adminNotifications: AdminNotification[] = [
  {
    id: "an1",
    type: "org_verification",
    title: "New organization registered",
    message: "CAPROS Nigeria has registered and is awaiting verification.",
    read: false,
    createdAt: "2025-05-14",
    link: "/admin/orgs/o4",
  },
  {
    id: "an2",
    type: "org_verification",
    title: "New organization registered",
    message: "Lifegate Christian Academy has registered and is awaiting verification.",
    read: false,
    createdAt: "2025-04-20",
    link: "/admin/orgs/o5",
  },
  {
    id: "an3",
    type: "campaign_moderation",
    title: "Campaign pending review",
    message: "Emergency food for displaced Christians in Mangu is pending moderation.",
    read: false,
    createdAt: "2025-05-14",
    link: "/admin/campaigns/gfc6",
  },
  {
    id: "an4",
    type: "campaign_moderation",
    title: "Campaign pending review",
    message: "Missionary Kolade — Wells & Community Work needs review.",
    read: true,
    createdAt: "2024-12-02",
    link: "/admin/campaigns/gfc3",
  },
  {
    id: "an5",
    type: "user_report",
    title: "User suspended",
    message: "David Ogundimu was suspended for suspicious activity.",
    read: true,
    createdAt: "2025-05-20",
    link: "/admin/users/u7",
  },
];
