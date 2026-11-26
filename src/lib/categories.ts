export const CATEGORIES = [
  { slug: "design", name: "Design & Creative", icon: "Palette", hue: "from-fuchsia-500 to-pink-500" },
  { slug: "development", name: "Development & IT", icon: "Code2", hue: "from-violet-500 to-indigo-500" },
  { slug: "writing", name: "Writing & Translation", icon: "PenLine", hue: "from-amber-500 to-orange-500" },
  { slug: "marketing", name: "Marketing & Sales", icon: "Megaphone", hue: "from-rose-500 to-red-500" },
  { slug: "home", name: "Home Services", icon: "Home", hue: "from-emerald-500 to-teal-500" },
  { slug: "repairs", name: "Repairs & Tech Support", icon: "Wrench", hue: "from-slate-500 to-zinc-600" },
  { slug: "tutoring", name: "Tutoring & Education", icon: "GraduationCap", hue: "from-sky-500 to-blue-500" },
  { slug: "photo", name: "Photo & Video", icon: "Camera", hue: "from-purple-500 to-fuchsia-500" },
  { slug: "music", name: "Music & Audio", icon: "Music", hue: "from-cyan-500 to-sky-500" },
  { slug: "business", name: "Business & Finance", icon: "Briefcase", hue: "from-lime-500 to-green-600" },
  { slug: "wellness", name: "Health & Wellness", icon: "HeartPulse", hue: "from-pink-500 to-rose-500" },
  { slug: "events", name: "Events & Beauty", icon: "PartyPopper", hue: "from-orange-500 to-amber-500" },
  { slug: "fashion", name: "Fashion & Tailoring", icon: "Scissors", hue: "from-fuchsia-600 to-purple-600" },
  { slug: "auto", name: "Auto & Mechanics", icon: "Car", hue: "from-blue-600 to-cyan-500" },
  { slug: "power", name: "Solar & Generators", icon: "Zap", hue: "from-yellow-500 to-amber-600" },
  { slug: "logistics", name: "Delivery & Logistics", icon: "Truck", hue: "from-teal-500 to-emerald-600" },
  { slug: "food", name: "Food & Catering", icon: "ChefHat", hue: "from-red-500 to-orange-500" },
  { slug: "cleaning", name: "Cleaning & Laundry", icon: "SprayCan", hue: "from-sky-400 to-cyan-500" },
  { slug: "hospitality", name: "Hospitality & Accommodation", icon: "BedDouble", hue: "from-indigo-500 to-violet-600" },
  { slug: "rentals", name: "Rental Services", icon: "KeyRound", hue: "from-amber-600 to-yellow-500" },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

export const categoryName = (slug: string) =>
  CATEGORIES.find((c) => c.slug === slug)?.name ?? slug;

export const isCategory = (slug: string): slug is CategorySlug =>
  CATEGORIES.some((c) => c.slug === slug);

export const SKILL_LEVELS = ["Beginner", "Intermediate", "Expert"] as const;

export const REQUEST_STATUSES = ["pending", "accepted", "declined", "completed", "cancelled"] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];
