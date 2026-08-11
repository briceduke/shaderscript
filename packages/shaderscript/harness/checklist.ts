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
export const checklist: readonly ChecklistRow[] = [
  { id: "hello-add-f32", covered: true },
];

/**
 * Percent of checklist rows marked covered.
 * @returns Coverage percent 0–100.
 */
export function coveragePercent(): number {
  if (checklist.length === 0) {
    return 0;
  }
  const coveredCount = checklist.filter((row) => row.covered).length;
  return (coveredCount / checklist.length) * 100;
}
