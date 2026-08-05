import nodemailer from "nodemailer";
import { MaintenanceReport } from "./maintenance/types";
import { BackupResult } from "./backup/types";

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user, pass },
  });
}

export async function sendNotificationEmail(subject: string, htmlContent: string): Promise<boolean> {
  const transporter = getTransporter();
  const recipient = process.env.NOTIFICATION_EMAIL_TO || process.env.MAINTENANCE_EMAIL_RECIPIENT;

  if (!transporter || !recipient) {
    console.log(`[Notification Email Skipped (SMTP not configured)] Subject: ${subject}`);
    return false;
  }

  try {
    await transporter.sendMail({
      from: `"Thoughts Whatever System" <${process.env.SMTP_USER}>`,
      to: recipient,
      subject,
      html: htmlContent,
    });
    return true;
  } catch (err) {
    console.error("Failed to send notification email:", err);
    return false;
  }
}

export async function notifyMaintenanceComplete(report: MaintenanceReport) {
  const statusEmoji = report.status === "SUCCESS" ? "✅" : report.status === "WARNING" ? "⚠️" : "❌";
  const subject = `${statusEmoji} [Thoughts Whatever] Maintenance Report: ${report.status}`;

  const taskRows = report.tasks
    .map(
      (t) =>
        `<tr>
          <td style="padding:8px;border:1px solid #ddd;">${t.taskName}</td>
          <td style="padding:8px;border:1px solid #ddd;font-weight:bold;">${t.status}</td>
          <td style="padding:8px;border:1px solid #ddd;">${t.durationMs}ms</td>
          <td style="padding:8px;border:1px solid #ddd;">${t.message}</td>
        </tr>`
    )
    .join("");

  const html = `
    <h2>Server Maintenance System Summary</h2>
    <p><strong>Status:</strong> ${report.status}</p>
    <p><strong>Timestamp:</strong> ${report.timestamp}</p>
    <p><strong>Total Duration:</strong> ${(report.totalDurationMs / 1000).toFixed(2)}s</p>
    ${report.halted ? `<p style="color:red;"><strong>HALTED:</strong> ${report.haltReason}</p>` : ""}
    
    <h3>Task Details</h3>
    <table style="width:100%;border-collapse:collapse;text-align:left;">
      <thead>
        <tr style="background:#f4f4f4;">
          <th style="padding:8px;border:1px solid #ddd;">Task</th>
          <th style="padding:8px;border:1px solid #ddd;">Status</th>
          <th style="padding:8px;border:1px solid #ddd;">Duration</th>
          <th style="padding:8px;border:1px solid #ddd;">Message</th>
        </tr>
      </thead>
      <tbody>${taskRows}</tbody>
    </table>
  `;

  await sendNotificationEmail(subject, html);
}

export async function notifyBackupComplete(result: BackupResult) {
  const statusEmoji = result.status === "SUCCESS" ? "✅" : "⚠️";
  const subject = `${statusEmoji} [Thoughts Whatever] Backup Report: ${result.status}`;

  const html = `
    <h2>Backup Operation Completed</h2>
    <p><strong>Backup ID:</strong> ${result.backupId}</p>
    <p><strong>Status:</strong> ${result.status}</p>
    <p><strong>Timestamp:</strong> ${result.timestamp}</p>
    <p><strong>Duration:</strong> ${(result.durationMs / 1000).toFixed(2)}s</p>
    <p><strong>Integrity Verified:</strong> ${result.manifest.verified ? "Yes ✅" : "No ❌"}</p>
    <p><strong>Local Path:</strong> ${result.localPath}</p>
    <p><strong>Cloudflare R2 Path:</strong> ${result.r2Path || "N/A"}</p>
  `;

  await sendNotificationEmail(subject, html);
}
