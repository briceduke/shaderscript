# Task 2: Land idioms and hello-add kernel fixture

**Depends on:** 1
**Spec:** .ai/specs/2026-08-10-hello-compute.md § Behavior › Authoring
**Plan:** .ai/plans/2026-08-10-hello-compute.md (Locked module API)
**Lessons tags:** product, platform

**Files:**
- Modify: `packages/shaderscript/src/idioms.ts`
- Create: `packages/shaderscript/fixtures/kernels/hello-add.ts`
- Copy from: N/A — first kernel fixture (match README/spec shape)
- Do not edit: `src/index.ts`, checker, compiler, runner, harness

**Steps:**
1. Fill idioms per Locked module API.
2. Write hello-add fixture:

```ts
import { type StorageF32, globalId } from "../../src/idioms.ts";

export function add(a: StorageF32, b: StorageF32, out: StorageF32): void {
  "use gpu";
  const i = globalId.x;
  if (i >= a.length) {
    return;
  }
  out[i] = a[i] + b[i];
}
```

3. `StorageF32` is the locked interface: readonly `length`, writable index signature (kernels write `out[i]`). No brand type, no schema DSL.

**Verify:**
```bash
bunx tsc --noEmit -p packages/shaderscript/tsconfig.json
# Expected: exit 0 — Task 1's tsconfig includes `fixtures/**`, so this run really checks the fixture
```

**Out of scope:** Checker/compiler/harness/barrel.

**Escape hatches:** If dialect syntax is required, STOP. If Task 1 missing, STOP.
