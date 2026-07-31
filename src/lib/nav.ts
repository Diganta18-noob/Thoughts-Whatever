/**
 * Navigation. The interface is in English; the content is in Bengali.
 * Each item carries its Bengali equivalent too, used in the mobile menu and
 * on section landing pages so the section still announces itself in Bangla.
 */

export type NavItem = {
  href: string;
  labelEn: string;
  labelBn: string;
  descEn?: string;
};

export const PRIMARY_NAV: NavItem[] = [
  {
    href: "/writing",
    labelEn: "Writing",
    labelBn: "রচনা",
    descEn: "The full text behind each reel",
  },
  {
    href: "/blog",
    labelEn: "Blog",
    labelBn: "ব্লগ",
    descEn: "Longform written for the page, not the feed",
  },
  {
    href: "/documentary",
    labelEn: "Documentary",
    labelBn: "ডকুমেন্টারি",
    descEn: "Video, research notes, and sources",
  },
  {
    href: "/archive",
    labelEn: "Archive",
    labelBn: "সংগ্রহ",
    descEn: "Everything, by author, era, form, and theme",
  },
];

export const SECONDARY_NAV: NavItem[] = [
  { href: "/series", labelEn: "Series", labelBn: "ধারাবাহিক" },
  { href: "/letter", labelEn: "Letter", labelBn: "চিঠি" },
  { href: "/about", labelEn: "About", labelBn: "পরিচয়" },
];

export const KIND_META = {
  RACHANA: { path: "/writing", labelBn: "রচনা", labelEn: "Writing" },
  BLOG: { path: "/blog", labelBn: "ব্লগ", labelEn: "Blog" },
  DOCUMENTARY: { path: "/documentary", labelBn: "ডকুমেন্টারি", labelEn: "Documentary" },
} as const;

export type PieceKindKey = keyof typeof KIND_META;

export function piecePath(kind: PieceKindKey, slug: string) {
  return `${KIND_META[kind].path}/${slug}`;
}
