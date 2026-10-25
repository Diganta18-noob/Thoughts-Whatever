export interface DashboardWidgetConfig {
  id: string;
  type: string;
  title: string;
  enabled: boolean;
  order: number;
}

export const DEFAULT_ADMIN_WIDGETS: DashboardWidgetConfig[] = [
  { id: "recent_pieces", type: "pieces", title: "Recently Edited", enabled: true, order: 0 },
  { id: "content_health", type: "health", title: "Content Health Summary", enabled: true, order: 1 },
  { id: "seo_summary", type: "seo", title: "SEO Status", enabled: true, order: 2 },
  { id: "overview_metrics", type: "metrics", title: "Analytics Overview", enabled: true, order: 3 },
  { id: "reference_activity", type: "reference", title: "Reference Activity", enabled: true, order: 4 },
];
