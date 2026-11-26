import {
  Briefcase, Camera, Car, ChefHat, Code2, GraduationCap, HeartPulse, Home, Megaphone, Music, Palette, PartyPopper, PenLine,
  Scissors, SprayCan, Truck, Wrench, Zap, BedDouble, KeyRound, type LucideProps,
} from "lucide-react";
import { CATEGORIES } from "@/lib/categories";

const ICONS = {
  Briefcase, Camera, Car, ChefHat, Code2, GraduationCap, HeartPulse, Home, Megaphone, Music, Palette, PartyPopper, PenLine,
  Scissors, SprayCan, Truck, Wrench, Zap, BedDouble, KeyRound,
};

export function CategoryIcon({ slug, ...props }: { slug: string } & LucideProps) {
  const cat = CATEGORIES.find((c) => c.slug === slug);
  const Icon = cat ? ICONS[cat.icon] : Briefcase;
  return <Icon {...props} />;
}
