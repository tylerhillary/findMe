import { CATEGORIES, type CategorySlug } from "./categories";

/**
 * Everyday trades and professions people search for, each tied to the findMe category it lives
 * in. Used for search suggestions and for "closest field" results when a search finds nobody.
 */
export const PROFESSIONS: { name: string; category: CategorySlug; aliases?: string[] }[] = [
  // Home
  { name: "Plumber", category: "home", aliases: ["plumbing", "leak", "pipe", "tap", "borehole", "water heater"] },
  { name: "Electrician", category: "home", aliases: ["wiring", "electrical", "light", "socket", "rewiring"] },
  { name: "Carpenter", category: "home", aliases: ["furniture", "wood", "door", "wardrobe", "roofing"] },
  { name: "Painter", category: "home", aliases: ["painting", "paint", "screeding", "pop ceiling"] },
  { name: "Tiler", category: "home", aliases: ["tiles", "tiling", "floor"] },
  { name: "Bricklayer", category: "home", aliases: ["mason", "block work", "building", "construction"] },
  { name: "Gardener", category: "home", aliases: ["garden", "lawn", "landscaping", "flowers"] },
  { name: "Nanny", category: "home", aliases: ["babysitter", "childcare", "housemaid"] },
  { name: "Interior decorator", category: "home", aliases: ["interior", "decor", "curtains"] },
  // Repairs & tech
  { name: "AC repair technician", category: "repairs", aliases: ["air conditioner", "ac", "fridge", "refrigerator", "freezer"] },
  { name: "Phone repairer", category: "repairs", aliases: ["phone", "screen", "iphone", "android"] },
  { name: "Laptop repairer", category: "repairs", aliases: ["laptop", "computer", "pc"] },
  { name: "Welder", category: "repairs", aliases: ["welding", "gate", "iron"] },
  { name: "TV & appliance repairer", category: "repairs", aliases: ["tv", "television", "washing machine", "appliance", "microwave"] },
  { name: "CCTV installer", category: "repairs", aliases: ["cctv", "camera", "security camera"] },
  { name: "IT support", category: "repairs", aliases: ["network", "wifi", "router", "printer"] },
  // Power
  { name: "Generator repairer", category: "power", aliases: ["generator", "gen", "mikano"] },
  { name: "Solar installer", category: "power", aliases: ["solar", "solar panel", "battery"] },
  { name: "Inverter technician", category: "power", aliases: ["inverter", "ups"] },
  // Auto
  { name: "Mechanic", category: "auto", aliases: ["car repair", "engine", "car"] },
  { name: "Auto electrician", category: "auto", aliases: ["car wiring", "car ac"] },
  { name: "Panel beater", category: "auto", aliases: ["body work", "spray painter", "dent"] },
  { name: "Vulcanizer", category: "auto", aliases: ["tyre", "tire", "puncture"] },
  { name: "Car wash", category: "auto", aliases: ["detailing", "car cleaning"] },
  // Logistics
  { name: "Dispatch rider", category: "logistics", aliases: ["delivery", "dispatch", "courier", "errand"] },
  { name: "Driver", category: "logistics", aliases: ["chauffeur", "private driver"] },
  { name: "Mover", category: "logistics", aliases: ["moving", "relocation", "packing", "truck"] },
  // Fashion
  { name: "Tailor", category: "fashion", aliases: ["sewing", "aso-ebi", "aso ebi", "native", "agbada", "alterations"] },
  { name: "Fashion designer", category: "fashion", aliases: ["fashion", "dress", "bridal"] },
  { name: "Shoemaker", category: "fashion", aliases: ["cobbler", "shoes", "sandals"] },
  // Events & beauty
  { name: "Makeup artist", category: "events", aliases: ["makeup", "mua", "bridal makeup"] },
  { name: "Hairstylist", category: "events", aliases: ["hair", "braids", "wig", "salon"] },
  { name: "Barber", category: "events", aliases: ["haircut", "barbing"] },
  { name: "Nail technician", category: "events", aliases: ["nails", "manicure", "pedicure"] },
  { name: "Event planner", category: "events", aliases: ["wedding planner", "party", "event"] },
  { name: "Decorator", category: "events", aliases: ["event decor", "balloon", "decoration"] },
  { name: "MC", category: "events", aliases: ["master of ceremony", "compere", "hype man"] },
  { name: "Gele tier", category: "events", aliases: ["gele", "headtie"] },
  // Photo & video, music
  { name: "Photographer", category: "photo", aliases: ["photography", "photoshoot", "pictures"] },
  { name: "Videographer", category: "photo", aliases: ["video", "cinematographer", "drone"] },
  { name: "Video editor", category: "photo", aliases: ["editing", "reels"] },
  { name: "DJ", category: "music", aliases: ["disc jockey", "sound"] },
  { name: "Music teacher", category: "music", aliases: ["piano", "guitar", "keyboard", "drums", "saxophone"] },
  { name: "Music producer", category: "music", aliases: ["beat", "recording", "mixing", "studio"] },
  // Design, development, writing, marketing
  { name: "Graphic designer", category: "design", aliases: ["graphics", "flyer", "poster", "branding"] },
  { name: "Logo designer", category: "design", aliases: ["logo"] },
  { name: "UI/UX designer", category: "design", aliases: ["ui", "ux", "figma", "product designer"] },
  { name: "Web developer", category: "development", aliases: ["website", "web design", "wordpress", "frontend", "backend"] },
  { name: "App developer", category: "development", aliases: ["mobile app", "android app", "ios app", "flutter"] },
  { name: "Software developer", category: "development", aliases: ["programmer", "coder", "software engineer"] },
  { name: "Data analyst", category: "development", aliases: ["data", "excel", "power bi", "analytics"] },
  { name: "Content writer", category: "writing", aliases: ["writer", "blog", "articles", "ghostwriter"] },
  { name: "Copywriter", category: "writing", aliases: ["copy", "ad copy"] },
  { name: "Translator", category: "writing", aliases: ["translation", "yoruba", "igbo", "hausa", "french"] },
  { name: "CV writer", category: "writing", aliases: ["cv", "resume", "cover letter"] },
  { name: "Social media manager", category: "marketing", aliases: ["social media", "instagram", "tiktok", "content creator"] },
  { name: "Digital marketer", category: "marketing", aliases: ["marketing", "ads", "seo", "facebook ads"] },
  { name: "Sales agent", category: "marketing", aliases: ["sales", "marketer"] },
  // Tutoring, business, wellness
  { name: "Home tutor", category: "tutoring", aliases: ["lesson teacher", "tutor", "teacher", "lessons"] },
  { name: "JAMB tutor", category: "tutoring", aliases: ["jamb", "waec", "neco", "utme", "exam prep"] },
  { name: "Maths tutor", category: "tutoring", aliases: ["math", "mathematics", "further maths"] },
  { name: "English tutor", category: "tutoring", aliases: ["english", "ielts", "toefl"] },
  { name: "Accountant", category: "business", aliases: ["accounting", "bookkeeping", "bookkeeper", "audit"] },
  { name: "Tax consultant", category: "business", aliases: ["tax", "firs", "tin"] },
  { name: "Business registration agent", category: "business", aliases: ["cac", "business name", "registration"] },
  { name: "Fitness trainer", category: "wellness", aliases: ["gym", "personal trainer", "workout", "fitness"] },
  { name: "Massage therapist", category: "wellness", aliases: ["massage", "spa"] },
  { name: "Caregiver", category: "wellness", aliases: ["nurse", "elderly care", "home care"] },
  { name: "Nutritionist", category: "wellness", aliases: ["diet", "dietitian", "meal plan"] },
  // Food, cleaning, hospitality, rentals
  { name: "Caterer", category: "food", aliases: ["catering", "jollof", "party food"] },
  { name: "Chef", category: "food", aliases: ["private chef", "cook", "cooking"] },
  { name: "Baker", category: "food", aliases: ["cake", "cakes", "pastry", "bread"] },
  { name: "Small chops", category: "food", aliases: ["puff puff", "samosa", "finger food"] },
  { name: "Cleaner", category: "cleaning", aliases: ["cleaning", "house cleaning", "deep cleaning", "post construction"] },
  { name: "Laundry", category: "cleaning", aliases: ["dry cleaning", "washing", "ironing"] },
  { name: "Fumigator", category: "cleaning", aliases: ["pest control", "fumigation", "termite", "cockroach"] },
  { name: "Short-let host", category: "hospitality", aliases: ["shortlet", "apartment", "airbnb", "lodge"] },
  { name: "Hotel", category: "hospitality", aliases: ["hotel room", "guest house"] },
  { name: "Car rental", category: "rentals", aliases: ["car hire", "rent a car", "bus hire"] },
  { name: "Canopy & chairs rental", category: "rentals", aliases: ["canopy", "chairs", "tables", "tent"] },
  { name: "Equipment rental", category: "rentals", aliases: ["generator rental", "sound system rental", "projector"] },
];

