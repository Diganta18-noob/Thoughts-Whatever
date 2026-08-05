import fs from "fs";
import crypto from "crypto";

export async function verifyChecksums(manifestChecksums: Record<string, string>): Promise<{
  valid: boolean;
  failedFiles: string[];
}> {
  const failedFiles: string[] = [];

  for (const [filePath, expectedHash] of Object.entries(manifestChecksums)) {
    if (!fs.existsSync(filePath)) {
      failedFiles.push(`${filePath} (missing)`);
      continue;
    }

    const fileBuffer = fs.readFileSync(filePath);
    const hash = crypto.createHash("sha256").update(fileBuffer).digest("hex");

    if (hash !== expectedHash) {
      failedFiles.push(`${filePath} (checksum mismatch)`);
    }
  }

  return {
    valid: failedFiles.length === 0,
    failedFiles,
  };
}

export function computeFileHash(filePath: string): string {
  if (!fs.existsSync(filePath)) return "";
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(fileBuffer).digest("hex");
}
