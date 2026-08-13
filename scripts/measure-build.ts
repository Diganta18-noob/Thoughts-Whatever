import { execSync } from "child_process";

async function measureBuild() {
  console.log("⏱️  Starting measured build test...\n");
  const startTime = Date.now();

  try {
    const output = execSync("npx next build", { encoding: "utf8" });
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(output);
    console.log(`\n✅ Build completed successfully in ${duration} seconds!`);
  } catch (error: any) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`❌ Build failed after ${duration} seconds:`, error.message);
  }
}

measureBuild();
