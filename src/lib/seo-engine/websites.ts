import { prisma } from "@/lib/prisma";

export interface WebsiteSummary {
  id: string;
  name: string;
  domain: string;
  homepageUrl: string;
  niche: string;
  targetCountry: string;
  targetLanguage: string;
  gscConnected: boolean;
  gaConnected: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    pages: number;
    keywords: number;
    backlinkOpportunities: number;
    competitors: number;
    campaigns: number;
    monitoredBacklinks: number;
    seoIssues: number;
    tasks: number;
  };
}

export async function getOrCreateDefaultWebsite(): Promise<WebsiteSummary> {
  const existing = await prisma.website.findFirst({
    where: { isDefault: true },
    include: {
      _count: {
        select: {
          pages: true,
          keywords: true,
          backlinkOpportunities: true,
          competitors: true,
          campaigns: true,
          monitoredBacklinks: true,
          seoIssues: true,
          tasks: true,
        },
      },
    },
  });

  if (existing) {
    return existing as WebsiteSummary;
  }

  // Create default Thoughts Whatever website record
  const created = await prisma.website.create({
    data: {
      name: "Thoughts Whatever",
      domain: "thoughtswhatever.in",
      homepageUrl: "https://www.thoughtswhatever.in",
      niche: "Literature, Culture, AI, Tech, Essays",
      targetCountry: "IN",
      targetLanguage: "en",
      isDefault: true,
      gscConnected: false,
      gaConnected: false,
    },
    include: {
      _count: {
        select: {
          pages: true,
          keywords: true,
          backlinkOpportunities: true,
          competitors: true,
          campaigns: true,
          monitoredBacklinks: true,
          seoIssues: true,
          tasks: true,
        },
      },
    },
  });

  return created as WebsiteSummary;
}

export async function getWebsites(): Promise<WebsiteSummary[]> {
  // Ensure default exists
  await getOrCreateDefaultWebsite();

  const websites = await prisma.website.findMany({
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    include: {
      _count: {
        select: {
          pages: true,
          keywords: true,
          backlinkOpportunities: true,
          competitors: true,
          campaigns: true,
          monitoredBacklinks: true,
          seoIssues: true,
          tasks: true,
        },
      },
    },
  });

  return websites as WebsiteSummary[];
}

export async function getWebsiteById(id: string) {
  return prisma.website.findUnique({
    where: { id },
    include: {
      integrations: true,
      _count: {
        select: {
          pages: true,
          keywords: true,
          backlinkOpportunities: true,
          competitors: true,
          campaigns: true,
          monitoredBacklinks: true,
          seoIssues: true,
          tasks: true,
        },
      },
    },
  });
}

export async function createWebsite(data: {
  name: string;
  domain: string;
  homepageUrl: string;
  niche: string;
  targetCountry?: string;
  targetLanguage?: string;
  isDefault?: boolean;
}) {
  const cleanDomain = data.domain
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "")
    .toLowerCase();

  const website = await prisma.website.create({
    data: {
      name: data.name.trim(),
      domain: cleanDomain,
      homepageUrl: data.homepageUrl.trim(),
      niche: data.niche.trim(),
      targetCountry: data.targetCountry || "US",
      targetLanguage: data.targetLanguage || "en",
      isDefault: data.isDefault || false,
    },
  });

  return website;
}

