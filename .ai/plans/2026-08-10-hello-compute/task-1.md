# Task 1: Scaffold packages/shaderscript, structure shape, and root scripts

**Depends on:** none
**Spec:** .ai/specs/2026-08-10-hello-compute.md § Acceptance criteria (package + scripts + structure)
**Plan:** .ai/plans/2026-08-10-hello-compute.md (Locked module API)
**Lessons tags:** product, platform, process

**Files:**
- Create: `packages/shaderscript/package.json`, `tsconfig.json`, `src/index.ts` (comment only), stubs `src/idioms.ts`, `src/checker.ts`, `src/compiler.ts`, `src/runner.ts`, `harness/checklist.ts`, real `src/normalize-wgsl.ts`
- Modify: `packages/checks/configs/structure.ts` — shape `shaderscript-spine` match `packages/shaderscript`, requiredFiles: `src/checker.ts`, `src/compiler.ts`, `src/runner.ts`, `src/idioms.ts`, `harness/checklist.ts`
- Modify: root `package.json` — `test:compile`, `test:harness`
- Copy from: N/A — minting first package

**Steps:**
1. Package `@shaderscript/shaderscript`, type module; scripts `test:compile` → `bun test ./test/compile`, `test:harness` → `bun test ./test/harness`, `typecheck`. Deps: `typescript` (runtime — checker calls the compiler API). DevDeps: `@types/bun`, `@webgpu/types`.
2. tsconfig strict; ESNext + bundler resolution consistent with `packages/checks/tsconfig.json`, plus three pinned differences: `include` covers `src`, `fixtures`, `test`, `harness` (else Task 2's typecheck passes vacuously); `types: ["bun", "@webgpu/types"]` (runner needs GPU globals); `noUncheckedIndexedAccess: false` (plain kernel indexing `a[i] + b[i]`).
3. Stubs match Locked module API (main plan): `checkSource` / `compileKernelSource` return `{ ok: false, diagnostics: [{ message: "not implemented" }] }`; `requestDeviceOrThrowAsync` throws `Error("not implemented")`; `harness/checklist.ts` exports an empty checklist + `coveragePercent()` returning `0`; `src/index.ts` holds only `// exports wired in Task 7`. Implement `normalizeWgsl` for real (trim + collapse whitespace).
4. Structure shape as above. Root scripts: `"test:compile": "bun run --cwd packages/shaderscript test:compile"`, `"test:harness": "bun run --cwd packages/shaderscript test:harness"`.
5. Placeholder tests in `test/compile/` and `test/harness/` (`expect(true).toBe(true)`).

**Verify:**
```bash
bun run checks:structure
bun run test:compile
bun run test:harness
# Expected: 0 structure violations; both test scripts exit 0
```

**Out of scope:** Real checker/compiler/runner/harness; CI; AGENTS First examples.

**Escape hatches:** If `typescript`/`@webgpu/types` not approved with plan, STOP. If structure shape path fails, STOP — do not weaken scanner.
