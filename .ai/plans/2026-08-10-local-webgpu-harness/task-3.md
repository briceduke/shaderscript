# Task 3: Prove device-free gates and leave Windows GPU for smoke

**Depends on:** 1, 2
**Spec:** .ai/specs/2026-08-10-local-webgpu-harness.md § Acceptance criteria (device-free, EXPECT fail, no new packages, CI unchanged, GPU correctness/timing); § Proof plan
**Plan:** .ai/plans/2026-08-10-local-webgpu-harness.md
**Files:**
- Modify: none required for green device-free proof
- Create: none
- Copy from (first example): N/A — proof only against `packages/shaderscript` harness

**Steps:**
1. Confirm `packages/shaderscript/package.json` lists `bun-webgpu` under `devDependencies` only and `test:harness` uses `--preload ./harness/webgpu-preload.ts`.
2. Confirm no new directory under `packages/` (still no `packages/host`).
3. Confirm `.github/workflows/ci.yml` still runs structure + `test:compile` + `test:harness` with **no** `SHADERSCRIPT_EXPECT_GPU` and no new GPU job — do not edit CI in this task.
4. Run the Verify commands below. Record whether GPU lane skipped (unverifiable) or ran.
5. Windows leave-draft smoke (human / local): follow README — download Dawn artifacts if needed, then `SHADERSCRIPT_EXPECT_GPU=1 bun run test:harness`. Note adapter class from harness log. Software-only → correctness may clear; timing stays caveated. If Dawn fails on Windows, STOP and report for escape hatch (npm `webgpu` → thin Chromium) — do not invent `packages/host`.
6. If this agent cannot run GPU prove on Windows hardware, mark GPU ACs **unverifiable** in the done report; do not claim leave-draft cleared.

**Verify:**
```powershell
bun run checks:structure
# Expected: exit 0

bun run test:compile
# Expected: exit 0

bun run test:harness
# Expected: exit 0; GPU lane skip+unverifiable soft-fail OK, or GPU pass if device already present

Select-String -Path .github/workflows/ci.yml -Pattern "SHADERSCRIPT_EXPECT_GPU|SwiftShader|Lavapipe"
# Expected: no matches that enable a GPU expect or software-GPU CI job (file stays device-free)

# Optional local (artifacts present):
$env:SHADERSCRIPT_EXPECT_GPU = "1"; bun run test:harness; Remove-Item Env:SHADERSCRIPT_EXPECT_GPU
# Expected: exact f32 hello-add pass; timing gap line without "optimized"; adapter class logged
```

**Out of scope:**
- Rewriting runner, checker, compiler, or checklist coverage
- Adding CI GPU
- Publishing or promoting `bun-webgpu` to runtime `dependencies`

**Escape hatches:**
- If device-free `test:harness` fails because preload throws instead of soft-failing, STOP and return to Task 1 — do not weaken EXPECT_GPU.
- If Windows Dawn door fails, STOP and report for spec escape order; leave draft with blocker named rather than fake green.
- Treat GPU correctness/timing as unverifiable until the human smoke script in the spec Proof plan has been run on this Windows machine (or escape hatch proved).