export type Suggestion = { label: string; kind: "profession" | "category" | "skill"; category?: string; href: string };

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();

/** Edit distance (with swaps), capped: enough to forgive "plumer", "electrition", "mechanik". */
function distance(a: string, b: string, max = 2): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}

/** How well a typed query matches a name: 0 = not at all, 100 = exactly. Typos still score. */
export function matchScore(query: string, name: string): number {
  const q = norm(query);
  const n = norm(name);
  if (!q || !n) return 0;
  if (q === n) return 100;
  if (n.startsWith(q)) return 85 - Math.min(10, n.length - q.length);
  const words = n.split(" ");
  if (words.some((w) => w.startsWith(q))) return 72;
  if (q.length >= 3 && n.includes(q)) return 60;
  // The query contains the name ("need a plumber in lekki" → plumber).
  if (n.length >= 3 && ` ${q} `.includes(` ${n} `)) return 78;
  // Typos: compare each word of the query with each word of the name.
  let best = 0;
  for (const qw of q.split(" ").filter((w) => w.length >= 4)) {
    for (const nw of words.filter((w) => w.length >= 4)) {
      const allowed = Math.max(qw.length, nw.length) >= 8 ? 2 : 1;
      const d = distance(qw, nw, allowed);
      if (d <= allowed) best = Math.max(best, 55 - d * 10);
      // Typo in what they've typed so far: "electri" vs "electrician".
      else if (qw.length >= 5 && nw.length > qw.length && distance(qw, nw.slice(0, qw.length), 1) <= 1) best = Math.max(best, 45);
    }
  }
  return best;
}

