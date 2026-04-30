export type BadgeType = "verified" | "at-risk" | "flagged" | "pending";

export interface Business {
  id: string;
  name: string;
  handle: string;
  category: string;
  location: string;
  badge: BadgeType;
  verifiedDate: string;
  description: string;
  website?: string;
  phone?: string;
  reports: number;
}

export interface FraudReport {
  id: string;
  business: string;
  type: string;
  date: string;
  location: string;
  description: string;
  status: "open" | "investigating" | "resolved";
  severity: "low" | "medium" | "high";
  anonymous: boolean;
}

export interface ScamAlert {
  id: string;
  date: string;
  type: string;
  location: string;
  description: string;
  affectedCount: number;
}

export const businesses: Business[] = [
  {
    id: "1",
    name: "UrbanTrendy",
    handle: "@UrbanTrendy",
    category: "Fashion & Retail",
    location: "Nairobi, Kenya",
    badge: "verified",
    verifiedDate: "2024-01-15",
    description: "Verified online fashion retailer operating since 2019.",
    website: "urbantrendy.co.ke",
    phone: "+254 700 123 456",
    reports: 0,
  },
  {
    id: "2",
    name: "Kili Ecommerce",
    handle: "@kili.co.ke",
    category: "E-Commerce",
    location: "Mombasa, Kenya",
    badge: "verified",
    verifiedDate: "2024-02-20",
    description: "Trusted e-commerce marketplace for East Africa.",
    website: "kili.co.ke",
    phone: "+254 711 234 567",
    reports: 1,
  },
  {
    id: "3",
    name: "ShopSmart KE",
    handle: "@ShopSmartKE",
    category: "Online Retail",
    location: "Nairobi, Kenya",
    badge: "at-risk",
    verifiedDate: "2023-10-05",
    description: "Online retailer with multiple fraud complaints.",
    website: "shopsmart.co.ke",
    phone: "+254 722 345 678",
    reports: 7,
  },
  {
    id: "4",
    name: "Consumer Councilory",
    handle: "@ConsumerCouncilory",
    category: "Consumer Services",
    location: "Kisumu, Kenya",
    badge: "at-risk",
    verifiedDate: "2023-11-12",
    description: "Consumer advisory services provider.",
    reports: 3,
  },
  {
    id: "5",
    name: "TechHub Kenya",
    handle: "@TechHubKE",
    category: "Technology",
    location: "Nairobi, Kenya",
    badge: "verified",
    verifiedDate: "2024-03-01",
    description: "Leading tech solutions provider in East Africa.",
    website: "techhub.co.ke",
    phone: "+254 733 456 789",
    reports: 0,
  },
  {
    id: "6",
    name: "FakeDeals.co.ke",
    handle: "@FakeDeals",
    category: "Online Retail",
    location: "Nairobi, Kenya",
    badge: "flagged",
    verifiedDate: "2023-06-01",
    description: "Multiple confirmed fraud cases. Do not transact.",
    reports: 24,
  },
  {
    id: "7",
    name: "SafariPay",
    handle: "@SafariPay",
    category: "Fintech",
    location: "Nairobi, Kenya",
    badge: "pending",
    verifiedDate: "2024-04-10",
    description: "Mobile payment solution under verification review.",
    website: "safaripay.co.ke",
    reports: 0,
  },
  {
    id: "8",
    name: "Mama Mboga Digital",
    handle: "@MamaMbogaDigital",
    category: "Food & Grocery",
    location: "Eldoret, Kenya",
    badge: "verified",
    verifiedDate: "2024-01-28",
    description: "Online fresh produce delivery service.",
    website: "mamambogadigital.co.ke",
    phone: "+254 744 567 890",
    reports: 0,
  },
];

export const fraudReports: FraudReport[] = [
  {
    id: "r1",
    business: "@ShopSmart",
    type: "Social Media Scam",
    date: "2023-10-03",
    location: "Canatin, Rasaskenya",
    description: "Advertised products on social media, collected payments but never delivered goods.",
    status: "investigating",
    severity: "high",
    anonymous: true,
  },
  {
    id: "r2",
    business: "@ShopSmart",
    type: "Social Commerce",
    date: "2023-11-23",
    location: "Canatin, Kenya",
    description: "Fake reviews and inflated ratings used to deceive customers.",
    status: "open",
    severity: "medium",
    anonymous: true,
  },
  {
    id: "r3",
    business: "@FakeDeals",
    type: "Social Commerce",
    date: "2023-12-23",
    location: "Canatin, Kenya",
    description: "Offers heavily discounted items, takes payment, delivers counterfeit goods.",
    status: "resolved",
    severity: "high",
    anonymous: true,
  },
  {
    id: "r4",
    business: "@UnknownSeller",
    type: "Social",
    date: "2023-10-28",
    location: "Canatin",
    description: "Impersonating a known brand to collect payments via M-Pesa.",
    status: "open",
    severity: "high",
    anonymous: true,
  },
  {
    id: "r5",
    business: "@QuickLoans254",
    type: "Financial Fraud",
    date: "2024-01-15",
    location: "Nairobi, Kenya",
    description: "Collecting loan processing fees without providing loans.",
    status: "investigating",
    severity: "high",
    anonymous: false,
  },
  {
    id: "r6",
    business: "@TechSupportKE",
    type: "Tech Support Scam",
    date: "2024-02-10",
    location: "Mombasa, Kenya",
    description: "Fake tech support calls requesting remote access to banking apps.",
    status: "open",
    severity: "medium",
    anonymous: true,
  },
];

export const scamAlerts: ScamAlert[] = [
  {
    id: "s1",
    date: "2023-10-03",
    type: "Social Commerce",
    location: "Nairobi, Kenya",
    description: "Multiple reports of social media stores collecting payments for non-existent goods.",
    affectedCount: 47,
  },
  {
    id: "s2",
    date: "2023-11-23",
    type: "Social Commerce",
    location: "Canatin, Kenya",
    description: "Fake brand impersonation scam targeting WhatsApp users.",
    affectedCount: 23,
  },
  {
    id: "s3",
    date: "2023-12-23",
    type: "Social Commerce",
    location: "Canatin, Kenya",
    description: "Christmas deals scam — fake online shops offering unrealistic discounts.",
    affectedCount: 102,
  },
  {
    id: "s4",
    date: "2023-10-28",
    type: "Social",
    location: "Canatin",
    description: "M-Pesa reversal scam targeting small business owners.",
    affectedCount: 31,
  },
  {
    id: "s5",
    date: "2024-01-15",
    type: "Financial Fraud",
    location: "Nairobi, Kenya",
    description: "Loan processing fee fraud targeting unemployed youth.",
    affectedCount: 89,
  },
  {
    id: "s6",
    date: "2024-02-10",
    type: "Tech Support",
    location: "Mombasa, Kenya",
    description: "Fake Microsoft support calls requesting remote access.",
    affectedCount: 15,
  },
  {
    id: "s7",
    date: "2024-03-05",
    type: "Investment Scam",
    location: "Kisumu, Kenya",
    description: "Cryptocurrency investment scam promising 300% returns.",
    affectedCount: 204,
  },
];
