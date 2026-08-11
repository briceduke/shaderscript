import type { SubsetDiagnostic } from "./checker.ts";
import { checkSource } from "./checker.ts";

/**
 * Result of compile: WGSL on success, diagnostics on failure.
 */
export type CompileResult =
  | { readonly ok: true; readonly wgsl: string }
  | { readonly ok: false; readonly diagnostics: readonly SubsetDiagnostic[] };

/**
 * Checks then emits WGSL for a kernel source string.
 * @param source - TypeScript source text.
 * @param fileName - Optional path for diagnostics.
 * @returns Compile result.
 */
export function compileKernelSource(
  source: string,
  fileName?: string,
): CompileResult {
  const checked = checkSource(source, fileName);
  if (!checked.ok) {
    return { ok: false, diagnostics: checked.diagnostics };
  }
  return {
    ok: false,
    diagnostics: [{ message: "not implemented" }],
  };
}
