# Hello compute

**Status:** implemented (draft PR — GPU correctness/timing need human smoke)
**Research:** [.ai/research/hello-compute.md](../research/hello-compute.md)
  (WebGPU platform failure modes and CI split live in that file; no separate platform note.)

## Problem

There is no end-to-end path yet that proves Shaderscript’s claim: real TypeScript subset → WGSL → WebGPU, with harness proof (coverage, correctness, timing). Without that spine, later DX (plugins, LSP, host API) has nothing load-bearing to hang on.

## Goals

- Ship one vertical slice: element-wise float add (`out[i] = a[i] + b[i]`) through subset check → WGSL emit → thin runner → harness.
- Author kernels as real TypeScript with `'use gpu'` as an AST entry marker in the function body.
- Prove in three lanes: device-free (subset rejects, golden emit, CPU ref), device-required GPU vs CPU, timing vs required hand-WGSL twin (record gap; no “optimized” claim).
- Land first example at `packages/shaderscript` (checker + compiler + thin runner + harness beside it).
- Keep CI green without a GPU: subset + compile always; GPU bars local or unverifiable.

## Non-goals

- Vite / Next plugins, unplugin, or app-build `'use gpu'` plumbing.
- LSP / Biome / ESLint subset productization.
- Full host/runtime API or schemas-as-product (TypeGPU-thick DX).
- Shipped WGSL escape hatch (hand WGSL only as harness twin baseline).
- Extra packages (`packages/lsp`, `packages/vite-plugin`, `packages/host`, database).
- Custom dialect syntax; SWC as parse/check source of truth.
- Complete WGSL coverage or claiming emit matches hand-optimized WGSL.
- CPU fallback when WebGPU is missing.
- Softening float compare with ULP defaults for hello-add (exact f32 only for this slice).

## Design decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Scoping / data door | None | Library/toolchain; no tenant or persisted app data (`AGENTS.md`). |
| Hard rules | Real TS only; one package; harness prove; CI subset+compile | Constitution: no dialect; no early package split; demo alone is not proof; do not block spine on CI GPU. |
| Pattern to copy | This slice *is* the Hello compute first example | AGENTS First examples: kernel → check → WGSL → run → harness. Mint the row when it ships. |
| Proof | `checks:structure` → `test:compile` (CI) → `test:harness` (GPU local / unverifiable in CI) | Matches AGENTS Validation and architecture CI split. |
| Frozen surfaces | None | `BACKWARD_COMPATIBILITY.md` empty; nothing FROZEN yet. |
| Ask first | No new packages, no dialect, no “matches hand WGSL” claim, no new prod deps without ask | Deferred thick DX and package splits stay out of this slice. |
| Out of scope | Plugins, LSP, thick host API, escape hatch, ULP helpers, author workgroup control | Research + architecture “Deliberately not building yet.” |
| Scene | Happy path + three fails (subset / no device / wrong results) | Research grill; required for new client surface. |
| Symmetric ops | N/A | No list↔unlist-style pair. |
| Client / platform | Loud runner throw without gpu/adapter/device; harness CI skip=unverifiable; local expected-GPU fail | WebGPU contract from research. |
| Transition plan | N/A | No economy or persisted state migration. |
| Unverifiable risks | GPU correctness + timing in CI without headless WebGPU | Named human smoke below; draft PR if shipped without local GPU prove. |
| First kernel | Element-wise float add | Product MVP scene; architecture settled. |
| Package layout | `packages/shaderscript` only (checker + compiler + thin runner + harness) | Raptor / constitution; second consumer before new packages. |
| Compiler seam | Subset check before WGSL emit, modules in one package | Naga/Slang pattern; no extra packages. |
| Parse toolchain | TypeScript compiler API only | No SWC in slice 1. |
| Entry marker | `'use gpu'` string directive in kernel function body | AST marker only; no plugins. |
| Kernel params / buffers | Three `StorageF32` params in declaration order → `@group(0)` bindings 0,1,2; `globalId` + length/bounds library idioms | Ordinary TS types from `shaderscript`; no schema DSL. |
| Host WGSL shape | Three `array<f32>` storage (two read, one read_write); bounds guard on `global_invocation_id.x`; dispatch `ceil(n/64)`; staging `MAP_READ` readback | Standard WebGPU/WGSL element-wise shape. |
| Workgroup size | Fixed `@workgroup_size(64)` for hello-add emit, twin, golden, dispatch | Author-controlled sizes later for full WGSL; device limits still apply at run. |
| Emit proof | Golden snapshot of **normalized** WGSL (one fixture); subset-reject + light structural tests | Whitespace normalized before compare. |
| Float compare | Exact f32 equality (bit-identical after readback) vs CPU; finite fixtures | ULP/interval only when a later checklist feature needs them. |
| Hand-WGSL twin | Required for hello-add timing on local GPU (same algorithm, size 64) | Correctness stays CPU-ref; twin is timing baseline, not numeric substitute. |
| Terms | kernel / entry point, WGSL module, storage, bind group, workgroup, dispatch, readback, subset, harness, coverage percent | Peer vocabulary from research. |

