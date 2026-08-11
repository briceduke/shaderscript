# Hello Compute Research

## Summary

Survey of how peers handle a minimal TypeScript/JS → WGSL → WebGPU compute path (element-wise float add / hello compute), plus the WebGPU host contract. Strong tools keep **validate before emit**, express GPU kernels as **real language** (or explicit WGSL templates) rather than a new dialect, and split **device-free** tests (parse/check/golden emit) from **device-required** correctness and timing. TypeGPU is the closest product peer (`'use gpu'` + real TS). Slang and Naga show the compiler seam. Dawn/wgpu/CTS show the harness and CI split. Slice 1 should copy that spine: subset check → WGSL emit → thin runner → CPU-ref harness, with GPU bars local until headless WebGPU exists.

## Sources surveyed

- **TypeGPU (Software Mansion)** — Closest TS → WGSL product; `'use gpu'`, resolve, compute pipelines, buffers
- **WebGPU / WGSL specs + MDN** — Official host and shader contract for storage-buffer compute and readback
- **Slang** — Higher-level shader language → WGSL; validate vs legalize vs emit
- **Naga (wgpu)** — IR validate → back-end emit; golden snapshots; one-crate layout
- **wgpu / Dawn / WebGPU CTS** — Device-free vs GPU tests, CI skip/software adapters, coverage tracking
- **rust-gpu (brief)** — Peer compiletest + difftest pattern (SPIR-V, not WGSL today)

## Shared patterns

### 1. Validate (or subset-check) before target emit
- **Naga**: `front` → `Module` → `valid::Validator` → `back` (WGSL writer needs validated `ModuleInfo`)
- **Slang**: Front-end semantic check is target-agnostic; then IR, target legalize (e.g. WGSL), then emit
- **TypeGPU**: Subset enforced by plugin/eslint (`typegpu/no-unsupported-syntax`); resolve emits WGSL from allowed JS/TS
- **Why it is common**: Bad input must fail with clear errors before a broken shader hits the device

### 2. Real host language for kernels, not a custom dialect
- **TypeGPU**: Real TypeScript/JS with `'use gpu'` in the function body; optional WGSL tagged templates as escape hatch
- **Slang / Naga**: Own languages or IR, but not “TypeScript-like” invented syntax pretending to be TS
- **Why it is common**: Authors stay in one toolchain; escape hatches are explicit (raw WGSL / templates), not new grammar

### 3. Thin compute path: storage buffers → bind → dispatch → readback
- **WebGPU/MDN**: STORAGE buffers, bind group matching `@group/@binding`, `@compute @workgroup_size`, `dispatchWorkgroups`, staging `MAP_READ` + `mapAsync`
- **TypeGPU**: `createMutable` / storage schemas, `createGuardedComputePipeline` + `dispatchThreads` (or workgroups), `.read()`
- **Why it is common**: Element-wise ops map cleanly to storage arrays + global invocation id + bounds guard

### 4. Split device-free proof from device-required proof
- **wgpu**: validation/compile/noop vs `wgpu-gpu`; software adapters in CI where possible
- **TypeGPU**: Default CI Vitest without browser; browser/GPU tests separate
- **Dawn/CTS**: Unit/Tint vs e2e/CTS; skip or SwiftShader when no real GPU
- **Why it is common**: Adapter availability is not guaranteed; spine must stay green without a device

### 5. Correctness via reference + golden emit; timing is a separate bar
- **Naga**: Snapshot golden I/O; external validators on emit; does not run shaders for numeric proof
- **CTS**: Normative operation tests; FP via ULP/intervals, not naive equality alone
- **Dawn**: Separate `dawn_perf_tests` metrics; TypeGPU exposes timestamp queries as an app tool, not CI gate
- **Why it is common**: Emit validity ≠ numeric GPU truth ≠ performance vs hand WGSL; peers keep them distinct

## Answers to research questions

1. **How do strong TS/JS→WGSL tools structure parse → check → emit?** — TypeGPU: bundler extracts AST → tinyest metadata → runtime `tgpu.resolve` WGSL; eslint subset rules. Naga/Slang: front → IR → validate/legalize → back. Shared rule: check before emit (TypeGPU docs; Naga `valid`; Slang compiling guide).

