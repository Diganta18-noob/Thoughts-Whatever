import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding SEO Growth Engine database models...");

  // 1. Ensure Default Website: Thoughts Whatever
  const defaultWebsite = await prisma.website.upsert({
    where: { domain: "thoughtswhatever.in" },
    update: {
      name: "Thoughts Whatever",
      homepageUrl: "https://www.thoughtswhatever.in",
      niche: "Bengali Literature, Culture, AI, Tech & Longform Essays",
      targetCountry: "IN",
      targetLanguage: "en",
      isDefault: true,
      gscConnected: false,
      gaConnected: false,
    },
    create: {
      name: "Thoughts Whatever",
      domain: "thoughtswhatever.in",
      homepageUrl: "https://www.thoughtswhatever.in",
      niche: "Bengali Literature, Culture, AI, Tech & Longform Essays",
      targetCountry: "IN",
      targetLanguage: "en",
      isDefault: true,
      gscConnected: false,
      gaConnected: false,
    },
  });

  console.log(`✓ Primary Website: ${defaultWebsite.name} (${defaultWebsite.domain})`);

  // 2. Secondary Website: Tech & AI Tools Digest
  const secondaryWebsite = await prisma.website.upsert({
    where: { domain: "aitoolsjournal.dev" },
    update: {
      name: "AI Tools Journal",
      homepageUrl: "https://aitoolsjournal.dev",
      niche: "Developer Tools, LLMs, Next.js, Engineering",
      targetCountry: "US",
      targetLanguage: "en",
      isDefault: false,
    },
    create: {
      name: "AI Tools Journal",
      domain: "aitoolsjournal.dev",
      homepageUrl: "https://aitoolsjournal.dev",
      niche: "Developer Tools, LLMs, Next.js, Engineering",
      targetCountry: "US",
      targetLanguage: "en",
      isDefault: false,
    },
  });

  console.log(`✓ Secondary Website: ${secondaryWebsite.name} (${secondaryWebsite.domain})`);

  // 3. Monitored Backlinks for Thoughts Whatever
  const backlinks = [
    {
      referringDomain: "medium.com",
      sourceUrl: "https://medium.com/@litcritic/bengali-renaissance-digital-archives-2024",
      targetUrl: "https://www.thoughtswhatever.in/writing/padma-nadar-majhi",
      anchorText: "Bengali literature companion essays",
      linkType: "EDITORIAL",
      isFollow: true,
      status: "ACTIVE" as const,
      riskLevel: "LOW" as const,
      domainAuthority: 92,
      trafficEstimate: 45000,
    },
    {
      referringDomain: "dev.to",
      sourceUrl: "https://dev.to/fullstack/modern-bangla-transliteration-engines",
      targetUrl: "https://www.thoughtswhatever.in/resource/transliteration",
      anchorText: "Avro phonetics algorithm implementation",
      linkType: "EDITORIAL",
      isFollow: true,
      status: "ACTIVE" as const,
      riskLevel: "LOW" as const,
      domainAuthority: 84,
      trafficEstimate: 28000,
    },
    {
      referringDomain: "scroll.in",
      sourceUrl: "https://scroll.in/article/104523/modern-digital-storytelling-bengali",
      targetUrl: "https://www.thoughtswhatever.in",
      anchorText: "Thoughts Whatever literary studio",
      linkType: "EDITORIAL",
      isFollow: true,
      status: "ACTIVE" as const,
      riskLevel: "LOW" as const,
      domainAuthority: 78,
      trafficEstimate: 12000,
    },
    {
      referringDomain: "github.com",
      sourceUrl: "https://github.com/awesome-bengali/digital-humanities",
      targetUrl: "https://www.thoughtswhatever.in",
      anchorText: "Thoughts Whatever",
      linkType: "DIRECTORY",
      isFollow: false,
      status: "ACTIVE" as const,
      riskLevel: "LOW" as const,
      domainAuthority: 96,
      trafficEstimate: 80000,
    },
    {
      referringDomain: "old-lit-forum.net",
      sourceUrl: "https://old-lit-forum.net/threads/19th-century-bengali-writers.html",
      targetUrl: "https://www.thoughtswhatever.in/blog/rabindranath-letters",
      anchorText: "Letters analysis",
      linkType: "RESOURCE",
      isFollow: true,
      status: "LOST" as const,
      riskLevel: "MEDIUM" as const,
      domainAuthority: 42,
      trafficEstimate: 600,
    },
  ];

  for (const b of backlinks) {
    await prisma.monitoredBacklink.upsert({
      where: {
        websiteId_sourceUrl_targetUrl: {
          websiteId: defaultWebsite.id,
          sourceUrl: b.sourceUrl,
          targetUrl: b.targetUrl,
        },
      },
      update: b,
      create: {
        ...b,
        websiteId: defaultWebsite.id,
      },
    });
  }
  console.log(`✓ Seeded ${backlinks.length} Monitored Backlinks.`);

  // 4. Target Keywords
  const keywords = [
    {
      keyword: "bengali literature online",
      targetUrl: "https://www.thoughtswhatever.in/archive",
      country: "IN",
      searchVolume: 4200,
      difficulty: 38,
      intent: "INFORMATIONAL" as const,
      currentPosition: 4,
      previousPosition: 6,
      bestPosition: 3,
    },
    {
      keyword: "avro transliteration api",
      targetUrl: "https://www.thoughtswhatever.in/resource/transliteration",
      country: "GLOBAL",
      searchVolume: 1800,
      difficulty: 45,
      intent: "COMMERCIAL" as const,
      currentPosition: 2,
      previousPosition: 3,
      bestPosition: 2,
    },
    {
      keyword: "rabindranath tagore letters analysis",
      targetUrl: "https://www.thoughtswhatever.in/writing",
      country: "IN",
      searchVolume: 950,
      difficulty: 24,
      intent: "INFORMATIONAL" as const,
      currentPosition: 1,
      previousPosition: 1,
      bestPosition: 1,
    },
    {
      keyword: "bengali audio story platform",
      targetUrl: "https://www.thoughtswhatever.in",
      country: "IN",
      searchVolume: 3100,
      difficulty: 52,
      intent: "NAVIGATIONAL" as const,
      currentPosition: 8,
      previousPosition: 12,
      bestPosition: 7,
    },
  ];

  for (const k of keywords) {
    await prisma.keyword.upsert({
      where: {
        websiteId_keyword_country_searchEngine: {
          websiteId: defaultWebsite.id,
          keyword: k.keyword,
          country: k.country,
          searchEngine: "google",
        },
      },
      update: k,
      create: {
        ...k,
        websiteId: defaultWebsite.id,
        searchEngine: "google",
      },
    });
  }
  console.log(`✓ Seeded ${keywords.length} Tracked Keywords.`);

  // 5. Backlink Opportunities (White-Hat Qualified)
  const opportunities = [
    {
      websiteName: "Literary Hub",
      domain: "lithub.com",
      url: "https://lithub.com/category/essays-and-criticism",
      opportunityType: "GUEST_POST" as const,
      contactName: "Dan Sheehan",
      contactEmail: "dan@lithub.com",
      domainAuthority: 82,
      domainRating: 85,
      trafficEstimate: 650000,
      spamScore: 1,
      topicalRelevance: 95,
      status: "QUALIFIED" as const,
      priority: "HIGH" as const,
      overallScore: 92,
      aiRecommendation: "PURSUE" as const,
      aiReasoning: "Exceptional editorial authority. Accepts high quality literary essays on South Asian classic translations.",
      suggestedAngle: "The Untold Evolution of Modern Bengali Free Verse: From Jibanananda to Post-Independence.",
    },
    {
      websiteName: "Calcutta University Humanities Forum",
      domain: "caluniv-lit.edu.in",
      url: "https://caluniv-lit.edu.in/resources/digital-humanities",
      opportunityType: "RESOURCE_PAGE" as const,
      contactName: "Prof. S. Banerjee",
      contactEmail: "s.banerjee@caluniv.ac.in",
      domainAuthority: 74,
      domainRating: 70,
      trafficEstimate: 45000,
      spamScore: 0,
      topicalRelevance: 100,
      status: "READY_FOR_OUTREACH" as const,
      priority: "URGENT" as const,
      overallScore: 94,
      aiRecommendation: "PURSUE" as const,
      aiReasoning: "Authoritative .edu domain with dedicated syllabus reading list. Perfect match for our documentary timeline resource.",
      suggestedAngle: "Reference our comprehensive Timeline of Modern Bengali Literature for semester research.",
    },
    {
      websiteName: "NLP Tech Insights",
      domain: "nlptechinsights.io",
      url: "https://nlptechinsights.io/indic-script-transliteration-benchmark",
      opportunityType: "BROKEN_LINK" as const,
      contactName: "Karthik R.",
      contactEmail: "editor@nlptechinsights.io",
      domainAuthority: 68,
      domainRating: 64,
      trafficEstimate: 32000,
      spamScore: 2,
      topicalRelevance: 88,
      status: "CONTACTED" as const,
      priority: "HIGH" as const,
      overallScore: 86,
      aiRecommendation: "PURSUE" as const,
      aiReasoning: "Their benchmark article points to a 404 dead link for Avro parsing documentation. Our technical breakdown is a direct replacement.",
      suggestedAngle: "Offer replacement URL for the dead Avro phonetic reference.",
    },
  ];

  for (const o of opportunities) {
    const opp = await prisma.backlinkOpportunity.create({
      data: {
        ...o,
        websiteId: defaultWebsite.id,
      },
    });

    if (o.contactName) {
      await prisma.opportunityContact.create({
        data: {
          opportunityId: opp.id,
          name: o.contactName,
          email: o.contactEmail,
          role: "Editor / Curator",
        },
      });
    }
  }
  console.log(`✓ Seeded ${opportunities.length} Backlink Opportunities with AI Scores.`);

  // 6. Outreach Campaigns
  const campaign = await prisma.outreachCampaign.create({
    data: {
      websiteId: defaultWebsite.id,
      name: "Q3 University & Literary Magazine Digital PR Outreach",
      objective: "Acquire 10+ high-authority editorial and resource page backlinks for Timeline and Rachana companions.",
      targetContentUrl: "https://www.thoughtswhatever.in/resource/bangla-sahityer-timeline",
      targetAudience: "University professors, literary editors, cultural journalists",
      campaignType: "DIGITAL_PR",
      status: "ACTIVE",
      autoFollowUp: false,
    },
  });

  await prisma.campaignProspect.create({
    data: {
      campaignId: campaign.id,
      contactName: "Prof. S. Banerjee",
      contactEmail: "s.banerjee@caluniv.ac.in",
      websiteDomain: "caluniv-lit.edu.in",
      targetUrl: "https://caluniv-lit.edu.in/resources/digital-humanities",
      stage: "EMAIL_DRAFTED",
      emailSubject: "Resource Suggestion: Interactive Timeline of Modern Bengali Literature",
      emailBody: "Dear Professor Banerjee,\n\nI was reading your curated Digital Humanities resource portal and thoroughly enjoyed the archival curation.\n\nAt Thoughts Whatever, we recently published a peer-verified interactive timeline covering 1860–2020 Bengali literary movements with primary source citations. Given your focus on modern South Asian literature, I wondered if this might be a helpful reference for your students:\nhttps://www.thoughtswhatever.in/resource/bangla-sahityer-timeline\n\nWarm regards,\nDiganta Biswas\nThoughts Whatever",
      approvalStatus: "APPROVED",
    },
  });
  console.log(`✓ Seeded Active Outreach Campaign & Prospect.`);

  // 7. Technical SEO Issues
  await prisma.technicalSEOIssue.createMany({
    data: [
      {
        websiteId: defaultWebsite.id,
        issueType: "MISSING_ALT",
        title: "2 Cover Images Missing Descriptive Alt Text",
        description: "Article cover images in /writing/padma-nadar-majhi are missing alt attributes, impairing accessibility and Google Image search visibility.",
        affectedUrl: "https://www.thoughtswhatever.in/writing/padma-nadar-majhi",
        whyItMatters: "Alt text is critical for image indexing and screen reader compliance.",
        recommendedFix: "Add descriptive Bengali and English alt text in Media Library.",
        severity: "MEDIUM",
        status: "OPEN",
      },
      {
        websiteId: defaultWebsite.id,
        issueType: "SLOW_LCP",
        title: "Preload Bengali Web Font to Improve LCP",
        description: "Noto Serif Bengali font file causes a 120ms layout shift on initial load.",
        affectedUrl: "https://www.thoughtswhatever.in",
        whyItMatters: "Core Web Vitals LCP directly impacts search ranking stability.",
        recommendedFix: "Configure link rel=preload in HTML head.",
        severity: "LOW",
        status: "OPEN",
      },
    ],
  });
  console.log(`✓ Seeded Technical SEO Issues.`);

  console.log("✨ SEO Growth Engine Seed Completed Successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
