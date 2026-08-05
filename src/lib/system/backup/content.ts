import fs from "fs";
import path from "path";
const CONTENT_SRC_DIR = path.join(process.cwd(), "Content");

export async function backupContent(targetDir: string): Promise<{
  filePath: string;
  fileCount: number;
  totalSizeBytes: number;
}> {
  const archivePath = path.join(targetDir, "content.tar.gz");
  let fileCount = 0;

  if (!fs.existsSync(CONTENT_SRC_DIR)) {
    // Write empty tar if directory doesn't exist
    fs.writeFileSync(archivePath, Buffer.from(""));
    return { filePath: archivePath, fileCount: 0, totalSizeBytes: 0 };
  }

  return new Promise(async (resolve, reject) => {
    const archiver = await import("archiver");
    const output = fs.createWriteStream(archivePath);
    const archive = new (archiver as any).TarArchive({ gzip: true });

    output.on("close", () => {
      const stat = fs.statSync(archivePath);
      resolve({
        filePath: archivePath,
        fileCount,
        totalSizeBytes: stat.size,
      });
    });

    archive.on("error", (err: any) => reject(err));
    archive.on("entry", () => {
      fileCount++;
    });

    archive.pipe(output);
    archive.directory(CONTENT_SRC_DIR, false);
    archive.finalize();
  });
}
