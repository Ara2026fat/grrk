export function diffRecords<T extends Record<string, unknown>>(
  before: T | undefined,
  after: T
): Record<string, { before: unknown; after: unknown }> {
  const diff: Record<string, { before: unknown; after: unknown }> = {};
  const keys = new Set([...Object.keys(before ?? {}), ...Object.keys(after)]);
  for (const key of keys) {
    const beforeVal = before?.[key];
    const afterVal = after[key];
    if (JSON.stringify(beforeVal) !== JSON.stringify(afterVal)) {
      diff[key] = { before: beforeVal, after: afterVal };
    }
  }
  return diff;
}
