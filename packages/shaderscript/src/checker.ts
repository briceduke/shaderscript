/**
 * One subset diagnostic.
 */
export interface SubsetDiagnostic {
  readonly message: string;
  readonly fileName?: string;
}

/**
 * Result of subset check.
 */
export interface CheckResult {
  readonly ok: boolean;
  readonly diagnostics: readonly SubsetDiagnostic[];
}

/**
 * Checks that source is within the Shaderscript TypeScript subset.
 * @param source - TypeScript source text.
 * @param fileName - Optional path for diagnostics.
 * @returns Check result.
 */
export function checkSource(source: string, fileName?: string): CheckResult {
  void source;
  void fileName;
  return {
    ok: false,
    diagnostics: [{ message: "not implemented" }],
  };
}
