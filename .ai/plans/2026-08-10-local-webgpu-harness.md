# Local WebGPU harness — implementation plan

**Spec:** .ai/specs/2026-08-10-local-webgpu-harness.md
**Research:** .ai/research/local-webgpu-harness.md
**Branch:** feat/local-webgpu-harness
**Status:** approved — ready for /execute (draft PR for cloud implement)
**Ordering:** slice-first — one device door (preload + wire), then docs in parallel, then scoped proof
**Lessons:** platform, product, process, plan, execute
  <!-- workers: one package; soft-fail Dawn preload; keep EXPECT_GPU; no packages/host; CI device-free; Task N card only; no commit agents -->

## Progress

Task text lives only in the linked cards. Workers read their card (plus the
Locked preload contract when their card cites it), never this file. The parent
alone edits Progress.

- [ ] Task 1: Add bun-webgpu preload and wire harness — [task-1.md](2026-08-10-local-webgpu-harness/task-1.md)
- [ ] Task 2: Document local Dawn setup in README — [task-2.md](2026-08-10-local-webgpu-harness/task-2.md)
- [ ] Task 3: Prove device-free gates and leave Windows GPU for smoke — [task-3.md](2026-08-10-local-webgpu-harness/task-3.md)

## Parallel groups

### Group A
**Depends on:** none
**Tasks:** 1, 2
**Files disjoint:** yes (`packages/shaderscript/package.json` + `harness/webgpu-preload.ts` + optional `harness/run.ts` vs root `README.md`)
**Workers:** fan out one subagent (or Multitask worker) per task; each gets only its `task-{N}.md` card

### Group B
**Depends on:** Group A
**Tasks:** 3
**Files disjoint:** n/a (single task)
**Workers:** parent agent

## Dependencies

Tasks 1 and 2 share no files and may run together against the Locked preload contract. Task 3 needs the preload wired and README steps present before final device-free proof and smoke notes.

## Locked preload contract

Do not redesign. Implement exactly:

```ts
// packages/shaderscript/harness/webgpu-preload.ts
/**
 * Soft-installs WebGPU globals for harness GPU lanes.
 * Never throws. On missing bun-webgpu / Dawn / setup failure, logs a reason
 * and leaves navigator.gpu unchanged.
 * @returns void
 */
export function installWebGpuGlobals(): void;
// Module load must call installWebGpuGlobals() (Bun --preload side effect).

// Implementation shape (exact API names):
// try { const { setupGlobals } = require("bun-webgpu") as { setupGlobals: () => void };
//       setupGlobals(); }
// catch → console.log(`webgpu preload soft-fail: ${reason}`)
// Prefer Bun-compatible sync load; if only ESM dynamic import works, top-level
// await import("bun-webgpu") inside the same soft-fail try/catch is allowed.
```

Harness script (exact):

```json
"test:harness": "bun test --preload ./harness/webgpu-preload.ts ./test/harness"
```

Dependency (exact class):

- `bun-webgpu` under `devDependencies` of `@shaderscript/shaderscript` only (not `dependencies`).

Dawn artifact download (document and use this default after root `bun install`):

```powershell
bun run ./node_modules/bun-webgpu/dawn/download_artifacts.ts
```

If the installed package layout differs, STOP and report the real path — do not invent a second download story.

Adapter honesty (Task 1, when GPU lane acquires a device): log one line that names fallback/software vs non-fallback when `adapter.isFallbackAdapter` (or equivalent) is available; do not claim timing leave-draft cleared for software-only.

## Global out of scope

- Coverage climb / WGSL checklist growth
- CI SwiftShader / Lavapipe / any GPU job in `.github/workflows/ci.yml`
- `packages/host`, `packages/lsp`, `packages/vite-plugin`, database package
- Rewriting `src/runner.ts` EXPECT semantics, exact-f32 rules, or twin timing formula
- Publishing `bun-webgpu` as a runtime dependency of the library
- Browser-first prove as the primary door (escape hatch only if Windows Dawn fails)

## Global escape hatches

- If `bun-webgpu` cannot install or `setupGlobals` cannot soft-fail cleanly under Bun on this machine, STOP and report — then follow spec escape order (npm `webgpu` under Bun → thin Chromium smoke). Do not invent `packages/host`.
- If Windows + Bun still cannot acquire a device after the escape order, leave draft with that blocker named — do not fake GPU green.
- Software-only adapter may clear correctness; timing leave-draft stays caveated until hardware smoke.
- Commit only through `/check-and-commit` after approval and `/execute`.
