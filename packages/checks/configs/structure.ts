/**
 * Structure check config. Filled by `/constitution` for this app's folder rules.
 *
 * Hello compute first example is planned at `packages/shaderscript`. Do not add a
 * shape that matches that path until the package exists — unmatched required
 * shapes fail the scanner. The week the package lands, add a shape for it
 * (checker + compiler + runner + harness next to the package) and keep
 * lsp / vite-plugin / host / database packages out until those ships start.
 */

/**
 * One folder rule: each matched directory must contain the required files
 * and must not contain other files listed as forbidden.
 */
export interface ShapeRule {
  readonly id: string;
  /** Glob relative to the app root, e.g. `src/modules/*`. */
  readonly match: string;
  /** File names that must exist inside each match. */
  readonly requiredFiles: readonly string[];
  /** File names that must not exist inside each match. */
  readonly forbiddenFiles?: readonly string[];
}

/**
 * Full structure scanner config.
 */
export interface StructureConfig {
  readonly shapes: readonly ShapeRule[];
}

/**
 * No folder rules until `packages/shaderscript` exists. Empty shapes are healthy.
 */
export const structureConfig: StructureConfig = {
  shapes: [],
};
