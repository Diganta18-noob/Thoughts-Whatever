const DEBUG = process.env.NEXT_PUBLIC_DEBUG_LOADING === "true";

export const debug = {
  log(label: string, message: string, meta?: Record<string, string | number | boolean | null | undefined>) {
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
    const start = typeof performance !== "undefined" ? performance.now() : Date.now();
    console.log(`[${label}] ⏱ ${message} START`);
    return () => {
      const duration = (typeof performance !== "undefined" ? performance.now() : Date.now()) - start;
      console.log(`[${label}] ⏱ ${message} END — ${duration.toFixed(1)}ms`);
    };
  },
};
