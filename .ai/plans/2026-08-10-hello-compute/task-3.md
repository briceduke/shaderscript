# Task 3: Implement subset checker and reject tests

**Depends on:** 1
**Spec:** .ai/specs/2026-08-10-hello-compute.md § Behavior › Check → emit; Scene Fail 1
**Plan:** .ai/plans/2026-08-10-hello-compute.md (Locked module API)
**Lessons tags:** product, platform

**Files:**
- Modify: `packages/shaderscript/src/checker.ts`
- Create: `packages/shaderscript/test/compile/checker.test.ts`
- Create: `packages/shaderscript/fixtures/kernels/reject-no-use-gpu.ts`
- Create: `packages/shaderscript/fixtures/kernels/reject-unsupported.ts`
- Copy from: N/A — first checker
- Do not edit: compiler emit, runner, harness, `src/index.ts`

**Steps:**
1. `checkSource` via TypeScript compiler API only (no SWC).
2. Find functions with body directive `'use gpu'`.
3. Hello-add subset: three `StorageF32` params, `globalId.x`, `.length` bounds, indexed read/write, `+`, early return. Reject else with clear diagnostics. No emit.
4. Tests: hello-add → `ok: true`; both rejects → `ok: false` with messages.
5. Delete Task 1's placeholder test in `test/compile/` (mandatory).

**Verify:**
```bash
bun test packages/shaderscript/test/compile/checker.test.ts
# Expected: pass; ≥1 accept and 2 reject cases
```

**Out of scope:** WGSL emit; runner; harness. Do not edit `fixtures/kernels/hello-add.ts` — fix the checker, not the kernel (unless its import path breaks).

**Escape hatches:** If non-TS syntax needed, STOP. If `typescript` dep missing, STOP.
