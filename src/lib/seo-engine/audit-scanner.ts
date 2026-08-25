import { prisma } from "@/lib/prisma";
import { IssueSeverity } from "@prisma/client";

export interface AuditIssue {
  id?: string;
  issueType: string;
  title: string;
  description: string;
  affectedUrl: string;
  whyItMatters: string;
  recommendedFix: string;
  severity: IssueSeverity;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "IGNORED";
  priorityScore: number;
  priorityLabel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  seoImpact: number; // 0-100
  trafficPotential: number; // 0-100
  implementationEase: number; // 0-100
  urgency: number; // 0-100
  confidence: number; // 0-100
  lastDetectedAt: Date;
}

export interface SiteAuditSummary {
  websiteId: string;
  websiteName: string;
  domain: string;
  healthScore: number;
  totalIssuesCount: number;
  criticalIssuesCount: number;
  highIssuesCount: number;
  mediumIssuesCount: number;
  lowIssuesCount: number;
  resolvedIssuesCount: number;
  categoryScores: {
    metaTags: number;
    contentStructure: number;
    linkHealth: number;
    imageOptimization: number;
    crawlability: number;
  };
  issues: AuditIssue[];
  lastAuditAt: Date;
}

export function calculatePriorityScore(params: {
  seoImpact: number;
  trafficPotential: number;
  implementationEase: number;
  urgency: number;
  confidence: number;
}): { score: number; label: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" } {
  // Formula: (SEO Impact × 0.35) + (Traffic Potential × 0.20) + (Implementation Ease × 0.15) + (Urgency × 0.15) + (Confidence × 0.15)
  const rawScore =
    params.seoImpact * 0.35 +
    params.trafficPotential * 0.2 +
    params.implementationEase * 0.15 +
    params.urgency * 0.15 +
    params.confidence * 0.15;

  const score = Math.round(Math.max(0, Math.min(100, rawScore)));

  let label: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" = "LOW";
  if (score >= 85) label = "CRITICAL";
  else if (score >= 70) label = "HIGH";
  else if (score >= 50) label = "MEDIUM";

  return { score, label };
}

const MD_LINK_REGEX = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
const MD_IMAGE_REGEX = /!\[([^\]]*)\]\(([^)]+)\)/g;

