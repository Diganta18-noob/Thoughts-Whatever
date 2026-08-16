/**
 * Notification System — HTML Daily Executive Production Report Email
 */

import { getTransporter } from "@/lib/mailer";
import { PipelineReport } from "../types";
import { writeLog } from "./logger";

export async function sendDailyProductionReportEmail(report: PipelineReport): Promise<boolean> {
  const transporter = getTransporter();
  const to = process.env.NOTIFICATION_EMAIL_TO || process.env.SMTP_USER;

  if (!transporter || !to) {
    writeLog("automation", "WARN", "SMTP credentials or notification recipient missing. Email skipped.");
    return false;
  }

  const statusColor = report.overallStatus === "SUCCESS" ? "#16a34a" : report.overallStatus === "WARNING" ? "#d97706" : "#dc2626";
  const statusEmoji = report.overallStatus === "SUCCESS" ? "✅" : report.overallStatus === "WARNING" ? "⚠️" : "❌";

  const rowsHtml = report.steps.map((step) => {
    const color = step.status === "SUCCESS" ? "#16a34a" : step.status === "WARNING" ? "#d97706" : step.status === "SKIPPED" ? "#6b7280" : "#dc2626";
    return `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 10px; font-weight: bold; color: #374151;">${step.stepNumber}. ${step.name}</td>
        <td style="padding: 10px; font-weight: bold; color: ${color};">${step.status}</td>
        <td style="padding: 10px; color: #6b7280;">${step.durationMs} ms</td>
        <td style="padding: 10px; color: #4b5563;">${step.message}</td>
      </tr>
    `;
  }).join("");

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"/></head>
    <body style="font-family: system-ui, -apple-system, sans-serif; background-color: #f9fafb; padding: 24px; color: #1f2937;">
      <div style="max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h2 style="margin-top: 0; color: #111827;">${statusEmoji} Thoughts Whatever — Daily Production Report</h2>
        <p style="color: #6b7280; font-size: 14px;">Executed at ${report.timestamp} (${report.timezone}) • Total Duration: ${(report.totalDurationMs / 1000).toFixed(2)}s</p>

        <div style="background-color: #f3f4f6; border-left: 4px solid ${statusColor}; padding: 16px; margin: 20px 0; border-radius: 4px;">
          <strong style="font-size: 16px; color: ${statusColor};">Overall Status: ${report.overallStatus}</strong>
          <div style="margin-top: 8px; font-size: 14px; color: #4b5563;">
            Total Steps: ${report.summary.total} | Passed: ${report.summary.passed} | Warnings: ${report.summary.warnings} | Failed: ${report.summary.failed}
          </div>
        </div>

        <h3 style="color: #111827; margin-top: 28px;">Pipeline Execution Steps</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left;">
          <thead>
            <tr style="background-color: #f9fafb; border-bottom: 2px solid #e5e7eb;">
              <th style="padding: 10px; color: #374151;">Step</th>
              <th style="padding: 10px; color: #374151;">Status</th>
              <th style="padding: 10px; color: #374151;">Duration</th>
              <th style="padding: 10px; color: #374151;">Details</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center;">
          Thoughts Whatever Self-Maintaining SaaS Platform • Production Automation Engine
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"Thoughts Whatever Engine" <${process.env.SMTP_USER}>`,
      to,
      subject: `${statusEmoji} Production Report [${report.overallStatus}] — ${report.timestamp.split("T")[0]}`,
      html,
    });
    writeLog("automation", "INFO", `Daily production report email delivered to ${to}`);
    return true;
  } catch (err) {
    writeLog("automation", "ERROR", "Failed to send daily production report email:", err);
    return false;
  }
}