2. **How do they express kernels, buffers, and dispatch without inventing dialect syntax?** — TypeGPU uses real TS/JS + `'use gpu'`, typed schemas (`d.arrayOf`), and library APIs for buffers/pipelines; raw WGSL only via templates/interop. WebGPU host uses standard buffer usages and bind groups (MDN / WebGPU spec).

3. **What harness patterns prove correctness vs reference?** — Peers combine: (a) golden/snapshot WGSL or IR (Naga, Slang FileCheck), (b) CPU or interval reference for numeric ops (CTS FP guidance), (c) GPU readback compare when a device exists. TypeGPU docs show `.read()` after dispatch; no published fixed WGSL-feature coverage checklist like our product goal.

4. **How do they handle CI without GPU vs local GPU prove?** — Always run parse/validate/unit without a device (wgpu, TypeGPU `!browser`, Dawn unittests). GPU suites skip, use software adapters (SwiftShader/lavapipe/WARP), or run on dedicated bots. Matches our architecture: subset+compile in CI; GPU correctness/timing local or unverifiable until headless WebGPU.

5. **What terms should we adopt?** — Prefer industry terms: **kernel** / compute **entry point**, **WGSL module**, **storage** buffer, **bind group** / **binding**, **workgroup size**, **dispatch workgroups**, **readback** / staging map, **subset** (or validation), **resolve/emit**. TypeGPU’s `'use gpu'` matches our later DX name; keep it deferred for MVP per architecture.

6. **What WGSL/WebGPU shape is standard for element-wise float add?** — Three `array<f32>` storage bindings (two read, one read_write) or equivalent; `@compute @workgroup_size(N)`; index by `@builtin(global_invocation_id).x`; early-out if `gid.x >= n`; host `dispatchWorkgroups(ceil(n/N))`; copy to MAP_READ staging for compare (WGSL/WebGPU specs, MDN).

## Source-specific notes

### TypeGPU
- Closest product shape to Shaderscript: real TS + `'use gpu'` + subset lint + WGSL emit.
- Product surface is thicker than our MVP (root, schemas, guarded pipelines, unplugin). Copy the **authoring claim** and **CI split**, not the full host API on day one.
- Escape hatch: WGSL tagged templates / raw modules via `resolve` — aligns with our later “WGSL escape hatch,” not slice 1.

### WebGPU / WGSL (platform)
- Failure modes to name in grill/spec: missing `navigator.gpu`, null adapter, wrong buffer usages (STORAGE not mappable), `mapAsync` alignment/usage errors, workgroup size vs device limits, OOB without bounds guard.
- Automated without GPU: CPU reference for `out[i]=a[i]+b[i]`, emit string shape, dispatch math (`ceil(n/wg)`), subset reject cases.
- Needs device: pipeline validation, GPU vs CPU numeric match, timing vs hand-WGSL twin.

### Slang / Naga
- Hard seam **validate → emit** is the pattern to copy inside one package (checker then compiler), matching our “one package until second consumer.”
- Golden WGSL snapshots are cheap CI proof alongside subset tests; runtime GPU bars stay separate.
- Neither claims “matches hand-optimized WGSL” as a gate; measuring the gap (our product bar) is a differentiator, not industry default.

### wgpu / Dawn / CTS
- Coverage tracking that works: explicit checklist or plan with unimplemented markers (CTS `.unimplemented()` / TODOs) — supports our fixed WGSL feature checklist mapped 1:1 to tests.
- Perf harnesses exist (Dawn trials, wgpu Criterion smoke) but are not the same suite as correctness.
- Software WebGPU in CI is optional later; slice 1 can flag GPU bars unverifiable without blocking the spine.

## Recommended approach for this app

