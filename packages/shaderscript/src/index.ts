export type { StorageF32, GlobalId } from "./idioms.ts";

export type { SubsetDiagnostic, CheckResult } from "./checker.ts";
export { checkSource } from "./checker.ts";

export type { CompileResult } from "./compiler.ts";
export { compileKernelSource } from "./compiler.ts";

export type {
  RequestDeviceOptions,
  RunComputeReadbackOptions,
} from "./runner.ts";
export {
  requestDeviceOrThrowAsync,
  runComputeReadbackAsync,
} from "./runner.ts";

export { normalizeWgsl } from "./normalize-wgsl.ts";

export type { ChecklistRow } from "../harness/checklist.ts";
export { checklist, coveragePercent } from "../harness/checklist.ts";