export async function runTechnicalSiteAudit(websiteId: string): Promise<SiteAuditSummary> {
  const website = await prisma.website.findUnique({
    where: { id: websiteId },
  });

  if (!website) {
    throw new Error(`Website with ID ${websiteId} not found`);
  }

  // Fetch website's literary pieces and pages
  const pieces = await prisma.piece.findMany({
    where: { status: { in: ["PUBLISHED", "DRAFT"] } },
    select: {
      id: true,
      slug: true,
      titleBn: true,
      titleEn: true,
      bodyBn: true,
      coverImage: true,
      seoDescription: true,
      ogImage: true,
      status: true,
    },
  });

  const discoveredIssues: Array<Omit<AuditIssue, "id">> = [];

  const titlesMap = new Map<string, string>();
  const metaDescMap = new Map<string, string>();

  let metaScoreAcc = 100;
  let structureScoreAcc = 100;
  let linkScoreAcc = 100;
  let imageScoreAcc = 100;
  let crawlabilityScoreAcc = 100;

  for (const piece of pieces) {
    const pageUrl = `${website.homepageUrl}/writing/${piece.slug}`;

    // 1. Meta Description Checks
    if (!piece.seoDescription || piece.seoDescription.trim().length === 0) {
      metaScoreAcc -= 5;
      const { score, label } = calculatePriorityScore({
        seoImpact: 85,
        trafficPotential: 75,
        implementationEase: 95,
        urgency: 80,
        confidence: 95,
      });

      discoveredIssues.push({
        issueType: "MISSING_META_DESCRIPTION",
        title: `Missing SEO Meta Description on /${piece.slug}`,
        description: `The page "${piece.titleBn}" has no custom SEO description, causing search engines to auto-extract arbitrary snippet text.`,
        affectedUrl: pageUrl,
        whyItMatters: "Search engine click-through rates (CTR) depend heavily on compelling meta descriptions.",
        recommendedFix: "Write a concise 120–155 character description summarizing the core thesis of this piece.",
        severity: "HIGH",
        status: "OPEN",
        priorityScore: score,
        priorityLabel: label,
        seoImpact: 85,
        trafficPotential: 75,
        implementationEase: 95,
        urgency: 80,
        confidence: 95,
        lastDetectedAt: new Date(),
      });
    } else {
      const len = piece.seoDescription.length;
      if (len < 50 || len > 160) {
        metaScoreAcc -= 2;
        const { score, label } = calculatePriorityScore({
          seoImpact: 50,
          trafficPotential: 40,
          implementationEase: 90,
          urgency: 45,
          confidence: 90,
        });

        discoveredIssues.push({
          issueType: "SUBOPTIMAL_META_LENGTH",
          title: `Meta description length (${len} chars) outside optimal range`,
          description: `The description for "${piece.titleBn}" is ${len < 50 ? "too short (< 50 chars)" : "too long (> 160 chars and will be truncated)"}.`,
          affectedUrl: pageUrl,
          whyItMatters: "Truncated or sparse meta descriptions look unpolished in SERP results and decrease organic CTR.",
          recommendedFix: "Adjust character count to fall within 120 to 155 characters.",
          severity: "LOW",
          status: "OPEN",
          priorityScore: score,
          priorityLabel: label,
          seoImpact: 50,
          trafficPotential: 40,
          implementationEase: 90,
          urgency: 45,
          confidence: 90,
          lastDetectedAt: new Date(),
        });
      }

      // Duplicate meta description check
      const normalizedDesc = piece.seoDescription.trim().toLowerCase();
      if (metaDescMap.has(normalizedDesc)) {
        metaScoreAcc -= 4;
        const { score, label } = calculatePriorityScore({
          seoImpact: 65,
          trafficPotential: 50,
          implementationEase: 85,
          urgency: 60,
          confidence: 90,
        });

        discoveredIssues.push({
          issueType: "DUPLICATE_META_DESCRIPTION",
          title: `Duplicate Meta Description with "${metaDescMap.get(normalizedDesc)}"`,
          description: "Multiple articles share the exact same meta description.",
          affectedUrl: pageUrl,
          whyItMatters: "Duplicate metadata dilutes topical specificity and harms indexing uniqueness.",
          recommendedFix: "Craft unique meta descriptions tailored specifically to each article.",
          severity: "MEDIUM",
          status: "OPEN",
          priorityScore: score,
          priorityLabel: label,
          seoImpact: 65,
          trafficPotential: 50,
          implementationEase: 85,
          urgency: 60,
          confidence: 90,
          lastDetectedAt: new Date(),
        });
      } else {
        metaDescMap.set(normalizedDesc, piece.titleBn);
      }
    }

    // 2. Title Structure & Duplicate Title Checks
    const normalizedTitle = piece.titleBn.trim().toLowerCase();
    if (titlesMap.has(normalizedTitle)) {
      structureScoreAcc -= 8;
      const { score, label } = calculatePriorityScore({
        seoImpact: 90,
        trafficPotential: 80,
        implementationEase: 85,
        urgency: 90,
        confidence: 95,
      });

      discoveredIssues.push({
        issueType: "DUPLICATE_TITLE",
        title: `Duplicate Page Title: "${piece.titleBn}"`,
        description: `This article shares an identical Bengali title with another page: "${titlesMap.get(normalizedTitle)}".`,
        affectedUrl: pageUrl,
        whyItMatters: "Duplicate titles cause keyword cannibalization and severe index confusion on search engines.",
        recommendedFix: "Differentiate the title by adding contextual subtitle or series volume marker.",
        severity: "CRITICAL",
        status: "OPEN",
        priorityScore: score,
        priorityLabel: label,
        seoImpact: 90,
        trafficPotential: 80,
        implementationEase: 85,
        urgency: 90,
        confidence: 95,
        lastDetectedAt: new Date(),
      });
    } else {
      titlesMap.set(normalizedTitle, piece.titleBn);
    }

    // 3. Image Alt Text & Optimization
    const bodyImages = [...(piece.bodyBn || "").matchAll(MD_IMAGE_REGEX)];
    for (const match of bodyImages) {
      const alt = match[1];
      if (!alt || alt.trim().length === 0) {
        imageScoreAcc -= 3;
        const { score, label } = calculatePriorityScore({
          seoImpact: 60,
          trafficPotential: 50,
          implementationEase: 95,
          urgency: 50,
          confidence: 90,
        });

        discoveredIssues.push({
          issueType: "MISSING_IMAGE_ALT",
          title: `Image Missing Descriptive Alt Text in "${piece.titleBn}"`,
          description: `Embedded image (${match[2].substring(0, 45)}...) has empty alt text attribute.`,
          affectedUrl: pageUrl,
          whyItMatters: "Alt text provides context for image search indexing and screen reader accessibility.",
          recommendedFix: "Add descriptive bilingual alt text explaining what the visual asset depicts.",
          severity: "MEDIUM",
          status: "OPEN",
          priorityScore: score,
          priorityLabel: label,
          seoImpact: 60,
          trafficPotential: 50,
          implementationEase: 95,
          urgency: 50,
          confidence: 90,
          lastDetectedAt: new Date(),
        });
        break; // Alert once per article for body images
      }
    }

    // 4. Broken / Malformed Link Checks
    const bodyLinks = [...(piece.bodyBn || "").matchAll(MD_LINK_REGEX)];
    for (const match of bodyLinks) {
      const linkUrl = match[2];
      try {
        const parsed = new URL(linkUrl);
        if (!["http:", "https:"].includes(parsed.protocol)) {
          linkScoreAcc -= 5;
          const { score, label } = calculatePriorityScore({
            seoImpact: 85,
            trafficPotential: 60,
            implementationEase: 95,
            urgency: 85,
            confidence: 95,
          });

          discoveredIssues.push({
            issueType: "MALFORMED_LINK",
            title: `Invalid Protocol Link in "${piece.titleBn}"`,
            description: `Link URL "${linkUrl}" does not use standard http/https protocol.`,
            affectedUrl: pageUrl,
            whyItMatters: "Broken link protocols cause navigation failures and crawl traps.",
            recommendedFix: "Correct the URL syntax to use secure https protocol.",
            severity: "CRITICAL",
            status: "OPEN",
            priorityScore: score,
            priorityLabel: label,
            seoImpact: 85,
            trafficPotential: 60,
            implementationEase: 95,
            urgency: 85,
            confidence: 95,
            lastDetectedAt: new Date(),
          });
        }
      } catch {
        linkScoreAcc -= 5;
        const { score, label } = calculatePriorityScore({
          seoImpact: 85,
          trafficPotential: 60,
          implementationEase: 95,
          urgency: 85,
          confidence: 95,
        });

        discoveredIssues.push({
          issueType: "BROKEN_LINK_SYNTAX",
          title: `Malformed URL Syntax in "${piece.titleBn}"`,
          description: `The markdown link "${linkUrl}" cannot be parsed as a valid URL.`,
          affectedUrl: pageUrl,
          whyItMatters: "Search engine bots penalize sites with unresolvable outbound links.",
          recommendedFix: "Fix typo or update to valid destination URL.",
          severity: "CRITICAL",
          status: "OPEN",
          priorityScore: score,
          priorityLabel: label,
          seoImpact: 85,
          trafficPotential: 60,
          implementationEase: 95,
          urgency: 85,
          confidence: 95,
          lastDetectedAt: new Date(),
        });
      }
    }

    // 5. OpenGraph Social Card Verification
    if (!piece.ogImage && !piece.coverImage) {
      metaScoreAcc -= 2;
      const { score, label } = calculatePriorityScore({
        seoImpact: 45,
        trafficPotential: 65,
        implementationEase: 90,
        urgency: 40,
        confidence: 85,
      });

      discoveredIssues.push({
        issueType: "MISSING_OG_IMAGE",
        title: `No Dedicated OpenGraph Image for "${piece.titleBn}"`,
        description: "Page lacks a high-resolution social preview image for Facebook, LinkedIn, and Twitter shares.",
        affectedUrl: pageUrl,
        whyItMatters: "Social links shared without rich preview images receive significantly fewer clicks.",
        recommendedFix: "Assign a 1200x630px cover image or let Satori dynamic quote card generate one.",
        severity: "LOW",
        status: "OPEN",
        priorityScore: score,
        priorityLabel: label,
        seoImpact: 45,
        trafficPotential: 65,
        implementationEase: 90,
        urgency: 40,
        confidence: 85,
        lastDetectedAt: new Date(),
      });
    }
  }

  // 6. Global Site Health Signals
  if (!website.gscConnected) {
    crawlabilityScoreAcc -= 10;
    const { score, label } = calculatePriorityScore({
      seoImpact: 75,
      trafficPotential: 80,
      implementationEase: 70,
      urgency: 65,
      confidence: 95,
    });

    discoveredIssues.push({
      issueType: "GSC_NOT_CONNECTED",
      title: "Google Search Console API Disconnected",
      description: "Direct indexing inspection and organic query performance sync is currently inactive.",
      affectedUrl: website.homepageUrl,
      whyItMatters: "Without GSC connection, search impressions and keyword CTR cannot be auto-tracked.",
      recommendedFix: "Configure Google Search Console OAuth credentials in Engine Settings -> Integrations.",
      severity: "MEDIUM",
      status: "OPEN",
      priorityScore: score,
      priorityLabel: label,
      seoImpact: 75,
      trafficPotential: 80,
      implementationEase: 70,
      urgency: 65,
      confidence: 95,
      lastDetectedAt: new Date(),
    });
  }

  // Synchronize discovered issues with TechnicalSEOIssue table in PostgreSQL
  for (const issue of discoveredIssues) {
    const existing = await prisma.technicalSEOIssue.findFirst({
      where: {
        websiteId,
        issueType: issue.issueType,
        affectedUrl: issue.affectedUrl,
      },
    });

    if (existing) {
      // Update last detected timestamp if still open
      if (existing.status !== "RESOLVED" && existing.status !== "IGNORED") {
        await prisma.technicalSEOIssue.update({
          where: { id: existing.id },
          data: { lastDetectedAt: new Date(), severity: issue.severity },
        });
      }
    } else {
      await prisma.technicalSEOIssue.create({
        data: {
          websiteId,
          issueType: issue.issueType,
          title: issue.title,
          description: issue.description,
          affectedUrl: issue.affectedUrl,
          whyItMatters: issue.whyItMatters,
          recommendedFix: issue.recommendedFix,
          severity: issue.severity,
          status: "OPEN",
        },
      });
    }
  }

  // Fetch all persisted issues for this website
  const allDbIssues = await prisma.technicalSEOIssue.findMany({
    where: { websiteId },
    orderBy: [{ severity: "asc" }, { lastDetectedAt: "desc" }],
  });

  const criticalCount = allDbIssues.filter((i) => i.severity === "CRITICAL" && i.status === "OPEN").length;
  const highCount = allDbIssues.filter((i) => i.severity === "HIGH" && i.status === "OPEN").length;
  const mediumCount = allDbIssues.filter((i) => i.severity === "MEDIUM" && i.status === "OPEN").length;
  const lowCount = allDbIssues.filter((i) => i.severity === "LOW" && i.status === "OPEN").length;
  const resolvedCount = allDbIssues.filter((i) => i.status === "RESOLVED").length;

  const metaTagsScore = Math.max(20, Math.min(100, metaScoreAcc));
  const contentStructureScore = Math.max(30, Math.min(100, structureScoreAcc));
  const linkHealthScore = Math.max(30, Math.min(100, linkScoreAcc));
  const imageOptimizationScore = Math.max(30, Math.min(100, imageScoreAcc));
  const crawlabilityScore = Math.max(40, Math.min(100, crawlabilityScoreAcc));

  const overallHealth = Math.round(
    (metaTagsScore + contentStructureScore + linkHealthScore + imageOptimizationScore + crawlabilityScore) / 5
  );

  const formattedIssues: AuditIssue[] = allDbIssues.map((dbIssue) => {
    let impact = 50;
    let urgency = 50;
    if (dbIssue.severity === "CRITICAL") {
      impact = 90;
      urgency = 90;
    } else if (dbIssue.severity === "HIGH") {
      impact = 75;
      urgency = 75;
    } else if (dbIssue.severity === "MEDIUM") {
      impact = 60;
      urgency = 55;
    } else {
      impact = 40;
      urgency = 35;
    }

    const { score, label } = calculatePriorityScore({
      seoImpact: impact,
      trafficPotential: 60,
      implementationEase: 90,
      urgency,
      confidence: 95,
    });

    return {
      id: dbIssue.id,
      issueType: dbIssue.issueType,
      title: dbIssue.title,
      description: dbIssue.description,
      affectedUrl: dbIssue.affectedUrl,
      whyItMatters: dbIssue.whyItMatters || "Impacts search ranking and user experience.",
      recommendedFix: dbIssue.recommendedFix,
      severity: dbIssue.severity,
      status: dbIssue.status as any,
      priorityScore: score,
      priorityLabel: label,
      seoImpact: impact,
      trafficPotential: 60,
      implementationEase: 90,
      urgency,
      confidence: 95,
      lastDetectedAt: dbIssue.lastDetectedAt,
    };
  });

  return {
    websiteId,
    websiteName: website.name,
    domain: website.domain,
    healthScore: overallHealth,
    totalIssuesCount: allDbIssues.length,
    criticalIssuesCount: criticalCount,
    highIssuesCount: highCount,
    mediumIssuesCount: mediumCount,
    lowIssuesCount: lowCount,
    resolvedIssuesCount: resolvedCount,
    categoryScores: {
      metaTags: metaTagsScore,
      contentStructure: contentStructureScore,
      linkHealth: linkHealthScore,
      imageOptimization: imageOptimizationScore,
      crawlability: crawlabilityScore,
    },
    issues: formattedIssues,
    lastAuditAt: new Date(),
  };
}

export async function getLatestSiteAudit(websiteId: string): Promise<SiteAuditSummary> {
  return runTechnicalSiteAudit(websiteId);
}
