const DEBUG = process.env.NEXT_PUBLIC_DEBUG_LOADING === "true";

export const debug = {
  log(label: string, message: string, meta?: Record<string, string | number | boolean>) {
    if (!DEBUG) return;
    const prefix = `[${label}] ${new Date().toISOString().slice(11, 23)}`;
    if (meta) {
      console.log(prefix, message, meta);
    } else {
      console.log(prefix, message);
    }
  },
  time(label: string, message: string): () => void {
    if (!DEBUG) return () => {};
    const start = performance.now();
    console.log(`[${label}] ⏱ ${message} START`);
    return () => {
      console.log(`[${label}] ⏱ ${message} END — ${(performance.now() - start).toFixed(1)}ms`);
    };
  },
};