1. **Keep the architecture spine** — Hello compute = element-wise float add through subset check → WGSL emit → thin runner → harness (CPU ref + required hand-WGSL twin timing on local GPU). Follows TypeGPU’s end-to-end path and WebGPU’s storage-buffer contract; `'use gpu'` as AST marker only (no Vite/Next plugins in slice 1).
2. **Checker before emitter in one package** — Copy Naga/Slang’s validate-before-emit seam as modules inside `packages/shaderscript`, not as extra packages (Raptor / constitution).
3. **Prove in three lanes** — (a) Device-free: subset rejects, golden or snapshot WGSL for the add kernel, CPU reference function. (b) Device-required: GPU readback vs CPU. (c) Timing vs hand WGSL recorded, not claimed “optimized.” Matches wgpu/TypeGPU/Dawn split and our product bars.
4. **Standard WGSL/host shape** — Storage `array<f32>`, fixed workgroup size within default limits, bounds guard, staging readback. Document the failure modes from the platform note in grill/spec Scene + Client (or harness) contract.
5. **Defer TypeGPU-thick DX** — Schemas-as-product, unplugin, guarded dispatch helpers, and `'use gpu'` wait for later slices; MVP runner stays thin.
6. **Adopt peer terms** — Prefer entry point, bind group, workgroup, readback, subset over invented jargon; keep **harness** and **coverage percent** as our proof vocabulary (CTS-style checklist honesty).

## Grill decisions

Write-back home for `/grill` on this research. Spec will copy checked answers into Open Questions.

### Already settled (no ask)

- [x] First kernel — **Answer:** Element-wise float add (`out[i] = a[i] + b[i]`). Source: architecture Settled decisions; product MVP scene.
- [x] Package layout — **Answer:** One package `packages/shaderscript` (checker + compiler + thin runner); harness beside it. No `lsp` / `vite-plugin` / `host` packages in this slice.
- [x] CI vs GPU prove — **Answer:** Subset + compile always in CI; GPU correctness/timing local or flagged unverifiable until headless WebGPU exists. Do not block the spine on CI GPU.
- [x] Defer thick DX — **Answer:** No Vite/Next plugins, no unplugin, no schemas-as-product, no shipped WGSL escape hatch in slice 1. Runner stays thin. Hand WGSL only as harness baseline twin. `'use gpu'` **marker** is in scope (see below); app-build plumbing is not.
- [x] Compiler seam — **Answer:** Subset check before WGSL emit, as modules inside one package (Naga/Slang pattern).
- [x] Host WGSL shape — **Answer:** Three `array<f32>` storage bindings (two read, one read_write), `@compute` + bounds guard on `global_invocation_id.x`, dispatch `ceil(n / workgroupSize)`, staging `MAP_READ` readback.
- [x] Proof lanes — **Answer:** (a) device-free subset rejects + emit proof + CPU ref; (b) device-required GPU vs CPU; (c) timing vs hand WGSL recorded, not claimed optimized.
- [x] Terms — **Answer:** Prefer kernel / entry point, WGSL module, storage, bind group, workgroup, dispatch, readback, subset, harness, coverage percent.
- [x] Symmetric ops — **Answer:** N/A (no list↔unlist-style pair).
- [x] Transition honesty — **Answer:** N/A (no economy / persisted state migration).
- [x] MVP entry convention — **Answer:** `'use gpu'` as **AST entry marker only** (string directive in the kernel function body). Checker/compiler find marked functions via parse; no Vite/Next plugin in this slice. No temporary export-name-only convention.
- [x] AST / parse toolchain — **Answer:** TypeScript compiler API only for parse + subset check + emit input. No SWC in slice 1 (and not as subset source of truth later).
- [x] Kernel params / buffers — **Answer:** Option A — three storage-array params in declaration order map to `@group(0)` bindings 0, 1, 2; tiny library types (`StorageF32`, `globalId`, length/bounds). Ordinary TypeScript types from `shaderscript`, not a schema DSL. Accept tradeoffs vs TypeGPU-style layouts: positional bindings, thinner mutability story, workgroup/pipeline knobs on runner/compile options for now.
- [x] Scene — **Answer:**
  - **Happy path:** Author writes a real `.ts` kernel with `'use gpu'` and three `StorageF32` params → checker accepts → compiler emits WGSL → runner binds/dispatches/readback → harness matches CPU `out[i]=a[i]+b[i]`, marks checklist row, records timing vs hand-WGSL twin when that bar runs.
  - **Fail 1 — Out of subset:** Clear subset errors; no WGSL; no GPU run.
  - **Fail 2 — No WebGPU / no adapter:** Loud failure or harness marks GPU bar unverifiable (see client contract); device-free tests still pass.
  - **Fail 3 — Wrong results:** GPU readback ≠ CPU ref → harness fails; that run does not count as proved for coverage/timing.
