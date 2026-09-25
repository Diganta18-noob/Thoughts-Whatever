import { describe, it, expect } from "@jest/globals";
import { loginSchema, forgotPasswordSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import { invalidateAdminCache } from "@/lib/auth";

describe("Bug Fixes Verification Suite", () => {
  describe("Zod Email Validation", () => {
    it("validates correct emails and rejects invalid ones in loginSchema", () => {
      const valid = loginSchema.safeParse({ email: "user@example.com", password: "password123" });
      expect(valid.success).toBe(true);

      const invalid = loginSchema.safeParse({ email: "not-an-email", password: "password123" });
      expect(invalid.success).toBe(false);
    });

    it("validates correct emails in forgotPasswordSchema", () => {
      const valid = forgotPasswordSchema.safeParse({ email: "admin@thoughtswhatever.in" });
      expect(valid.success).toBe(true);

      const invalid = forgotPasswordSchema.safeParse({ email: "invalid-email" });
      expect(invalid.success).toBe(false);
    });
  });

  describe("In-Memory Rate Limiter", () => {
    it("allows requests up to max and blocks exceeding requests", () => {
      const id = `test-ip-${Date.now()}`;
      const opts = { windowMs: 60000, max: 2 };

      const r1 = rateLimit(id, opts);
      expect(r1.success).toBe(true);
      expect(r1.remaining).toBe(1);

      const r2 = rateLimit(id, opts);
      expect(r2.success).toBe(true);
      expect(r2.remaining).toBe(0);

      const r3 = rateLimit(id, opts);
      expect(r3.success).toBe(false);
      expect(r3.remaining).toBe(0);
    });
  });

  describe("Admin Cache Invalidation", () => {
    it("can be called without error for specific user or all users", () => {
      expect(() => invalidateAdminCache("test-user-id")).not.toThrow();
      expect(() => invalidateAdminCache()).not.toThrow();
    });
  });
});