export async function updateWebsite(
  id: string,
  data: {
    name?: string;
    domain?: string;
    homepageUrl?: string;
    niche?: string;
    targetCountry?: string;
    targetLanguage?: string;
    isDefault?: boolean;
    gscConnected?: boolean;
    gaConnected?: boolean;
  }
) {
  if (data.isDefault) {
    // Unset other defaults if setting this as default
    await prisma.website.updateMany({
      where: { isDefault: true, id: { not: id } },
      data: { isDefault: false },
    });
  }

  const cleanDomain = data.domain
    ? data.domain
        .replace(/^https?:\/\//, "")
        .replace(/\/+$/, "")
        .toLowerCase()
    : undefined;

  return prisma.website.update({
    where: { id },
    data: {
      ...data,
      ...(cleanDomain ? { domain: cleanDomain } : {}),
    },
  });
}

export async function deleteWebsite(id: string) {
  const website = await prisma.website.findUnique({ where: { id } });
  if (website?.isDefault) {
    throw new Error("Cannot delete the default website.");
  }
  return prisma.website.delete({ where: { id } });
}

export async function getWebsiteDashboardMetrics(websiteId: string) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Parallel database queries for fast aggregated response
  const [
    website,
    allBacklinks,
    newBacklinks30d,
    lostBacklinks30d,
    keywords,
    activeCampaigns,
    opportunities,
    recentBacklinks,
    lostBacklinksList,
    recentIssues,
    tasks,
  ] = await Promise.all([
    prisma.website.findUnique({ where: { id: websiteId } }),
    prisma.monitoredBacklink.findMany({
      where: { websiteId, status: "ACTIVE" },
      select: { referringDomain: true, domainAuthority: true },
    }),
    prisma.monitoredBacklink.count({
      where: {
        websiteId,
        status: "ACTIVE",
        firstDetectedAt: { gte: thirtyDaysAgo },
      },
    }),
    prisma.monitoredBacklink.count({
      where: {
        websiteId,
        status: "LOST",
      },
    }),
    prisma.keyword.findMany({
      where: { websiteId },
      select: { currentPosition: true, searchVolume: true },
    }),
    prisma.outreachCampaign.findMany({
      where: { websiteId, status: "ACTIVE" },
      include: {
        _count: { select: { prospects: true } },
      },
    }),
    prisma.backlinkOpportunity.findMany({
      where: { websiteId },
      select: { status: true, overallScore: true, aiRecommendation: true },
    }),
    prisma.monitoredBacklink.findMany({
      where: { websiteId },
      orderBy: { firstDetectedAt: "desc" },
      take: 5,
    }),
    prisma.monitoredBacklink.findMany({
      where: { websiteId, status: "LOST" },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.technicalSEOIssue.findMany({
      where: { websiteId, status: "OPEN" },
      orderBy: { severity: "asc" },
      take: 5,
    }),
    prisma.sEOTask.findMany({
      where: { websiteId, status: { not: "COMPLETED" } },
      orderBy: { priority: "desc" },
      take: 5,
    }),
  ]);

  if (!website) {
    throw new Error("Website not found");
  }

  // Calculate distinct referring domains
  const referringDomainsSet = new Set(allBacklinks.map((b: { referringDomain: string }) => b.referringDomain));
  const totalReferringDomains = referringDomainsSet.size;
  const totalActiveBacklinks = allBacklinks.length;

  // Calculate average keyword position
  const validPositions = keywords
    .map((k: { currentPosition: number | null }) => k.currentPosition)
    .filter((p: number | null): p is number => typeof p === "number" && p > 0);
  const avgKeywordPosition =
    validPositions.length > 0
      ? Number((validPositions.reduce((a: number, b: number) => a + b, 0) / validPositions.length).toFixed(1))
      : 0;

  // Estimated organic traffic
  const estimatedTraffic = keywords.reduce((sum: number, k: { currentPosition: number | null; searchVolume: number }) => {
    if (!k.currentPosition) return sum;
    if (k.currentPosition <= 3) return sum + Math.round(k.searchVolume * 0.32);
    if (k.currentPosition <= 10) return sum + Math.round(k.searchVolume * 0.08);
    return sum + Math.round(k.searchVolume * 0.01);
  }, 0);

  // Time-series mock / calculated trend points for the past 6 months
  const months = ["Mar", "Apr", "May", "Jun", "Jul", "Aug"];
  const trafficGrowth = months.map((month, i) => ({
    month,
    traffic: Math.max(100, Math.round((estimatedTraffic || 1250) * (0.65 + i * 0.07))),
  }));

  const backlinkGrowth = months.map((month, i) => ({
    month,
    backlinks: Math.max(10, Math.round((totalActiveBacklinks || 48) * (0.55 + i * 0.09))),
    referringDomains: Math.max(5, Math.round((totalReferringDomains || 22) * (0.5 + i * 0.1))),
  }));

  return {
    website,
    stats: {
      totalActiveBacklinks,
      totalReferringDomains,
      newBacklinks30d,
      lostBacklinks30d,
      totalKeywords: keywords.length,
      avgKeywordPosition,
      estimatedTraffic,
      activeCampaignsCount: activeCampaigns.length,
      qualifiedOpportunitiesCount: opportunities.filter(
        (o: { status: string; aiRecommendation: string }) => o.status === "QUALIFIED" || o.aiRecommendation === "PURSUE"
      ).length,
      openIssuesCount: recentIssues.length,
    },
    charts: {
      trafficGrowth,
      backlinkGrowth,
    },
    tables: {
      recentBacklinks,
      lostBacklinksList,
      activeCampaigns,
      recentIssues,
      pendingTasks: tasks,
    },
  };
}
