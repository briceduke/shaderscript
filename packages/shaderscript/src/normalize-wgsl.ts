/**
 * Trims and collapses whitespace so golden WGSL compares are stable.
 * @param wgsl - Raw WGSL text.
 * @returns Normalized WGSL.
 */
export function normalizeWgsl(wgsl: string): string {
  return wgsl.trim().replace(/\s+/g, " ");
}
