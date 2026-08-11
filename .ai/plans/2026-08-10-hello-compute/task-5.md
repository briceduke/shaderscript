# Task 5: Implement thin WebGPU runner and no-device throw

**Depends on:** 1
**Spec:** .ai/specs/2026-08-10-hello-compute.md § Behavior › Runner; Client / platform contract
**Plan:** .ai/plans/2026-08-10-hello-compute.md (Locked module API)
**Lessons tags:** platform, process

**Files:**
- Modify: `packages/shaderscript/src/runner.ts`
- Create: `packages/shaderscript/test/compile/runner-no-device.test.ts`
- Copy from: N/A — first runner
- Do not edit: checker, compiler, harness, `src/index.ts`

**Steps:**
1. `requestDeviceOrThrowAsync`: throw clearly if missing `navigator.gpu`, null adapter, or device failure. No CPU fallback.
2. `runComputeReadbackAsync`: STORAGE buffers; bind group 0 order; pipeline; dispatch `ceil(outputLength/64)`; MAP_READ staging; return Float32Array.
3. Test: missing gpu → throw from `requestDeviceOrThrowAsync`.
4. If stubbing gpu is impossible, injectable `getGpu?: () => GPU` seam only — still no CPU fallback.

**Verify:**
```bash
bun test packages/shaderscript/test/compile/runner-no-device.test.ts
# Expected: throw assertion passes without a device
```

**Out of scope:** Harness policy; compiler; thick host API.

**Escape hatches:** Do not invent CPU fallback. Workgroup dispatch divisor stays 64.
