/**
 * One harness feature row.
 */
export interface ChecklistRow {
  readonly id: string;
  readonly covered: boolean;
}

/**
 * Fixed WGSL feature checklist for harness coverage.
 */
export const checklist: readonly ChecklistRow[] = [];

/**
 * Percent of checklist rows marked covered.
 * @returns Coverage percent 0–100.
 */
export function coveragePercent(): number {
  return 0;
}