## Behavior

### Authoring

1. Author writes a real `.ts` function whose body contains `'use gpu'`.
2. Signature uses three storage params in order (e.g. `a`, `b`, `out`: `StorageF32`) plus library access to global id / length for the bounds guard.
3. Body expresses `out[i] = a[i] + b[i]` (or equivalent subset-legal form) with an early-out when `i >= n`.

### Check → emit

1. Parse with the TypeScript compiler API.
2. Find functions marked with `'use gpu'`.
3. Subset checker accepts only the allowed subset; rejects with clear errors and **does not emit**.
4. On accept, compiler emits a WGSL compute module:
   - `@compute @workgroup_size(64)`
   - three storage bindings at `@group(0) @binding(0|1|2)`
   - index by `@builtin(global_invocation_id).x` with bounds guard
5. Emit is comparable to a golden fixture after whitespace normalization.

### Runner

1. Given WGSL + host buffers of length `n`, create STORAGE buffers, bind group matching the module, compute pipeline, dispatch `ceil(n / 64)` workgroups.
2. Copy result to a staging buffer with `MAP_READ`, `mapAsync`, read back `Float32Array`.
3. If `navigator.gpu` / adapter / device is missing when dispatch/readback is requested: **throw** (no CPU fallback).

### Harness

1. **Device-free (CI):** subset reject cases; golden normalized WGSL for hello-add; CPU reference `out[i]=a[i]+b[i]` unit proof; checklist row exists for this feature and coverage percent is reported (may be low).
2. **Device-required (local GPU):** GPU readback vs CPU ref with **exact** f32 equality on finite fixtures; fail the harness if mismatch.
3. **Timing (local GPU):** run compiled emit and required hand-WGSL twin; record gap; do not claim “optimized.”
4. **No device in CI:** device-free must pass; GPU correctness/timing **skip** and report **unverifiable**.
5. **No device when local GPU prove is expected:** harness **fails** (missing device is not a silent pass).

## Scene

**Happy path:** Author writes a real `.ts` kernel with `'use gpu'` and three `StorageF32` params → checker accepts → compiler emits WGSL → runner binds/dispatches/readback → harness matches CPU `out[i]=a[i]+b[i]`, marks the checklist row, and on local GPU prove records timing vs the hand-WGSL twin.

**Fail 1 — Out of subset:** Clear subset errors; no WGSL; no GPU run.

**Fail 2 — No WebGPU / no adapter:** Runner throws if dispatch is requested without a device. Harness in CI marks GPU bars unverifiable and still passes device-free tests. Harness when local GPU prove is expected fails loud.

**Fail 3 — Wrong results:** GPU readback ≠ CPU ref → harness fails; that run does not count as proved for coverage/timing.

## Client / platform contract

Surface: thin WebGPU runner used by harness (not a shipped thick host API).

| Rule | Contract |
|------|----------|
| ACK / defer | N/A — in-process library call, not a chat/API client. |
| Naming / sanitize | N/A — no external rename surface. |
| Permissions | Needs a WebGPU adapter/device when dispatch/readback runs. |
| Rate limits | N/A. |
| Order | Check → emit → (optional) bind/dispatch/readback → harness compare. Never run GPU on rejected subset. |
| No device | Runner throws if dispatch/readback requested without gpu/adapter/device. No CPU fallback. |
| Harness CI (no device) | Device-free tests must pass; GPU correctness/timing skip + **unverifiable**. |
| Harness local (GPU expected) | Missing device **fails**. |
| Mirror honesty | Timing reports measured gap only; never claim hand-optimized parity. |
| Symmetric ops | N/A. |

Platform failure modes to keep visible in errors/harness messages: missing `navigator.gpu`, null adapter, wrong buffer usages (STORAGE not mappable), `mapAsync` alignment/usage errors, workgroup size vs device limits, OOB without bounds guard.

## Transition plan

N/A — no existing economy, persisted player/app state, or migration. Greenfield first slice.

## Acceptance criteria

