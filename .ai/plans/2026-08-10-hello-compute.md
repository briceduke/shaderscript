# Hello compute — implementation plan

**Spec:** .ai/specs/2026-08-10-hello-compute.md
**Research:** .ai/research/hello-compute.md
**Branch:** feat/hello-compute
**Status:** executed (2026-08-10) — leave-draft; GPU bars unverifiable until human smoke
**Ordering:** shared foundation required — package + structure stubs must exist before module fill-in; then parallel by file ownership; harness and CI last
**Lessons:** product, platform, process, execute, plan
  <!-- workers: real TS only; one package; harness prove; CI subset+compile; no commit agents; Task N card only -->

## Progress

Task text lives only in the linked cards. Workers read their card (plus the
Locked module API when their card cites it), never this file. The parent alone
edits Progress.

- [x] Task 1: Scaffold packages/shaderscript, structure shape, and root scripts — [task-1.md](2026-08-10-hello-compute/task-1.md)
- [x] Task 2: Land idioms and hello-add kernel fixture — [task-2.md](2026-08-10-hello-compute/task-2.md)
- [x] Task 3: Implement subset checker and reject tests — [task-3.md](2026-08-10-hello-compute/task-3.md)
- [x] Task 4: Implement WGSL emit, golden fixture, and compile tests — [task-4.md](2026-08-10-hello-compute/task-4.md)
- [x] Task 5: Implement thin WebGPU runner and no-device throw — [task-5.md](2026-08-10-hello-compute/task-5.md)
- [x] Task 6: Implement harness spine (checklist, CPU ref, GPU lanes, twin) — [task-6.md](2026-08-10-hello-compute/task-6.md)
- [x] Task 7: Wire CI, mint First examples row, run device-free proof — [task-7.md](2026-08-10-hello-compute/task-7.md)

## Parallel groups

### Group A
**Depends on:** none
**Tasks:** 1
**Files disjoint:** n/a (single task)
**Workers:** parent agent

### Group B
**Depends on:** Group A
**Tasks:** 2, 3, 5
**Files disjoint:** yes (`idioms`+kernel fixture / `checker` / `runner`; do not edit `src/index.ts` — Task 7 owns the barrel)
**Workers:** fan out one subagent (or Multitask worker) per task; each gets only its `task-{N}.md` card

### Group C
**Depends on:** Group B
**Tasks:** 4
**Files disjoint:** n/a (single task)
**Workers:** one worker with task-4.md

### Group D
**Depends on:** Group C
**Tasks:** 6
**Files disjoint:** n/a (single task)
**Workers:** parent agent (or one worker with task-6.md)

### Group E
**Depends on:** Group D
**Tasks:** 7
**Files disjoint:** n/a (single task)
**Workers:** parent agent

## Dependencies

Task 1 blocks Group B. Tasks 2, 3, 5 have no file overlap and may run together after Task 1. Task 4 owns different files than 2 and 3, but its golden test needs Task 3's real checker to accept hello-add and Task 2's fixture on disk — with the Task 1 stub (`ok: false` always) its verify cannot pass, so Task 4 starts after 2 and 3 land. Task 6 needs 2–5. Task 7 needs 6.

## Locked module API (Group B contract)

Do not redesign. Implement exactly:

```ts
// packages/shaderscript/src/checker.ts
export interface SubsetDiagnostic {
  readonly message: string;
  readonly fileName?: string;
}
export interface CheckResult {
  readonly ok: boolean;
  readonly diagnostics: readonly SubsetDiagnostic[];
}
export function checkSource(source: string, fileName?: string): CheckResult;

// packages/shaderscript/src/compiler.ts
export type CompileResult =
  | { readonly ok: true; readonly wgsl: string }
  | { readonly ok: false; readonly diagnostics: readonly SubsetDiagnostic[] };
export function compileKernelSource(source: string, fileName?: string): CompileResult;
// Must call checkSource first. On !ok, return diagnostics and do not emit WGSL.

// packages/shaderscript/src/runner.ts
export async function requestDeviceOrThrowAsync(): Promise<GPUDevice>;
export async function runComputeReadbackAsync(options: {
  readonly device: GPUDevice;
  readonly wgsl: string;
  readonly entryPoint: string;
  readonly inputs: readonly Float32Array[];
  readonly outputLength: number;
}): Promise<Float32Array>;
// Throws if gpu/adapter/device missing when device acquisition or dispatch/readback is requested. No CPU fallback.

// packages/shaderscript/src/idioms.ts
export interface StorageF32 {
  readonly length: number;
  [index: number]: number; // writable: kernels write out[i]
}
export interface GlobalId {
  readonly x: number;
}
export declare const globalId: GlobalId;
```

## Global out of scope

- `packages/lsp`, `packages/vite-plugin`, `packages/host`, database package
- Vite/Next/unplugin `'use gpu'` plumbing
- Custom dialect syntax; SWC
- Shipped WGSL escape hatch; ULP helpers; author workgroup control
- Claiming emit matches hand-optimized WGSL
- Empty conformance/invariants/clobbers scanners

## Global escape hatches

- If plan approval did not cover adding production deps `typescript` (compiler API) and `@webgpu/types` (dev) on `packages/shaderscript`, STOP — Ask First per AGENTS.md.
- If a worker needs a second package or dialect syntax to finish, STOP and report.
- GPU correctness/timing without a local WebGPU device: mark unverifiable; do not fake green. Ship as draft PR with human smoke from the spec Proof plan if GPU bars stay unproved.