/** Professions, categories and pros' own skills closest to what's been typed, best first. */
export function suggest(query: string, skills: string[] = [], limit = 7): Suggestion[] {
  if (norm(query).length < 2) return [];
  const out: (Suggestion & { score: number })[] = [];
  for (const p of PROFESSIONS) {
    const score = Math.max(matchScore(query, p.name), ...(p.aliases ?? []).map((a) => matchScore(query, a) - 6));
    if (score > 0) out.push({ label: p.name, kind: "profession", category: p.category, href: `/search?q=${encodeURIComponent(p.name)}`, score: score + 2 });
  }
  for (const c of CATEGORIES) {
    const score = Math.max(matchScore(query, c.name), ...c.name.split(" & ").map((part) => matchScore(query, part)));
    if (score > 0) out.push({ label: c.name, kind: "category", href: `/search?category=${c.slug}`, score });
  }
  const seen = new Set(out.map((o) => norm(o.label)));
  for (const s of skills) {
    if (seen.has(norm(s))) continue;
    const score = matchScore(query, s);
    if (score > 0) {
      seen.add(norm(s));
      out.push({ label: s, kind: "skill", href: `/search?q=${encodeURIComponent(s)}`, score: score - 4 });
    }
  }
  return out.sort((a, b) => b.score - a.score || a.label.length - b.label.length).slice(0, limit).map(({ label, kind, category, href }) => ({ label, kind, category, href }));
}

/** The profession (or category) nearest to a search, for "closest field" results. Null if nothing is close. */
export function closestField(query: string): { label: string; category: CategorySlug; profession: string | null } | null {
  let best: { label: string; category: CategorySlug; profession: string | null; score: number } | null = null;
  for (const p of PROFESSIONS) {
    const score = Math.max(matchScore(query, p.name), ...(p.aliases ?? []).map((a) => matchScore(query, a) - 4));
    if (score >= 40 && (!best || score > best.score)) best = { label: p.name, category: p.category, profession: p.name, score };
  }
  for (const c of CATEGORIES) {
    const score = Math.max(matchScore(query, c.name), ...c.name.split(" & ").map((part) => matchScore(query, part)));
    if (score >= 40 && (!best || score > best.score)) best = { label: c.name, category: c.slug, profession: null, score };
  }
  return best && { label: best.label, category: best.category, profession: best.profession };
}
