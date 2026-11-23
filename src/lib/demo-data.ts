// Demo data for local development and demos. Loaded into Firebase by scripts/seed-firebase.mts.
// Prices are in naira; phone numbers are fake.

export const DEMO_PASSWORD = "findme-demo-2026";

export type SeedPro = {
  name: string;
  headline: string;
  bio: string;
  location: string;
  category: string;
  rate: number;
  available?: boolean;
  /** E.164 business line. Defaults to a fake demo mobile number. */
  phone?: string;
  whatsapp?: boolean;
  /** Show the number publicly on the profile (businesses that want calls). */
  showPhone?: boolean;
  skills: [string, string][];
  services: { title: string; description: string; price: number; unit: "hour" | "project"; days: number }[];
};

// Prices are in Nigerian naira (₦).
export const PROS: SeedPro[] = [
  {
    name: "Amara Okafor",
    headline: "Brand & UI designer for ambitious Nigerian startups",
    bio: "Eight years shaping identities and product interfaces for fintechs, restaurants and fashion brands across Lagos. I turn fuzzy ideas into clear, memorable brands people love.",
    location: "Lekki, Lagos",
    category: "design",
    rate: 15000,
    skills: [["Logo Design", "Expert"], ["UI Design", "Expert"], ["Figma", "Expert"], ["Brand Strategy", "Intermediate"]],
    services: [
      { title: "Complete brand identity kit", description: "Logo, colour palette, typography and a one-page brand guide.", price: 250000, unit: "project", days: 7 },
      { title: "Mobile app UI design", description: "Up to 10 polished screens in Figma with a clickable prototype.", price: 450000, unit: "project", days: 10 },
    ],
  },
  {
    name: "Tunde Bakare",
    headline: "Full-stack developer · React, Node & Paystack integrations",
    bio: "I build fast, reliable websites and web apps end to end. Former fintech engineer in Yaba, now helping SMEs go online with payments that just work.",
    location: "Yaba, Lagos",
    category: "development",
    rate: 20000,
    skills: [["React", "Expert"], ["Next.js", "Expert"], ["Node.js", "Expert"], ["Paystack Integration", "Expert"], ["Website Development", "Expert"]],
    services: [
      { title: "Business website with online payments", description: "Responsive, SEO-ready site with Paystack or Flutterwave checkout.", price: 600000, unit: "project", days: 14 },
      { title: "Bug fixing & feature work", description: "Hourly help on an existing React or Node codebase.", price: 20000, unit: "hour", days: 1 },
    ],
  },
  {
    name: "Emeka Nwosu",
    headline: "Licensed electrician — homes, shops & estates",
    bio: "12 years on the tools. House wiring, fault finding, changeover switches and safety checks, done neat and on time anywhere in Abuja.",
    location: "Gwarinpa, FCT Abuja",
    category: "home",
    rate: 8000,
    skills: [["Electrical Wiring", "Expert"], ["Changeover Installation", "Expert"], ["Lighting Installation", "Expert"]],
    services: [
      { title: "Light & socket installation", description: "Install or replace up to 6 fittings, including testing.", price: 25000, unit: "project", days: 1 },
      { title: "Electrical fault finding", description: "Diagnose tripping breakers, dead sockets and power surges.", price: 8000, unit: "hour", days: 1 },
    ],
  },
  {
    name: "Kemi Adeyemi",
    headline: "Maths & physics tutor · WAEC, NECO & JAMB",
    bio: "Patient tutor who makes hard topics click. 300+ students coached to better WAEC and JAMB scores, home lessons in Ibadan or online.",
    location: "Bodija, Ibadan",
    category: "tutoring",
    rate: 5000,
    skills: [["Mathematics", "Expert"], ["Physics", "Expert"], ["JAMB Preparation", "Expert"], ["WAEC Preparation", "Expert"]],
    services: [
      { title: "1:1 home lesson", description: "60-minute focused session with notes and past questions.", price: 5000, unit: "hour", days: 1 },
      { title: "JAMB crash course (8 sessions)", description: "Structured revision plan with CBT practice and mock exams.", price: 60000, unit: "project", days: 28 },
    ],
  },
  {
    name: "Zainab Bello",
    headline: "Copywriter & translator (English · Hausa)",
    bio: "Words that sell without sounding salesy. Website copy, product descriptions, radio jingles and Hausa translation for brands reaching the North.",
    location: "Nassarawa, Kano",
    category: "writing",
    rate: 10000,
    skills: [["Copywriting", "Expert"], ["Hausa Translation", "Expert"], ["Content Strategy", "Intermediate"], ["SEO Writing", "Intermediate"]],
    services: [
      { title: "Website copy (up to 5 pages)", description: "Research, messaging and conversion-focused copy.", price: 150000, unit: "project", days: 7 },
      { title: "English ↔ Hausa translation", description: "Native-quality translation, per 1,000 words.", price: 20000, unit: "project", days: 2 },
    ],
  },
  {
    name: "Femi Ogunleye",
    headline: "Wedding & portrait photographer",
    bio: "Natural light, honest moments. 150+ traditional and white weddings covered across the South-West — I love telling your story through images.",
    location: "Ikeja, Lagos",
    category: "photo",
    rate: 30000,
    skills: [["Wedding Photography", "Expert"], ["Portrait Photography", "Expert"], ["Photo Editing", "Expert"], ["Lightroom", "Expert"]],
    services: [
      { title: "Full-day wedding coverage", description: "Traditional or white wedding, 500+ edited photos and an online gallery.", price: 850000, unit: "project", days: 21 },
      { title: "Portrait or birthday shoot", description: "1-hour studio or outdoor shoot, 25 retouched images.", price: 70000, unit: "project", days: 5 },
    ],
  },
  {
    name: "Chiamaka Eze",
    headline: "Social media & Instagram ads manager",
    bio: "I help restaurants, boutiques and online vendors get more customers from Instagram, TikTok and Google — with honest monthly reports.",
    location: "Independence Layout, Enugu",
    category: "marketing",
    rate: 10000,
    skills: [["Instagram Marketing", "Expert"], ["Facebook Ads", "Expert"], ["Google Ads", "Intermediate"], ["Social Media Management", "Expert"]],
    services: [
      { title: "Social media audit", description: "Full review of your pages with a list of quick wins.", price: 50000, unit: "project", days: 4 },
      { title: "Monthly page management", description: "Content calendar, 12 posts, ads management and reporting.", price: 180000, unit: "project", days: 30 },
    ],
  },
  {
    name: "Ibrahim Musa",
    headline: "Plumber — leaks, boreholes & bathroom fittings",
    bio: "Fast, clean and fairly priced. Bathrooms, kitchens, water heaters, overhead tanks and the leak you didn't plan for.",
    location: "Barnawa, Kaduna",
    category: "home",
    rate: 6000,
    available: false,
    skills: [["Plumbing", "Expert"], ["Water Heater Repair", "Expert"], ["Bathroom Fitting", "Intermediate"], ["Borehole Pump Repair", "Intermediate"]],
    services: [
      { title: "Leak repair call-out", description: "Find and fix leaks in pipes, taps, tanks or toilets.", price: 6000, unit: "hour", days: 1 },
      { title: "Water heater installation", description: "Remove old unit, install and test the new one.", price: 35000, unit: "project", days: 1 },
    ],
  },
  {
    name: "Ngozi Okonkwo",
    phone: "+23492345601", // office landline, Abuja
    whatsapp: false,
    showPhone: true,
    headline: "Chartered accountant · bookkeeping & FIRS tax filing",
    bio: "ICAN-certified accountant who keeps your books clean and your FIRS and state tax filings stress-free. QuickBooks and Sage expert.",
    location: "Wuse, FCT Abuja",
    category: "business",
    rate: 12000,
    skills: [["Bookkeeping", "Expert"], ["Tax Filing", "Expert"], ["QuickBooks", "Expert"], ["CAC Registration", "Intermediate"]],
    services: [
      { title: "Monthly bookkeeping", description: "Reconciliation, invoices and a clear monthly report.", price: 75000, unit: "project", days: 30 },
      { title: "Business plan & financial model", description: "Bank- and investor-ready plan with 3-year projections.", price: 200000, unit: "project", days: 10 },
    ],
  },
  {
    name: "Segun Afolabi",
    headline: "Music producer, mixing & mastering engineer",
    bio: "Afrobeats, gospel and highlife mixes that slap on radio and streaming. Analog warmth, modern punch.",
    location: "Surulere, Lagos",
    category: "music",
    rate: 15000,
    skills: [["Mixing", "Expert"], ["Mastering", "Expert"], ["Beat Production", "Expert"], ["Afrobeats Production", "Expert"]],
    services: [
      { title: "Mix & master one song", description: "Two revisions included, stems welcome.", price: 60000, unit: "project", days: 4 },
      { title: "Custom Afrobeats instrumental", description: "Original beat with exclusive rights.", price: 120000, unit: "project", days: 5 },
    ],
  },
  {
    name: "Blessing Uche",
    headline: "Fitness coach & nutrition consultant",
    bio: "Certified personal trainer helping busy people move better, eat smarter with Nigerian meals, and feel stronger.",
    location: "GRA, Port Harcourt",
    category: "wellness",
    rate: 7000,
    skills: [["Personal Training", "Expert"], ["Nutrition Coaching", "Expert"], ["Yoga", "Intermediate"]],
    services: [
      { title: "Personal training session", description: "Home or gym session tailored to your level.", price: 7000, unit: "hour", days: 1 },
      { title: "4-week body transformation plan", description: "Weekly sessions, Nigerian meal plan and habit tracking.", price: 80000, unit: "project", days: 28 },
    ],
  },
  {
    name: "Chinedu Obi",
    headline: "Phone, laptop & network repair technician",
    bio: "Screens, batteries, slow laptops and Wi-Fi that won't behave. Same-day fixes for most devices, pickup available in Owerri.",
    location: "Owerri, Imo",
    category: "repairs",
    rate: 5000,
    skills: [["Laptop Repair", "Expert"], ["Phone Screen Replacement", "Expert"], ["Network Setup", "Intermediate"], ["Data Recovery", "Intermediate"]],
    services: [
      { title: "Laptop tune-up & cleanup", description: "Virus removal, updates and speed boost.", price: 15000, unit: "project", days: 1 },
      { title: "Home or office Wi-Fi setup", description: "Router config, extenders and device hookup.", price: 25000, unit: "project", days: 1 },
    ],
  },
  {
    name: "Funke Adebayo",
    headline: "Makeup artist & gele stylist",
    bio: "Bridal, owambe and photoshoot makeup that lasts all night. Perfect gele tying for brides and their squad.",
    location: "Abeokuta, Ogun",
    category: "events",
    rate: 15000,
    skills: [["Bridal Makeup", "Expert"], ["Gele Tying", "Expert"], ["Event Makeup", "Expert"]],
    services: [
      { title: "Bridal makeup & gele", description: "Trial session plus wedding-day makeup and gele.", price: 120000, unit: "project", days: 1 },
      { title: "Owambe / party makeup", description: "Full glam for parties, birthdays or photoshoots.", price: 25000, unit: "project", days: 1 },
    ],
  },
  {
    name: "Yusuf Abdullahi",
    headline: "Mobile app developer · Flutter & React Native",
    bio: "Cross-platform apps that feel native. From MVP to Play Store and App Store, with clean code you can grow.",
    location: "Garki, FCT Abuja",
    category: "development",
    rate: 18000,
    skills: [["Flutter", "Expert"], ["React Native", "Expert"], ["Firebase", "Expert"], ["Mobile App Development", "Expert"]],
    services: [
      { title: "MVP mobile app", description: "Android + iOS app with login, core features and store release.", price: 1800000, unit: "project", days: 45 },
      { title: "App maintenance", description: "Updates, fixes and small features.", price: 18000, unit: "hour", days: 1 },
    ],
  },
  {
    name: "Aisha Lawal",
    headline: "Video editor & motion designer",
    bio: "YouTube videos, skits, adverts and reels that keep people watching. Snappy edits, clean motion graphics.",
    location: "Ilorin, Kwara",
    category: "photo",
    rate: 10000,
    skills: [["Video Editing", "Expert"], ["Motion Graphics", "Expert"], ["After Effects", "Expert"], ["CapCut", "Expert"]],
    services: [
      { title: "YouTube or skit edit (up to 15 min)", description: "Cuts, captions, music and colour.", price: 40000, unit: "project", days: 3 },
      { title: "Animated logo intro", description: "5–10 second motion logo with sound design.", price: 35000, unit: "project", days: 3 },
    ],
  },
  {
    name: "Adaeze Nnamdi",
    headline: "Fashion designer & tailor — native and corporate wear",
    bio: "Agbada, kaftans, ankara gowns and sharp corporate suits, cut to fit. Aso-ebi orders for families and bridal trains welcome.",
    location: "Onitsha, Anambra",
    category: "fashion",
    rate: 0,
    skills: [["Tailoring", "Expert"], ["Ankara Styles", "Expert"], ["Aso-ebi", "Expert"], ["Agbada", "Intermediate"]],
    services: [
      { title: "Custom ankara gown", description: "Measurement, design consultation and one fitting.", price: 35000, unit: "project", days: 7 },
      { title: "Aso-ebi group order (per outfit)", description: "Consistent styling for families and bridal trains.", price: 25000, unit: "project", days: 14 },
    ],
  },
  {
    name: "Sunday Okon",
    showPhone: true,
    headline: "Auto mechanic & car diagnostics specialist",
    bio: "Toyota, Honda and Lexus specialist. Computer diagnosis, servicing, AC and brake work. I come to you anywhere in Uyo.",
    location: "Uyo, Akwa Ibom",
    category: "auto",
    rate: 7000,
    skills: [["Car Diagnostics", "Expert"], ["Car Servicing", "Expert"], ["Car AC Repair", "Intermediate"], ["Brake Repair", "Expert"]],
    services: [
      { title: "Home car servicing", description: "Oil, filters and a full check at your home or office.", price: 30000, unit: "project", days: 1 },
      { title: "Computer diagnosis", description: "Scan, report and repair estimate.", price: 15000, unit: "project", days: 1 },
    ],
  },
  {
    name: "Ifeanyi Chukwu",
    showPhone: true,
    headline: "Solar, inverter & generator installer",
    bio: "Beat NEPA wahala for good. Solar and inverter systems sized for your home or shop, plus generator repair and servicing.",
    location: "Benin City, Edo",
    category: "power",
    rate: 10000,
    skills: [["Solar Installation", "Expert"], ["Inverter Installation", "Expert"], ["Generator Repair", "Expert"]],
    services: [
      { title: "Home solar & inverter system (3.5kVA)", description: "Panels, inverter, batteries and installation.", price: 2500000, unit: "project", days: 3 },
      { title: "Generator servicing & repair", description: "Diagnosis, servicing and parts sourcing.", price: 15000, unit: "project", days: 1 },
    ],
  },
  {
    name: "Musa Garba",
    showPhone: true,
    headline: "Dispatch rider & same-day delivery",
    bio: "Reliable dispatch across Lagos mainland and island. Documents, food, parcels and online orders, delivered the same day.",
    location: "Surulere, Lagos",
    category: "logistics",
    rate: 0,
    skills: [["Dispatch Delivery", "Expert"], ["Same-day Delivery", "Expert"], ["Moving & Haulage", "Intermediate"]],
    services: [
      { title: "Same-day dispatch (within Lagos)", description: "Pickup and drop-off across mainland and island.", price: 4000, unit: "project", days: 1 },
      { title: "Home or office moving", description: "Van, two loaders and careful packing.", price: 80000, unit: "project", days: 1 },
    ],
  },
  {
    name: "Halima Sani",
    headline: "Caterer — small chops, jollof & event catering",
    bio: "Party jollof that people talk about. Small chops, cakes and full event catering for 20 to 500 guests.",
    location: "Jos, Plateau",
    category: "food",
    showPhone: true,
    rate: 0,
    skills: [["Event Catering", "Expert"], ["Small Chops", "Expert"], ["Cake Baking", "Intermediate"]],
    services: [
      { title: "Small chops for 50 guests", description: "Puff-puff, samosa, spring rolls, peppered chicken and more.", price: 90000, unit: "project", days: 2 },
      { title: "Full event catering (per guest)", description: "Jollof, fried rice, proteins, salad and drinks.", price: 6500, unit: "project", days: 5 },
    ],
  },
  {
    name: "Tobi Alade",
    headline: "Private chef · dinners, meal prep & Nigerian fusion",
    bio: "Trained chef who cooks in your home. Intimate dinners, weekly meal prep for busy families, and Nigerian classics with a modern twist.",
    location: "Victoria Island, Lagos",
    category: "food",
    rate: 15000,
    skills: [["Private Chef", "Expert"], ["Meal Prep", "Expert"], ["Nigerian Cuisine", "Expert"], ["Continental Cuisine", "Intermediate"]],
    services: [
      { title: "Private dinner for 6", description: "Three-course menu cooked and served in your home, shopping included.", price: 180000, unit: "project", days: 3 },
      { title: "Weekly family meal prep", description: "Soups, stews and proteins for the week, portioned and labelled.", price: 70000, unit: "project", days: 2 },
    ],
  },
  {
    name: "Nkechi Ibe",
    headline: "Home cook — native soups, stews & office lunches",
    bio: "Egusi, ogbono, afang, banga and more, cooked fresh the way mama makes it. Soups in bulk for your freezer, or daily lunch for your office.",
    location: "Wuse, FCT Abuja",
    category: "food",
    rate: 0,
    skills: [["Nigerian Soups", "Expert"], ["Home Cooking", "Expert"], ["Office Lunch Catering", "Intermediate"]],
    services: [
      { title: "Soup in bulk (5 litres)", description: "Any native soup with assorted meat or fish, ready for your freezer.", price: 45000, unit: "project", days: 2 },
      { title: "Office lunch (per plate, min. 10)", description: "Rice, swallow or pasta with protein, delivered hot.", price: 3500, unit: "project", days: 1 },
    ],
  },
  {
    name: "Grace Amadi",
    headline: "Cake baker — birthdays, weddings & chops boxes",
    bio: "Beautiful cakes that taste even better. Fondant and buttercream designs, wedding cakes and party packs across Port Harcourt.",
    location: "GRA, Port Harcourt",
    category: "food",
    rate: 0,
    showPhone: true,
    skills: [["Cake Baking", "Expert"], ["Wedding Cakes", "Expert"], ["Small Chops", "Intermediate"]],
    services: [
      { title: "Custom birthday cake (8 inch)", description: "Your design, two flavours, delivered.", price: 45000, unit: "project", days: 3 },
      { title: "Wedding cake (3 tiers)", description: "Tasting session, design and delivery to the venue.", price: 350000, unit: "project", days: 14 },
    ],
  },
  {
    name: "Bisi Ajayi",
    headline: "Home & office cleaning, deep cleaning and fumigation",
    bio: "Trained, background-checked team for regular cleaning, post-construction deep cleans and fumigation. We bring our own equipment.",
    location: "Ikeja, Lagos",
    category: "cleaning",
    rate: 5000,
    showPhone: true,
    skills: [["House Cleaning", "Expert"], ["Deep Cleaning", "Expert"], ["Fumigation", "Expert"], ["Post-construction Cleaning", "Intermediate"]],
    services: [
      { title: "Deep clean (3-bedroom flat)", description: "Kitchen, bathrooms, floors, windows and appliances, top to bottom.", price: 60000, unit: "project", days: 1 },
      { title: "Fumigation", description: "Safe treatment for cockroaches, rats and mosquitoes.", price: 35000, unit: "project", days: 1 },
    ],
  },
  {
    name: "Usman Danjuma",
    headline: "Laundry & dry cleaning with free pickup",
    bio: "Wash, iron and dry clean for homes and offices. Free pickup and delivery within Kano city, 48-hour turnaround.",
    location: "Nassarawa, Kano",
    category: "cleaning",
    rate: 0,
    skills: [["Laundry", "Expert"], ["Dry Cleaning", "Expert"], ["Ironing", "Expert"]],
    services: [
      { title: "Wash & iron (bag of 20 items)", description: "Pickup, wash, iron and fold, back in 48 hours.", price: 8000, unit: "project", days: 2 },
      { title: "Dry clean native wear (per piece)", description: "Agbada, kaftan, lace and aso-oke handled with care.", price: 2500, unit: "project", days: 3 },
    ],
  },
];

export const CLIENTS = [
  { name: "Tolu Adewale", email: "tolu@example.com" },
  { name: "Obinna Eze", email: "obinna@example.com" },
  { name: "Hauwa Mohammed", email: "hauwa@example.com" },
];

export const REVIEW_LINES = [
  [5, "Absolutely brilliant. Communication was clear and the result was better than I hoped."],
  [5, "Fast, professional and very respectful. I'll book again for sure."],
  [4, "Great work and fair price. Took a day longer than planned but worth it."],
  [5, "Found them on findMe and it was the best decision. Highly recommend!"],
  [4, "Solid quality and easy to work with."],
] as const;
