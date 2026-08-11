# Shaderscript

**Real TypeScript → WGSL → WebGPU**

[![CI](https://github.com/briceduke/shaderscript/actions/workflows/ci.yml/badge.svg)](https://github.com/briceduke/shaderscript/actions/workflows/ci.yml)
[![Bun](https://img.shields.io/badge/runtime-bun-fbf0df?logo=bun&logoColor=black)](https://bun.sh)
[![TypeScript](https://img.shields.io/badge/language-TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![WGSL](https://img.shields.io/badge/target-WGSL-5C6BC0)](https://www.w3.org/TR/WGSL/)
[![WebGPU](https://img.shields.io/badge/runs%20on-WebGPU-00A3A1)](https://gpuweb.github.io/gpuweb/)
[![Status](https://img.shields.io/badge/status-early-orange)](#roadmap)

Write GPU compute kernels as a strict **subset of TypeScript**, compile them to WGSL, and run them on WebGPU. Not a new language. Not a packaged model you cannot open. You keep editable TypeScript; the GPU runs the compiled shader.

If WGSL can express it, this subset aims to express it. Most full TypeScript stays invalid under `'use gpu'` — on purpose.

Proof means a harness with three bars: **coverage** of a fixed WGSL checklist, **correctness** vs a CPU reference, and **timing** vs hand-written WGSL.

## Roadmap

### Now — Hello compute
- [x] Product direction and architecture
- [x] Structure checks + CI
- [x] `packages/shaderscript`: subset checker + compiler + thin WebGPU runner
- [x] Element-wise float add: `out[i] = a[i] + b[i]`
- [x] Harness spine: checklist row, CPU reference, timing vs hand-WGSL twin
- [x] Compile/subset tests always in CI; GPU correctness/timing local (or unverifiable in CI) until headless WebGPU exists

### Next — Coverage climb
- [ ] Grow the fixed WGSL feature checklist with 1:1 tests
- [ ] Report honest coverage percent as the progress marker
- [ ] Close the gap from naive emit toward strong hand WGSL (measure every step)

### Later — Practical DX
- [ ] Host API from normal TypeScript (buffers, bind, dispatch, readback)
- [ ] Errors that point at TypeScript source
- [ ] Vite + Next plugins for `'use gpu'` in app builds
- [ ] Editor / LSP feedback for the subset
- [ ] Official examples, typed bindings, WGSL escape hatch
- [ ] Loud failure when WebGPU is missing (runner already throws; thicker host DX later)

### Further out
- [ ] Live edit playground
- [ ] Editable small model / layer path (not a black-box catalog)
- [ ] Broader demos on the same primitive

## What a kernel looks like

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

- `'use gpu'` marks the entry (AST marker; Vite/Next plugins come later).
- Parameters map to storage buffer bindings in order.
- The checker rejects TypeScript that is outside the subset.

## How it fits together

```text
TypeScript kernel  →  subset check  →  WGSL emit  →  WebGPU dispatch + readback
                                                      ↓
                                         harness: coverage · correctness · timing
```

One library package owns checker + compiler + thin runner until a second consumer needs a split.

## Who this is for

TypeScript developers who want GPU compute (and later editable models) without learning WGSL as a second language — and without treating the model as a sealed black box.

## Try the repo today

Needs [Bun](https://bun.sh).

```bash
bun install
bun run checks:structure
bun run test:compile
bun run test:harness
```

CI runs those three without `SHADERSCRIPT_EXPECT_GPU`, so missing devices skip the GPU lane as unverifiable. For a local GPU prove that must fail if no device is present:

1. `bun-webgpu` is already a package **devDependency** (after `bun install`). The published package ships Dawn via platform optionalDependencies (`bun-webgpu-win32-x64`, `bun-webgpu-linux-x64`, …). There is no `node_modules/bun-webgpu/dawn/download_artifacts.ts` after npm install (that script is upstream build-only).
2. On a machine with a real GPU driver (Windows D3D/Vulkan, or Linux Vulkan), set the expect flag and run the harness:

```powershell
$env:SHADERSCRIPT_EXPECT_GPU = "1"
bun run test:harness
```

Without a usable adapter / when Dawn falls back to null-backend and `SHADERSCRIPT_EXPECT_GPU` is unset, the GPU lane is skip + unverifiable. With `SHADERSCRIPT_EXPECT_GPU=1` and no usable device, the harness fails loud.

A software/fallback adapter may clear correctness. Timing leave-draft needs a hardware adapter smoke — do not claim optimized. Dawn null-backend is not a software adapter; it does not clear correctness.

## Learn more

| Doc | What it covers |
|-----|----------------|
| [`.ai/product.md`](.ai/product.md) | Goals, MVP vs later, non-goals |
| [`.ai/architecture.md`](.ai/architecture.md) | Checker, compiler, runner, harness |
| [`.ai/research/hello-compute.md`](.ai/research/hello-compute.md) | First-slice research + design decisions |
| [`.ai/specs/2026-08-10-hello-compute.md`](.ai/specs/2026-08-10-hello-compute.md) | Hello compute acceptance + proof plan |

## License

License TBD. Code is public; treat it as source-available until a license is chosen.
