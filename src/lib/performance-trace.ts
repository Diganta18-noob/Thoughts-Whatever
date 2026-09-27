import { randomUUID } from 'node:crypto';

type Measure = <T>(stage: string, task: () => PromiseLike<T>) => Promise<T>;

/** Server-only, opt-in diagnostics. Labels must be constants, never user input.
 * Durations include pool/network/driver time; they are NOT SQL execution time.
 * Overlapping stages must not be added together. On failure, other in-flight
 * stages may be absent; this does not cancel or delay the original operation.
 */
export async function traceServerOperation<T>(
  operation: string,
  task: (measure: Measure) => Promise<T>,
): Promise<T> {
  if (process.env.PERFORMANCE_TRACE !== '1') {
    return task(async (_stage, run) => run());
  }
  const started = performance.now();
  const traceId = randomUUID();
  const stages: Array<{stage: string; durationMs: number; status: string}> = [];
  let status = 'ok';
  const measure: Measure = async (stage, run) => {
    const start = performance.now();
    let outcome = 'ok';
    try { return await run(); }
    catch (error) { outcome = 'error'; throw error; }
    finally { stages.push({stage, durationMs: performance.now() - start, status: outcome}); }
  };
  try { return await task(measure); }
  catch (error) { status = 'error'; throw error; }
  finally {
    console.info('[performance]', JSON.stringify({
      traceId, operation, status, durationMs: performance.now() - started, stages,
    }));
  }
}
