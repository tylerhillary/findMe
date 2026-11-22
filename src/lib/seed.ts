import type { Database } from "./db";
import { hashPassword, newId } from "./crypto";

// Demo data so search has something to show on first run.
// Every seeded account uses the password below (see README).
export const DEMO_PASSWORD = "findin-demo-2026";

type SeedPro = {
  name: string;
  headline: string;
  bio: string;
  location: string;
  category: string;
  rate: number;
  available?: boolean;
  skills: [string, string][];
  services: { title: string; description: string; price: number; unit: "hour" | "project"; days: number }[];
};

const PROS: SeedPro[] = [
  {
    name: "Amara Okafor",
    headline: "Brand & UI designer for ambitious startups",
    bio: "Eight years shaping identities and product interfaces. I turn fuzzy ideas into clear, memorable brands and interfaces people love to use.",
    location: "Lagos, Nigeria",
    category: "design",
    rate: 45,
    skills: [["Logo Design", "Expert"], ["UI Design", "Expert"], ["Figma", "Expert"], ["Brand Strategy", "Intermediate"]],
    services: [
      { title: "Complete brand identity kit", description: "Logo, colour palette, typography and a one-page brand guide.", price: 450, unit: "project", days: 7 },
      { title: "Mobile app UI design", description: "Up to 10 polished screens in Figma with a clickable prototype.", price: 900, unit: "project", days: 10 },
    ],
  },
  {
    name: "Daniel Mensah",
    headline: "Full-stack developer · React, Node & Postgres",
    bio: "I build fast, reliable web apps end to end. Former fintech engineer, now helping small teams ship production-quality software.",
    location: "Accra, Ghana",
    category: "development",
    rate: 60,
    skills: [["React", "Expert"], ["Next.js", "Expert"], ["Node.js", "Expert"], ["PostgreSQL", "Intermediate"], ["Website Development", "Expert"]],
    services: [
      { title: "Business website with CMS", description: "Responsive, SEO-ready site your team can edit without code.", price: 1200, unit: "project", days: 14 },
      { title: "Bug fixing & feature work", description: "Hourly help on an existing React or Node codebase.", price: 60, unit: "hour", days: 1 },
    ],
  },
  {
    name: "Sofia Martins",
    headline: "Certified electrician — homes & small offices",
    bio: "Licensed electrician with 12 years on the tools. Wiring, lighting, fault finding and safety inspections, done tidy and on time.",
    location: "Lisbon, Portugal",
    category: "home",
    rate: 35,
    skills: [["Electrical Wiring", "Expert"], ["Lighting Installation", "Expert"], ["Safety Inspection", "Expert"]],
    services: [
      { title: "Light fitting installation", description: "Install or replace up to 5 fixtures, including testing.", price: 120, unit: "project", days: 1 },
      { title: "Electrical fault finding", description: "Diagnose tripping breakers, dead sockets and flickering lights.", price: 35, unit: "hour", days: 1 },
    ],
  },
  {
    name: "Kwame Asante",
    headline: "Maths & physics tutor · GCSE, A-Level, WAEC",
    bio: "Patient tutor who makes hard topics click. 300+ students coached to better grades, online or in person.",
    location: "Kumasi, Ghana",
    category: "tutoring",
    rate: 20,
    skills: [["Mathematics", "Expert"], ["Physics", "Expert"], ["Exam Preparation", "Expert"]],
    services: [
      { title: "1:1 maths tutoring session", description: "60-minute focused session with notes and practice problems.", price: 20, unit: "hour", days: 1 },
      { title: "Exam crash course (8 sessions)", description: "Structured revision plan with mock papers and feedback.", price: 140, unit: "project", days: 28 },
    ],
  },
  {
    name: "Lena Fischer",
    headline: "Copywriter & content strategist (EN / DE)",
    bio: "Words that sell without sounding salesy. Websites, product pages, newsletters and blog strategy for B2B and DTC brands.",
    location: "Berlin, Germany",
    category: "writing",
    rate: 50,
    skills: [["Copywriting", "Expert"], ["SEO Writing", "Expert"], ["German Translation", "Expert"], ["Content Strategy", "Intermediate"]],
    services: [
      { title: "Website copy (up to 5 pages)", description: "Research, messaging and conversion-focused copy.", price: 600, unit: "project", days: 7 },
      { title: "English ↔ German translation", description: "Native-quality translation, per 1,000 words.", price: 70, unit: "project", days: 2 },
    ],
  },
  {
    name: "Marcus Chen",
    headline: "Wedding & portrait photographer",
    bio: "Natural light, honest moments. I've photographed 150+ weddings and love telling stories through images.",
    location: "Toronto, Canada",
    category: "photo",
    rate: 80,
    skills: [["Wedding Photography", "Expert"], ["Portrait Photography", "Expert"], ["Photo Editing", "Expert"], ["Lightroom", "Expert"]],
    services: [
      { title: "Full-day wedding coverage", description: "8 hours, 500+ edited photos, online gallery.", price: 2200, unit: "project", days: 21 },
      { title: "Portrait session", description: "1-hour shoot, 25 retouched images.", price: 180, unit: "project", days: 5 },
    ],
  },
  {
    name: "Priya Sharma",
    headline: "Performance marketer · Meta & Google Ads",
    bio: "I help e-commerce and local businesses get more customers for less. Data-driven campaigns, honest reporting.",
    location: "Bengaluru, India",
    category: "marketing",
    rate: 40,
    skills: [["Google Ads", "Expert"], ["Facebook Ads", "Expert"], ["Social Media Marketing", "Expert"], ["Analytics", "Intermediate"]],
    services: [
      { title: "Ad account audit", description: "Full review with a prioritised list of quick wins.", price: 250, unit: "project", days: 4 },
      { title: "Monthly campaign management", description: "Strategy, creatives brief, optimisation and reporting.", price: 800, unit: "project", days: 30 },
    ],
  },
  {
    name: "Tomás Rivera",
    headline: "Plumber — leaks, installs and emergencies",
    bio: "Fast, clean and fairly priced. Bathrooms, kitchens, water heaters and the 2am leak you didn't plan for.",
    location: "Madrid, Spain",
    category: "home",
    rate: 30,
    available: false,
    skills: [["Plumbing", "Expert"], ["Water Heater Repair", "Expert"], ["Bathroom Fitting", "Intermediate"]],
    services: [
      { title: "Leak repair call-out", description: "Find and fix leaks in pipes, taps or toilets.", price: 30, unit: "hour", days: 1 },
      { title: "Water heater installation", description: "Remove old unit, install and test new one.", price: 220, unit: "project", days: 1 },
    ],
  },
  {
    name: "Aisha Bello",
    headline: "Bookkeeper & small-business accountant",
    bio: "Chartered accountant who keeps your books clean and your taxes stress-free. QuickBooks and Xero certified.",
    location: "Abuja, Nigeria",
    category: "business",
    rate: 35,
    skills: [["Bookkeeping", "Expert"], ["Tax Filing", "Expert"], ["QuickBooks", "Expert"], ["Financial Planning", "Intermediate"]],
    services: [
      { title: "Monthly bookkeeping", description: "Reconciliation, invoices and a clear monthly report.", price: 200, unit: "project", days: 30 },
      { title: "Business plan & financial model", description: "Investor-ready plan with 3-year projections.", price: 500, unit: "project", days: 10 },
    ],
  },
  {
    name: "Jonas Berg",
    headline: "Music producer, mixing & mastering engineer",
    bio: "Radio-ready mixes for artists, podcasts and brands. Analog warmth, modern punch.",
    location: "Stockholm, Sweden",
    category: "music",
    rate: 55,
    skills: [["Mixing", "Expert"], ["Mastering", "Expert"], ["Beat Production", "Expert"], ["Podcast Editing", "Intermediate"]],
    services: [
      { title: "Mix & master one song", description: "Two revisions included, stems welcome.", price: 150, unit: "project", days: 4 },
      { title: "Podcast episode edit", description: "Noise clean-up, levelling, intro/outro.", price: 60, unit: "project", days: 2 },
    ],
  },
  {
    name: "Grace Wanjiru",
    headline: "Yoga instructor & wellness coach",
    bio: "RYT-500 yoga teacher helping busy people move better, sleep better and breathe easier.",
    location: "Nairobi, Kenya",
    category: "wellness",
    rate: 25,
    skills: [["Yoga", "Expert"], ["Meditation", "Expert"], ["Nutrition Coaching", "Intermediate"]],
    services: [
      { title: "Private yoga class", description: "Online or in-home, tailored to your level.", price: 25, unit: "hour", days: 1 },
      { title: "4-week wellness programme", description: "Weekly sessions, meal guide and habit tracking.", price: 160, unit: "project", days: 28 },
    ],
  },
  {
    name: "Ethan Brooks",
    headline: "Laptop, phone & network repair technician",
    bio: "Screens, batteries, slow laptops, Wi-Fi that won't behave. Same-day fixes for most devices.",
    location: "Manchester, UK",
    category: "repairs",
    rate: 28,
    skills: [["Laptop Repair", "Expert"], ["Phone Screen Replacement", "Expert"], ["Network Setup", "Intermediate"], ["Data Recovery", "Intermediate"]],
    services: [
      { title: "Laptop tune-up & cleanup", description: "Malware removal, updates and speed boost.", price: 60, unit: "project", days: 1 },
      { title: "Home Wi-Fi setup", description: "Router config, mesh install and device hookup.", price: 80, unit: "project", days: 1 },
    ],
  },
  {
    name: "Chloé Dubois",
    headline: "Makeup artist & event stylist",
    bio: "Bridal, editorial and event makeup that lasts all night and looks great on camera.",
    location: "Paris, France",
    category: "events",
    rate: 45,
    skills: [["Bridal Makeup", "Expert"], ["Event Styling", "Intermediate"], ["Hair Styling", "Intermediate"]],
    services: [
      { title: "Bridal makeup with trial", description: "Trial session plus wedding-day application.", price: 280, unit: "project", days: 1 },
      { title: "Event makeup", description: "Party, gala or photoshoot look.", price: 90, unit: "project", days: 1 },
    ],
  },
  {
    name: "Yusuf Ibrahim",
    headline: "Mobile app developer · Flutter & React Native",
    bio: "Cross-platform apps that feel native. From MVP to App Store, with clean code you can grow.",
    location: "Cairo, Egypt",
    category: "development",
    rate: 50,
    skills: [["Flutter", "Expert"], ["React Native", "Expert"], ["Firebase", "Expert"], ["Mobile App Development", "Expert"]],
    services: [
      { title: "MVP mobile app", description: "iOS + Android app with auth, core features and store release.", price: 3500, unit: "project", days: 45 },
      { title: "App maintenance", description: "Updates, fixes and small features.", price: 50, unit: "hour", days: 1 },
    ],
  },
  {
    name: "Nadia Haddad",
    headline: "Video editor & motion designer",
    bio: "YouTube, ads and reels that keep people watching. Snappy edits, clean motion graphics.",
    location: "Beirut, Lebanon",
    category: "photo",
    rate: 40,
    skills: [["Video Editing", "Expert"], ["Motion Graphics", "Expert"], ["After Effects", "Expert"], ["Premiere Pro", "Expert"]],
    services: [
      { title: "YouTube video edit (up to 15 min)", description: "Cuts, captions, music and colour.", price: 150, unit: "project", days: 3 },
      { title: "Animated logo intro", description: "5–10 second motion logo with sound design.", price: 120, unit: "project", days: 3 },
    ],
  },
];

