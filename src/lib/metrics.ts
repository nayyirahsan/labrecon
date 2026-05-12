const counters = new Map<string, number>();

export function increment(metric: string): void {
  counters.set(metric, (counters.get(metric) ?? 0) + 1);
}

export function getCounter(metric: string): number {
  return counters.get(metric) ?? 0;
}
