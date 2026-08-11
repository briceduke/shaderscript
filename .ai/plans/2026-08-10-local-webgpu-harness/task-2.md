# Task 2: Document local Dawn setup in README

**Depends on:** none
**Spec:** .ai/specs/2026-08-10-local-webgpu-harness.md § Acceptance criteria (README / harness notes); § Behavior Human one-time setup; § Proof plan Human smoke script
**Plan:** .ai/plans/2026-08-10-local-webgpu-harness.md (Locked preload contract)
**Files:**
- Modify: `README.md` — add local WebGPU / Dawn setup next to the existing `SHADERSCRIPT_EXPECT_GPU` harness section
- Copy from (first example): N/A — docs only; mirror the tone of the existing “Try the repo today” block in `README.md`

**Steps:**
1. In `README.md`, under the existing harness / `SHADERSCRIPT_EXPECT_GPU` section, document the human one-time path:
   - `bun-webgpu` is already a package **devDependency** (after Task 1 / `bun install`).
   - Download Dawn artifacts once from repo root using the Locked preload contract command: `bun run ./node_modules/bun-webgpu/dawn/download_artifacts.ts` (note: if Task 1 reported a different on-disk path, use that path only).
   - Then PowerShell: `$env:SHADERSCRIPT_EXPECT_GPU = "1"`; `bun run test:harness`.
2. State clearly: without artifacts / without a device and EXPECT unset, GPU lane is skip + unverifiable; with EXPECT=1 and no device, harness fails loud.
3. State: software/fallback adapter may clear correctness; timing leave-draft needs a hardware adapter smoke (do not claim optimized).
4. Do not edit `packages/shaderscript/**`, CI, or AGENTS.md unless a path typo in the Locked contract forces a one-line README correction after Task 1 reports the real download path.

**Verify:**
```powershell
Select-String -Path README.md -Pattern "bun-webgpu|download_artifacts|SHADERSCRIPT_EXPECT_GPU"
# Expected: matches that cover install/devDep context, Dawn download command, and EXPECT_GPU harness run
```

**Out of scope:**
- Implementing preload or changing `package.json` (Task 1)
- Adding a CI GPU job or SwiftShader docs as a required path
- Coverage-climb “Next” rewrite beyond a short pointer if already present

**Escape hatches:**
- If Task 1 has not landed and the download path in the Locked contract is wrong on disk, write the Locked default and add a one-line note that the path must match the installed `bun-webgpu` layout — or wait for Task 1’s reported path before finishing docs.
- If README already documents EXPECT_GPU, extend that section; do not invent a second contradictory harness story.
