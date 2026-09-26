"use client";

import {
  Activity,
  AlertTriangle,
  BarChart2,
  Bell,
  BookOpen,
  BookOpenCheck,
  ClipboardList,
  Clock,
  Code,
  Compass,
  Cpu,
  Database,
  Download,
  FileText,
  FolderTree,
  Globe,
  HeartPulse,
  Image as ImageIcon,
  Languages,
  LayoutDashboard,
  Lightbulb,
  ListChecks,
  Mail,
  Network,
  PlusCircle,
  SearchCheck,
  Settings,
  Share2,
  ShieldCheck,
  Sparkles,
  Tags,
  Target,
  Unlink,
  UploadCloud,
  Users,
} from "lucide-react";
import type { AdminNavIconName } from "@/lib/admin-nav";

/**
 * Icon names from `lib/admin-nav` resolved to elements.
 *
 * Lives here rather than in the sidebar because the ⌘K palette renders the same
 * routes and needs the same glyphs; a second copy of this map is exactly the
 * kind of drift `lib/admin-nav` was created to end.
 *
 * Typed as a total `Record` on purpose: adding a route with a new icon name
 * fails typecheck here instead of rendering a hole in the rail.
 */
const ICONS: Record<AdminNavIconName, React.ComponentType<{ className?: string }>> = {
  activity: Activity,
  "alert-triangle": AlertTriangle,
  "bar-chart-2": BarChart2,
  bell: Bell,
  "book-open": BookOpen,
  "book-open-check": BookOpenCheck,
  "clipboard-list": ClipboardList,
  clock: Clock,
  code: Code,
  compass: Compass,
  cpu: Cpu,
  database: Database,
  download: Download,
  "file-text": FileText,
  "folder-tree": FolderTree,
  globe: Globe,
  "heart-pulse": HeartPulse,
  image: ImageIcon,
  languages: Languages,
  "layout-dashboard": LayoutDashboard,
  lightbulb: Lightbulb,
  "list-checks": ListChecks,
  mail: Mail,
  network: Network,
  "plus-circle": PlusCircle,
  "search-check": SearchCheck,
  settings: Settings,
  "share-2": Share2,
  "shield-check": ShieldCheck,
  sparkles: Sparkles,
  tags: Tags,
  target: Target,
  unlink: Unlink,
  "upload-cloud": UploadCloud,
  users: Users,
};

export function NavIcon({
  name,
  className,
}: {
  name: AdminNavIconName;
  className?: string;
}) {
  const Icon = ICONS[name];
  return <Icon className={className} />;
}
