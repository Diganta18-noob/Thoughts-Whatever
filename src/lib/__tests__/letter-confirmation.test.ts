/** @jest-environment node */
import jwt from "jsonwebtoken";
import { createLetterConfirmationToken, verifyLetterConfirmationToken } from "@/lib/letter-confirmation";

const originalSecret = process.env.AUTH_SECRET;
const testSecret = "test-secret-for-letter-confirmation-12345";

beforeAll(() => { process.env.AUTH_SECRET = testSecret; });
afterAll(() => { if (originalSecret === undefined) delete process.env.AUTH_SECRET; else process.env.AUTH_SECRET = originalSecret; });

it("accepts only unexpired letter-confirmation tokens", () => {
  expect(verifyLetterConfirmationToken(createLetterConfirmationToken("sub-1"))).toBe("sub-1");
  expect(verifyLetterConfirmationToken(jwt.sign({ sub: "sub-1", purpose: "admin" }, testSecret))).toBeNull();
  expect(verifyLetterConfirmationToken(jwt.sign({ sub: "sub-1", purpose: "letter-confirmation" }, testSecret, { expiresIn: -1 }))).toBeNull();
});
