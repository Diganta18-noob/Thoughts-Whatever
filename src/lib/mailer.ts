import nodemailer from "nodemailer";

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

let cachedTransporter: nodemailer.Transporter | null = null;

export function getTransporter(): nodemailer.Transporter | null {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!user || !pass) {
    return null;
  }

  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  return cachedTransporter;
}

export async function sendMail(options: SendMailOptions): Promise<nodemailer.SentMessageInfo> {
  const transporter = getTransporter();
  if (!transporter) {
    throw new Error("SMTP is unconfigured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASSWORD in environment.");
  }

  const from = options.from || `"Thoughts Whatever" <${process.env.SMTP_USER}>`;

  return transporter.sendMail({
    from,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<nodemailer.SentMessageInfo> {
  const deliveryAddress =
    (to.endsWith("@thoughts.whatever.com") || to.endsWith("@whatver.com"))
      ? (process.env.NOTIFICATION_EMAIL_TO || process.env.SMTP_USER || to)
      : to;

  const subject = "[Thoughts Whatever] Password Reset Request / পাসওয়ার্ড রিসেট";

  const text = `Hello,\n\nYou requested a password reset for your Thoughts Whatever account. Click the link below to set a new password:\n\n${resetUrl}\n\nThis link will expire in 30 minutes and can only be used once. If you did not request this password reset, please ignore this email.\n\n---\n\nনমস্কার,\n\nআপনি Thoughts Whatever অ্যাকাউন্টের পাসওয়ার্ড রিসেটের অনুরোধ করেছেন। নতুন পাসওয়ার্ড সেট করতে নিচের লিংকে ক্লিক করুন:\n\n${resetUrl}\n\nএই লিংকটির মেয়াদ ৩০ মিনিট এবং এটি কেবল একবারই ব্যবহার করা যাবে। আপনি যদি এই অনুরোধ না করে থাকেন, তবে এই ইমেলটি উপেক্ষা করতে পারেন।`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8"/>
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>Password Reset</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f4ef; color: #141211;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #f7f4ef; padding: 40px 16px;">
        <tr>
          <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #ffffff; border: 1px solid #e5dfd5; border-radius: 4px; padding: 36px 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
              <tr>
                <td style="text-align: center; padding-bottom: 24px; border-bottom: 1px solid #e5dfd5;">
                  <span style="font-family: Georgia, serif; font-size: 24px; font-weight: bold; letter-spacing: -0.5px; color: #141211;">thoughts.whatever</span>
                  <div style="font-size: 10px; font-weight: 600; letter-spacing: 2px; color: #888075; margin-top: 4px; text-transform: uppercase;">Security & Recovery</div>
                </td>
              </tr>
              <tr>
                <td style="padding: 28px 0 20px 0;">
                  <h2 style="margin: 0 0 12px 0; font-family: Georgia, serif; font-size: 19px; font-weight: normal; color: #141211;">Reset your password / পাসওয়ার্ড পরিবর্তন</h2>
                  <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #403b36;">
                    You recently requested to reset your password for the Thoughts Whatever administration room. Click the button below to proceed:
                  </p>
                  <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #605850;">
                    আপনি Thoughts Whatever এডমিন একাউন্টের পাসওয়ার্ড রিসেটের অনুরোধ করেছেন। নতুন পাসওয়ার্ড দিতে নিচের বাটনে ক্লিক করুন:
                  </p>
                  <div style="text-align: center; margin: 28px 0;">
                    <a href="${resetUrl}" target="_blank" style="display: inline-block; background-color: #a8201a; color: #ffffff; font-size: 14px; font-weight: 500; text-decoration: none; padding: 12px 28px; border-radius: 2px; letter-spacing: 0.2px;">Reset Password / পাসওয়ার্ড রিসেট করুন</a>
                  </div>
                  <p style="margin: 24px 0 8px 0; font-size: 13px; line-height: 1.5; color: #70675e;">
                    <strong>Security Notice:</strong> This link will expire in <strong>30 minutes</strong> and can only be used once. If you did not request this change, you can safely ignore this email.
                  </p>
                  <p style="margin: 0 0 20px 0; font-size: 13px; line-height: 1.5; color: #70675e;">
                    <strong>নিরাপত্তা বার্তা:</strong> এই লিংকটির মেয়াদ <strong>৩০ মিনিট</strong> এবং একবারই ব্যবহারযোগ্য। আপনি অনুরোধ না করে থাকলে এটি উপেক্ষা করুন।
                  </p>
                  <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f0ebe1; word-break: break-all; font-size: 12px; color: #999083;">
                    If the button doesn't work, copy and paste this URL into your browser:<br/>
                    <a href="${resetUrl}" style="color: #a8201a; text-decoration: none;">${resetUrl}</a>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding-top: 20px; border-top: 1px solid #e5dfd5; text-align: center; font-size: 11px; color: #a0988d;">
                  Thoughts Whatever — Bengali literary & documentary publication
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return sendMail({
    to: deliveryAddress,
    subject,
    text,
    html,
  });
}