- [x] WebGPU client contract (no device) — **Answer:** Runner throws loud if dispatch/readback is requested without gpu/adapter/device (no CPU fallback). Harness with no device (CI): device-free tests must pass; GPU correctness/timing skip and report **unverifiable**. Harness when a device is expected (local GPU prove): missing device **fails**.
- [x] Emit proof shape — **Answer:** Golden snapshot of **normalized** WGSL for the hello-add kernel (one fixture file), plus subset-reject / light structural tests. Normalize whitespace before compare.
- [x] Workgroup size — **Answer:** Slice 1 hello-add (emit, twin, golden, dispatch) uses fixed `@workgroup_size(64)`. Target/100% WGSL: author-controlled per entry point (1D/2D/3D as WGSL allows); not a global product constant. Device limits still apply at run time.
- [x] Float compare — **Answer:** Exact f32 equality (bit-identical after readback) for hello-add vs CPU, with finite fixture inputs. ULP/interval helpers when a later checklist feature needs them — not a fuzzy default for add.
- [x] Hand-WGSL twin — **Answer:** **Required** for hello-add in slice 1 (same algorithm, `@workgroup_size(64)`). Local GPU harness times compiled emit vs twin and records the gap; no “optimized” claim. Device-free CI does not run timing. Correctness stays CPU-ref (twin not required for numeric proof of add).

### Open (grilling)

None. Ready for `/spec-writing`.

### Fixed heuristics

- [x] Scene — recorded above
- [x] Symmetric ops — N/A
- [x] Platform / client contract — WebGPU no-device contract recorded above
- [x] Transition honesty — N/A

## Sources

- https://docs.swmansion.com/TypeGPU/
- https://docs.swmansion.com/TypeGPU/apis/functions/
- https://docs.swmansion.com/TypeGPU/fundamentals/compute-shaders/
- https://docs.swmansion.com/TypeGPU/fundamentals/pipelines/
- https://docs.swmansion.com/TypeGPU/apis/resolve
- https://docs.swmansion.com/TypeGPU/tooling/unplugin-typegpu
- https://github.com/software-mansion/TypeGPU
- https://github.com/software-mansion/TypeGPU/blob/main/packages/eslint-plugin/docs/rules/no-unsupported-syntax.md
- https://gpuweb.github.io/gpuweb/
- https://gpuweb.github.io/gpuweb/wgsl/
- https://www.w3.org/TR/webgpu/
- https://www.w3.org/TR/WGSL/
- https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API
- https://developer.mozilla.org/en-US/docs/Web/API/GPUComputePassEncoder/dispatchWorkgroups
- https://developer.mozilla.org/en-US/docs/Web/API/GPUBuffer/mapAsync
- https://webgpu.github.io/webgpu-samples/
- https://shader-slang.org/slang/user-guide/compiling
- https://github.com/shader-slang/slang/blob/master/docs/design/overview.md
- https://docs.rs/naga/latest/naga/
- https://docs.rs/naga/latest/naga/valid/index.html
- https://github.com/gfx-rs/wgpu/blob/trunk/docs/testing.md
- https://github.com/gpuweb/cts/blob/main/docs/intro/README.md
- https://github.com/gpuweb/cts/blob/main/docs/intro/plans.md
- https://dawn.googlesource.com/dawn/+/HEAD/docs/dawn/infra.md
- https://dawn.googlesource.com/dawn/+/refs/heads/main/docs/dawn/testing.md
- https://github.com/rust-gpu/rust-gpu/blob/main/docs/src/testing.md
