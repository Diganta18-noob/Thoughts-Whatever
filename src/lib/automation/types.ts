/**
 * Automation Types — Complete Production System Definitions
 */

export type PipelineStepStatus = "SUCCESS" | "WARNING" | "FAILED" | "SKIPPED";

export interface StepLog {
  stepNumber: number;
  name: string;
  status: PipelineStepStatus;
  durationMs: number;
  message: string;
  details?: Record<string, unknown>;
  error?: string;
}

export interface PipelineReport {
  executionId: string;
  timestamp: string;
  timezone: string;
  totalDurationMs: number;
  overallStatus: PipelineStepStatus;
  summary: {
    total: number;
    passed: number;
    warnings: number;
    failed: number;
    skipped: number;
  };
  steps: StepLog[];
}

export interface BackupArtifactInfo {
  id: string;
  type: "database" | "uploads" | "storage";
  filename: string;
  sizeBytes: number;
  createdAt: string;
  r2Url?: string;
  localPath?: string;
}

export interface SecurityAuditResult {
  failedLogins24h: number;
  activeSessions: number;
  revokedTokenReuseAttempts: number;
  rateLimitHits: number;
  warnings: string[];
}

export interface ContentIntegrityResult {
  totalPiecesChecked: number;
  repairedPiecesCount: number;
  issues: {
    pieceId: string;
    slug: string;
    missingFields: string[];
  }[];
}

export interface BrokenLinksResult {
  totalChecked: number;
  brokenCount: number;
  brokenLinks: {
    url: string;
    source: string;
    reason: string;
  }[];
}

export interface HealthCheckResult {
  status: "HEALTHY" | "DEGRADED" | "CRITICAL";
  dbConnected: boolean;
  r2Connected: boolean;
  diskSpacePercent: number;
  memoryUsageMb: number;
  uptimeSec: number;
  issues: string[];
}

export interface PerformanceAuditResult {
  slowQueriesDetected: number;
  unoptimizedImagesCount: number;
  largestPagePayloadKb: number;
  recommendations: string[];
}

export interface AnalyticsSummary {
  period: string;
  totalViews: number;
  uniqueVisitors: number;
  totalArticles: number;
  totalSubscribers: number;
  totalReelClicks: number;
  topArticles: { slug: string; titleBn: string; views: number }[];
}
