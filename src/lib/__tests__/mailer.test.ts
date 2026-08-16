import { describe, it, expect, jest, beforeEach, afterEach } from "@jest/globals";

const mockSendMail = jest.fn<(...args: any[]) => Promise<any>>();
const mockCreateTransport = jest.fn<(...args: any[]) => any>().mockReturnValue({
  sendMail: mockSendMail,
});

jest.mock("nodemailer", () => ({
  createTransport: (...args: any[]) => mockCreateTransport(...args),
}));

const {
  sendMail,
  sendPasswordResetEmail,
  getTransporter,
} = require("@/lib/mailer") as typeof import("@/lib/mailer");

describe("Mailer Service", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    mockSendMail.mockReset();
    mockCreateTransport.mockReset();
    mockCreateTransport.mockReturnValue({
      sendMail: mockSendMail,
    });
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("throws a descriptive error when SMTP is unconfigured and sendMail is called", async () => {
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASSWORD;

    await expect(
      sendMail({
        to: "admin@example.com",
        subject: "Test",
        html: "<p>Test</p>",
      })
    ).rejects.toThrow("SMTP is unconfigured");
  });

  it("sends email successfully when SMTP is configured", async () => {
    process.env.SMTP_HOST = "smtp.mailgun.org";
    process.env.SMTP_PORT = "587";
    process.env.SMTP_USER = "sender@thoughts.whatever.com";
    process.env.SMTP_PASSWORD = "secret-password";

    mockSendMail.mockResolvedValue({ messageId: "msg-123" });

    const result = await sendMail({
      to: "admin@thoughts.whatever.com",
      subject: "Test Subject",
      html: "<p>Hello</p>",
      text: "Hello",
    });

    expect(result).toEqual({ messageId: "msg-123" });
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: '"Thoughts Whatever" <sender@thoughts.whatever.com>',
        to: "admin@thoughts.whatever.com",
        subject: "Test Subject",
        html: "<p>Hello</p>",
        text: "Hello",
      })
    );
  });

  it("sendPasswordResetEmail includes bilingual copy, reset URL, and 30-minute expiry note in both HTML and text", async () => {
    process.env.SMTP_HOST = "smtp.mailgun.org";
    process.env.SMTP_PORT = "587";
    process.env.SMTP_USER = "sender@thoughts.whatever.com";
    process.env.SMTP_PASSWORD = "secret-password";

    mockSendMail.mockResolvedValue({ messageId: "msg-reset-123" });

    const resetUrl = "https://thoughts-whatever.vercel.app/admin/reset-password?token=secret-token-123";
    await sendPasswordResetEmail("admin@thoughts.whatever.com", resetUrl);

    expect(mockSendMail).toHaveBeenCalledTimes(1);
    const callArg = mockSendMail.mock.calls[0][0];

    expect(callArg.to).toBe("admin@thoughts.whatever.com");
    expect(callArg.subject).toContain("Password Reset");
    expect(callArg.text).toContain(resetUrl);
    expect(callArg.text).toContain("30 minutes");
    expect(callArg.text).toContain("৩০ মিনিট");
    expect(callArg.html).toContain(resetUrl);
    expect(callArg.html).toContain("30 minutes");
    expect(callArg.html).toContain("৩০ মিনিট");
  });
});
