# Architecture

High-level design for Shaderscript. Structure follows the product: a real TypeScript subset that compiles to WGSL and runs on WebGPU, proved by a rigorous harness. Not a SaaS app. Not a layer cake.

## Main pieces

Four parts. Each earns its keep for the MVP path.

| Piece | Job |
|-------|-----|
| **Subset checker** | Given TypeScript under `'use gpu'` (directive string in the kernel function body), accept only the allowed subset. Reject the rest with clear errors. Same rules the compiler trusts. |
| **Compiler** | Parse real TypeScript (TypeScript compiler API), check the subset, emit WGSL. No custom dialect. GPU-only ideas use ordinary TypeScript (library functions, types, annotations). |
| **Runner** | Thin WebGPU path: load WGSL, create buffers, bind, dispatch, read results. Enough to prove one kernel. Not a full host/product API yet. |
| **Harness** | Fixed WGSL feature checklist mapped 1:1 to tests; correctness vs CPU reference and/or hand WGSL; timing vs hand-WGSL twin. Reports coverage percent and the performance gap. |

Optional later pieces (not main for day zero): host/runtime API surface, Vite/Next plugins, LSP / Biome subset lint, playground. Those wait until compile → run → harness is real.

**Raptor note:** Do not split these into many packages on day one. Prefer one library package that owns checker + compiler + thin runner, with harness tests next to it, until a second consumer forces a seam.

## Request / action flow

Authoring and prove path (MVP):

```text
TypeScript kernel source
        │
        ▼
  Subset checker  ──reject──► clear subset errors (stop)
        │ accept
        ▼
     Compiler  ──fail──► compile errors (stop)
        │
        ▼
   WGSL module string
        │
        ▼
      Runner (WebGPU)
        │
        ▼
  Device buffers / dispatch / readback
        │
        ▼
     Harness
        ├── correctness: match CPU ref and/or hand WGSL
        ├── coverage: mark checklist rows for this feature
        └── performance: time vs hand-WGSL twin (record gap)
```

App-integration flow (later, not MVP): normal app file with `use gpu` → Vite/Next plugin → same checker + compiler → host API binds and dispatches. Same core pieces; plugins are adapters.

## First vertical slice

**Name:** Hello compute (element-wise float add)

**Cut:** One kernel written in the TypeScript subset with `'use gpu'` (`out[i] = a[i] + b[i]` or equivalent) → subset check → WGSL emit → WebGPU run → results match a CPU reference (exact f32) → timing recorded against a required hand-WGSL twin on local GPU prove → harness checklist has at least that feature row and reports a real coverage percent (even if low).

**Why this slice:** It proves the product claim end to end (real TS with `'use gpu'` marker → WGSL → GPU → trusted result) without Vite/Next plugins, LSP, or a model. Everything else hangs off this spine.

**Smallest proof:** Harness test that fails if compile, run, or reference compare fails. Coverage and timing are part of that same spine, not a second project.

**CI vs local GPU:** Compile and subset-checker tests always run in CI. GPU correctness and performance need a real WebGPU device; until headless WebGPU is available in CI, treat those bars as local prove (or flag them unverifiable in CI). Do not block the spine on CI GPU day one.

## Deliberately not building yet

- Vite plugin, Next.js plugin, and other `'use gpu'` plumbing in app builds (the **marker** itself is in slice 1: checker/compiler find `'use gpu'` in the function body)
- LSP / editor intelligence and Biome/ESLint subset lint productization
- Full host/runtime API and typed bindings product surface (runner stays thin)
- WGSL escape hatch as a shipped feature (hand WGSL in harness baselines only)
- Live playground, nanoGPT-scale demos, particles/embeddings showcases
- Complete WGSL coverage and “matches hand-optimized WGSL” as a claim
- CPU fallback when WebGPU is missing (loud failure is enough when we need it)
- Database, accounts, multi-tenant anything

## Short glossary

| Term | Meaning here |
|------|----------------|
| **Subset** | The strict TypeScript allowed for GPU kernels. Most full TypeScript is invalid. |
| **Kernel** | One GPU entry (compute) written in the subset and compiled to WGSL. |
| **WGSL** | WebGPU Shading Language. Checklist and ceiling: if WGSL can say it, the subset aims to say it. |
| **Checker** | Rules + pass that accept or reject subset TypeScript. |
| **Compiler** | Subset TypeScript → WGSL emitter (after check). |
| **Runner** | Thin WebGPU execute/readback path used by harness and early demos. |
| **Harness** | Coverage checklist + correctness refs + performance timing. Guesswork does not count. |
| **Coverage percent** | Share of the fixed WGSL feature checklist with a mapped passing test. Progress marker. |
| **Escape-hatch idiom** | Ordinary TypeScript (function/type/annotation) for a GPU-only idea — not new syntax. |
| **`use gpu`** | Directive string in a kernel function body marking a GPU entrypoint. Slice 1: AST marker for checker/compiler only. Vite/Next plugin wiring comes later. |

## Need check

| Need | Decision | Reason |
|------|----------|--------|
| **Database** | **No** | Product is a compiler + runner + harness. No persisted user or app data in the MVP path. |
| **Auth** | **No** | No accounts or multi-user surface. Library / toolchain, not a hosted app. |
| **Jobs / queues** | **No** | Compile and dispatch are in-process for the slice. No background workers. |

Revisit only if a later product surface (hosted playground with saved kernels, etc.) creates real need — not “in case.”

## Package sketch (informative, not frozen)

Settled for the first slice:

- One package `packages/shaderscript` — checker, compiler, thin runner
- Harness tests and checklist live with that package
- Root workspace scripts run checks and the prove harness
- Split only when a second consumer forces a seam

Do not invent `packages/lsp`, `packages/vite-plugin`, or `packages/host` until those ships start.

## Settled decisions

| Topic | Decision |
|-------|----------|
| First kernel | Element-wise float add (`out[i] = a[i] + b[i]`) |
| Entry marker | `'use gpu'` in the kernel function body (AST marker only; no app-build plugins in slice 1) |
| Parse / check | TypeScript compiler API only (no SWC) |
| Kernel buffers (slice 1) | Params in order → bind group 0 bindings; `StorageF32` + `globalId` library idioms (no schema DSL) |
| No WebGPU | Runner throws; CI GPU bars unverifiable/skip; local expected-GPU run fails if missing |
| Workgroup (slice 1) | Fixed `@workgroup_size(64)` for hello-add; author-controlled later for full WGSL |
| Emit proof | Normalized golden WGSL snapshot for hello-add |
| Hand-WGSL twin | Required for hello-add timing bar (local GPU); not a correctness substitute for CPU ref |
| CI prove | Compile + subset always in CI; GPU correctness/timing local (or unverifiable in CI) until headless WebGPU exists |
| Package split | One package for checker + compiler + runner until a second consumer forces a seam |
