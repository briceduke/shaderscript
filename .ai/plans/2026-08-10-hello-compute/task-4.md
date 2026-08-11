# Task 4: Implement WGSL emit, golden fixture, and compile tests

**Depends on:** 2, 3
**Spec:** .ai/specs/2026-08-10-hello-compute.md § Behavior › Check → emit; Host WGSL / workgroup / emit proof
**Plan:** .ai/plans/2026-08-10-hello-compute.md (Locked module API)
**Lessons tags:** product, platform, process

**Files:**
- Modify: `packages/shaderscript/src/compiler.ts`
- Create: `packages/shaderscript/fixtures/golden/hello-add.wgsl`
- Create: `packages/shaderscript/test/compile/compile.test.ts`
- Copy from: N/A — first compiler; golden = spec host shape
- Do not edit: checker, runner, harness, `src/index.ts`; do not bypass the checker (import `checkSource` only)

**Steps:**
1. `compileKernelSource`: call `checkSource`; on fail return diagnostics, no wgsl.
2. Emit: `@workgroup_size(64)`; bindings 0/1 read, 2 read_write `array<f32>`; `global_invocation_id.x`; bounds guard; add.
3. Golden file (normalize-friendly):

```wgsl
@group(0) @binding(0) var<storage, read> a : array<f32>;
@group(0) @binding(1) var<storage, read> b : array<f32>;
@group(0) @binding(2) var<storage, read_write> out : array<f32>;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
  let i = global_id.x;
  if (i >= arrayLength(&a)) {
    return;
  }
  out[i] = a[i] + b[i];
}
```

4. Tests: compile hello-add → `ok: true` and `normalizeWgsl(wgsl)` matches `normalizeWgsl(golden)`; reject → `ok: false` with no `wgsl` field; binding order 0,1,2.

**Verify:**
```bash
bun test packages/shaderscript/test/compile/compile.test.ts
# Expected: golden match; reject has no wgsl
```

**Out of scope:** Dispatch; timing/twin; workgroup ≠ 64.

**Escape hatches:** If checker API drifts, STOP and align — do not skip check. If golden needs dialect, STOP.
