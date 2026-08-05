import { MaintenanceReport } from "../maintenance/types";

export interface BackupManifest {
  backupId: string;
  timestamp: string;
  type: "full" | "database" | "media" | "content";
  checksums: Record<string, string>;
  databaseStats?: {
    tableCount: number;
    totalRows: number;
    sizeBytes: number;
  };
  mediaStats?: {
    fileCount: number;
    totalSizeBytes: number;
  };
  contentStats?: {
    fileCount: number;
    totalSizeBytes: number;
  };
  maintenanceReport?: MaintenanceReport;
  verified: boolean;
}

export interface BackupResult {
  backupId: string;
  timestamp: string;
  status: "SUCCESS" | "FAILED" | "PARTIAL";
  durationMs: number;
  localPath: string;
  r2Path?: string;
  manifest: BackupManifest;
  errors?: string[];
}
