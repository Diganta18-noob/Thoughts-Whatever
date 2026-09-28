import jwt from "jsonwebtoken";
import { absoluteUrl } from "@/lib/utils";

function signingSecret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 16) throw new Error("AUTH_SECRET is not configured");
  return value;
}

export function createLetterConfirmationToken(subscriberId: string) {
  return jwt.sign({ sub: subscriberId, purpose: "letter-confirmation" }, signingSecret(), { expiresIn: "48h" });
}

export function verifyLetterConfirmationToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, signingSecret());
    if (typeof payload === "string" || payload.purpose !== "letter-confirmation" || typeof payload.sub !== "string") return null;
    return payload.sub;
  } catch {
    return null;
  }
}

export function letterConfirmationUrl(subscriberId: string) {
  const path = `/letter/confirm?token=${encodeURIComponent(createLetterConfirmationToken(subscriberId))}`;
  const url = absoluteUrl(path);
  return process.env.NODE_ENV === "production" && !url.startsWith("https://")
    ? `https://www.thoughtswhatever.in${path}`
    : url;
}
