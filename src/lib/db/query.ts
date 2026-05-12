export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 8000,
  fallback: T
): Promise<T> {
  const timeout = new Promise<T>((resolve) =>
    setTimeout(() => resolve(fallback), timeoutMs)
  )
  return Promise.race([promise, timeout])
}
