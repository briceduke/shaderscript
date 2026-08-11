# Task 6: Implement harness spine (checklist, CPU ref, GPU lanes, twin)

**Depends on:** 2, 3, 4, 5
**Spec:** .ai/specs/2026-08-10-hello-compute.md § Behavior › Harness; Proof plan; Scene
**Plan:** .ai/plans/2026-08-10-hello-compute.md
**Lessons tags:** product, platform, process

**Files:**
- Modify: `packages/shaderscript/harness/checklist.ts`
- Create: `packages/shaderscript/harness/cpu-ref.ts`, `harness/run.ts` (lane orchestration + coverage report only — no second test-runner layer beside `bun test`)
- Create: `packages/shaderscript/fixtures/twins/hello-add.wgsl`
- Create: `packages/shaderscript/test/harness/device-free.test.ts`, `test/harness/gpu.test.ts`
- Copy from: N/A — minting harness first example
- Do not reimplement compiler inside harness; do not edit CI/AGENTS (Task 7)

**Steps:**
1. Checklist row `hello-add-f32`; real `coveragePercent()`.
2. CPU ref `out[i]=a[i]+b[i]`.
3. Device-free: golden via compile+normalize; CPU ref proof; coverage string/assert.
4. GPU file: `SHADERSCRIPT_EXPECT_GPU=1` + no device → fail. Env unset + no device → skip + unverifiable (suite still green). Device present: exact f32 vs CPU; time emit vs twin; output must not claim `optimized`.
5. Twin: same algorithm, `@workgroup_size(64)`. Replace Task 1 harness placeholders.
6. Wrong-results micro-test: comparing unequal arrays must fail the assert helper.

**Verify:**
```bash
bun run test:compile
bun run test:harness
# Expected: device-free green; GPU skip/unverifiable or pass; coverage reported; no optimized claim
```

**Out of scope:** CI; ULP; extra checklist features.

**Escape hatches:** If Group B API broken, STOP. Expected-GPU missing device must fail, not skip.