const CLIENTS = [
  { name: "Olivia Grant", email: "olivia@example.com" },
  { name: "Samuel Adeyemi", email: "samuel@example.com" },
  { name: "Hana Kim", email: "hana@example.com" },
];

const REVIEW_LINES = [
  [5, "Absolutely brilliant. Communication was clear and the result exceeded what I hoped for."],
  [5, "Fast, professional and genuinely kind. Booking again for sure."],
  [4, "Great work and fair price. Took a day longer than planned but worth it."],
  [5, "Found them on findIn and it was the best decision. Highly recommend."],
  [4, "Solid quality, easy to work with."],
] as const;

export function seed(db: Database) {
  const now = Date.now();
  const day = 86_400_000;
  const hash = hashPassword(DEMO_PASSWORD);

  db.exec("BEGIN");
  try {
    const insertUser = db.prepare(
      `INSERT INTO users (id, name, email, password_hash, role, headline, bio, location, category, hourly_rate, available, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const insertSkill = db.prepare("INSERT INTO skills (id, user_id, name, level) VALUES (?, ?, ?, ?)");
    const insertService = db.prepare(
      `INSERT INTO services (id, user_id, title, description, category, price, price_unit, delivery_days, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const insertRequest = db.prepare(
      `INSERT INTO requests (id, client_id, provider_id, service_id, title, budget, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const insertMessage = db.prepare(
      "INSERT INTO messages (id, request_id, sender_id, body, created_at) VALUES (?, ?, ?, ?, ?)"
    );
    const insertReview = db.prepare(
      `INSERT INTO reviews (id, request_id, provider_id, client_id, rating, comment, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );

    const clientIds = CLIENTS.map((c, i) => {
      const id = newId();
      insertUser.run(id, c.name, c.email, hash, "client", "", "", "", "", 0, 1, now - (60 - i) * day);
      return id;
    });

    PROS.forEach((p, i) => {
      const id = newId();
      const email = p.name.toLowerCase().split(" ")[0].normalize("NFD").replace(/[^a-z]/g, "") + "@example.com";
      insertUser.run(
        id, p.name, email, hash, "provider", p.headline, p.bio, p.location, p.category,
        p.rate, p.available === false ? 0 : 1, now - (120 - i * 3) * day
      );
      for (const [name, level] of p.skills) insertSkill.run(newId(), id, name, level);

      p.services.forEach((s, j) => {
        const serviceId = newId();
        insertService.run(serviceId, id, s.title, s.description, p.category, s.price, s.unit, s.days, now - (90 - j) * day);

        // A few completed, reviewed jobs per provider so ratings feel real.
        const reviews = (i + j) % 3 === 0 ? 1 : 2;
        for (let k = 0; k < reviews; k++) {
          const clientId = clientIds[(i + j + k) % clientIds.length];
          const reqId = newId();
          const created = now - (40 - i - k * 5) * day;
          insertRequest.run(reqId, clientId, id, serviceId, s.title, s.price, "completed", created, created + 3 * day);
          insertMessage.run(newId(), reqId, clientId, `Hi ${p.name.split(" ")[0]}, I'd love your help with "${s.title}".`, created);
          insertMessage.run(newId(), reqId, id, "Thanks for reaching out — happy to help! Let's get started.", created + 3_600_000);
          const [rating, comment] = REVIEW_LINES[(i * 2 + j + k) % REVIEW_LINES.length];
          insertReview.run(newId(), reqId, id, clientId, rating, comment, created + 4 * day);
        }
      });
    });
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}
