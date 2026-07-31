/**
 * Creates or updates the single admin account.
 *
 *   npm run admin:hash -- you@example.com "your password" "আপনার নাম"
 *
 * There is no sign-up page anywhere on the site, on purpose: a publication with
 * one writer does not need a registration form, and not having one means there
 * is no way in that isn't this script with database access.
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const [email, password, nameBn] = process.argv.slice(2);

  if (!email || !password) {
    console.error(
      'Usage: npm run admin:hash -- you@example.com "your password" ["আপনার নাম"]',
    );
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const normalised = email.trim().toLowerCase();

  const admin = await prisma.adminUser.upsert({
    where: { email: normalised },
    create: { email: normalised, passwordHash, nameBn: nameBn ?? null },
    update: { passwordHash, ...(nameBn ? { nameBn } : {}) },
    select: { id: true, email: true, createdAt: true },
  });

  console.log(`✓ admin ready: ${admin.email}`);
  console.log("  sign in at /admin/login");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
