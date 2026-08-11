# Task 1: Add bun-webgpu preload and wire harness

**Depends on:** none
**Spec:** .ai/specs/2026-08-10-local-webgpu-harness.md § Acceptance criteria (devDependency, preload soft-fail, EXPECT contract unchanged); § Behavior Bootstrap; § Design decisions Primary Dawn door
**Plan:** .ai/plans/2026-08-10-local-webgpu-harness.md (Locked preload contract)
**Files:**
- Create: `packages/shaderscript/harness/webgpu-preload.ts`
- Modify: `packages/shaderscript/package.json` — add `bun-webgpu` under `devDependencies`; set `test:harness` to the Locked preload contract script
- Modify: `packages/shaderscript/harness/run.ts` — when acquire succeeds, log one adapter-class line (fallback/software vs non-fallback) if the adapter exposes it; do not change skip/fail or throw paths
- Copy from (first example): N/A — harness infra beside existing `packages/shaderscript/harness/run.ts` (Hello compute first example)

**Steps:**
1. From repo root run `bun add -d bun-webgpu --cwd packages/shaderscript` (or edit `devDependencies` then `bun install`). Confirm `bun-webgpu` is not under `dependencies`.
2. Create `harness/webgpu-preload.ts` per Locked preload contract: call `setupGlobals()` from `bun-webgpu`; soft-fail with `console.log(\`webgpu preload soft-fail: ${reason}\`)`; never throw; invoke install on module load.
3. Set `"test:harness": "bun test --preload ./harness/webgpu-preload.ts ./test/harness"`.
4. In `tryAcquireDeviceAsync` (or the acquire path it uses), when a device is obtained, log adapter class for leave-draft honesty. Do not rewrite `expectsGpu`, skip messages, or `src/runner.ts` public API.
5. Do not edit `README.md`, `.github/workflows/ci.yml`, or add any new package under `packages/`.

**Verify:**
```powershell
bun run test:harness
# Expected: exit 0; device-free tests pass; GPU lane either runs or prints unverifiable skip (and soft-fail log if Dawn/artifacts missing)

$env:SHADERSCRIPT_EXPECT_GPU = "1"; bun run test:harness; Remove-Item Env:SHADERSCRIPT_EXPECT_GPU
# Expected without a working device after preload: non-zero exit and loud fail mentioning SHADERSCRIPT_EXPECT_GPU / device missing
# Expected with working Dawn+adapter: hello-add exact f32 pass and a timing gap line without the word "optimized"
```

**Out of scope:**
- README / Dawn download docs (Task 2)
- CI workflow changes; Chromium smoke; npm `webgpu` escape (only if this task’s Dawn door fails — then STOP and report)

**Escape hatches:**
- If `bun-webgpu` has no `setupGlobals` export or cannot load under this Bun version, STOP and report — do not invent a host package; parent follows spec escape order.
- If artifact path after install is not `node_modules/bun-webgpu/dawn/`, STOP and report the real layout for Task 2 docs.
- If EXPECT=1 fails to fail loud when no device (soft-fail broken into a crash of the whole suite when EXPECT unset), STOP and fix soft-fail before finishing.
