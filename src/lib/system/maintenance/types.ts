export type TaskStatus = "SUCCESS" | "WARNING" | "FAILED" | "HALTED" | "SKIPPED";
export type TaskSeverity = "INFO" | "WARNING" | "CRITICAL";

export interface MaintenanceTaskResult {
  taskName: string;
  status: TaskStatus;
  severity: TaskSeverity;
  durationMs: number;
  message: string;
  details?: Record<string, any>;
  warnings?: string[];
  errors?: string[];
}

export interface MaintenanceReport {
  timestamp: string;
  status: TaskStatus;
  totalDurationMs: number;
  halted: boolean;
  haltReason?: string;
  tasks: MaintenanceTaskResult[];
  summary: {
    total: number;
    passed: number;
    warnings: number;
    failed: number;
  };
}

export interface MaintenanceConfig {
  logRetentionDays: number;
  analyticsRetentionDays: number;
  minDiskSpacePercent: number;
  tempMaxAgeHours: number;
}