- [x] `packages/shaderscript` exists with checker, compiler, and thin runner modules (one package).
- [x] A hello-add kernel in real TypeScript with `'use gpu'` in the body compiles to WGSL after subset check.
- [x] Out-of-subset input yields clear errors and no WGSL emit.
- [x] Emitted WGSL for hello-add matches the normalized golden fixture (`@workgroup_size(64)`, three `array<f32>` storage bindings, bounds guard).
- [x] Params map in declaration order to `@group(0)` bindings 0, 1, 2 via `StorageF32` (and related) library types — not a schema DSL.
- [x] Device-free tests prove: subset rejects, golden emit, CPU reference for `out[i]=a[i]+b[i]`.
- [ ] With a WebGPU device: GPU readback matches CPU ref with exact f32 equality on finite fixtures. *(draft blocker — needs human GPU smoke)*
- [ ] Hand-WGSL twin (same algorithm, size 64) exists; local GPU harness records timing gap vs compiled emit (no “optimized” claim). *(twin on disk; timing recording needs human GPU smoke)*
- [x] Harness checklist has a row for this feature and reports a real coverage percent.
- [x] Without a device: runner throws on dispatch/readback; CI harness skips GPU bars as unverifiable while device-free passes; local expected-GPU run fails if device missing.
- [x] Root scripts exist for `bun run checks:structure`, `bun run test:compile`, and `bun run test:harness` (GPU parts local as needed).
- [x] Structure check encodes folder rules for `packages/shaderscript` the week the package lands; AGENTS First examples row points at the shipped path.

## Open questions

None — all settled in research grill before write. Audit trail:

- [x] First kernel — **Answer:** Element-wise float add.
- [x] Package layout — **Answer:** One package `packages/shaderscript`.
- [x] CI vs GPU prove — **Answer:** Subset + compile in CI; GPU local / unverifiable.
- [x] Defer thick DX — **Answer:** No plugins, schemas-as-product, or shipped escape hatch in slice 1.
- [x] Compiler seam — **Answer:** Check before emit inside one package.
- [x] Host WGSL shape — **Answer:** Three storage `array<f32>`, bounds guard, `ceil(n/wg)` dispatch, staging readback.
- [x] Proof lanes — **Answer:** Device-free / GPU vs CPU / timing vs twin.
- [x] Terms — **Answer:** Peer WGSL/WebGPU vocabulary + harness / coverage percent.
- [x] Symmetric ops — **Answer:** N/A.
- [x] Transition honesty — **Answer:** N/A.
- [x] MVP entry convention — **Answer:** `'use gpu'` AST marker only.
- [x] AST / parse toolchain — **Answer:** TypeScript compiler API only.
- [x] Kernel params / buffers — **Answer:** Positional `StorageF32` params → bindings 0–2; tiny library idioms.
- [x] Scene — **Answer:** Happy path + subset / no-device / wrong-results fails (see Scene).
- [x] WebGPU client contract — **Answer:** Loud throw; CI unverifiable skip; local expected-GPU fail.
- [x] Emit proof shape — **Answer:** Normalized golden WGSL snapshot + subset/structural tests.
- [x] Workgroup size — **Answer:** Fixed 64 for hello-add slice.
- [x] Float compare — **Answer:** Exact f32 for hello-add.
- [x] Hand-WGSL twin — **Answer:** Required for timing bar; correctness stays CPU-ref.

## Proof plan

| Criterion | How proved |
|-----------|------------|
| Package + modules | `bun run checks:structure`; package layout on disk |
| Check → emit happy path | `bun run test:compile` (device-free compile/subset suite) |
| Subset rejects | Compile tests with fixtures that must fail without emit |
| Golden WGSL | Snapshot compare after normalize whitespace |
| Param → binding map | Structural/golden assert on `@binding` order |
| CPU ref | Unit test of reference add; shared by harness compare |
| GPU correctness | `bun run test:harness` on a machine with WebGPU |
| Timing vs twin | Same harness timing lane; recorded gap only |
| Checklist / coverage % | Harness report includes mapped row + percent |
| No-device contract | Unit/integration: runner throw; harness skip vs fail modes |
| Scripts | Root `package.json` scripts wired; CI runs structure + `test:compile` |

**Unverifiable (CI cannot prove today):**

- GPU readback vs CPU on a real adapter
- Timing gap vs hand-WGSL twin
- Device-limit edge cases unique to a physical GPU

**Human smoke script (local GPU prove):**

1. Confirm a WebGPU-capable browser or runtime adapter is available on the machine.
2. Run `bun run test:compile` — expect all device-free tests green.
3. Run `bun run test:harness` with GPU expected — expect hello-add correctness pass (exact f32) and a recorded timing line for emit vs twin (no optimized claim in output).
4. Temporarily break the kernel math or twin — expect harness fail on mismatch.
5. Run harness in a no-device environment (or forced skip) — expect device-free pass and GPU bars reported unverifiable, not silent green for correctness/timing.
6. Feed one out-of-subset fixture — expect clear error and no emit.

Ship without steps 1/3: draft PR flagged for human GPU smoke; do not treat CI alone as full proof.

## Changelog

- 2026-08-10: created from `.ai/research/hello-compute.md` (grill closed; no undecided items). Status `ready-for-plan`.
