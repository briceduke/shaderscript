/**
 * Structure check config. Filled by `/constitution` for this app's folder rules.
 *
 * Hello compute first example lives at `packages/shaderscript`. Keep
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
 * Spine shape for the hello-compute first example package.
 */
export const structureConfig: StructureConfig = {
  shapes: [
    {
      id: "shaderscript-spine",
      match: "packages/shaderscript",
      requiredFiles: [
        "src/checker.ts",
        "src/compiler.ts",
        "src/runner.ts",
        "src/idioms.ts",
        "harness/checklist.ts",
      ],
    },
  ],
};
