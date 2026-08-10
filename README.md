<div align="center">

# Shaderscript

**Real TypeScript → WGSL → WebGPU**

A strict TypeScript *subset* that compiles to WGSL and runs on the GPU.  
Not a new dialect. Not a black-box model pack. Kernels you can open, change, and recompile.

[![CI](https://github.com/briceduke/shaderscript/actions/workflows/ci.yml/badge.svg)](https://github.com/briceduke/shaderscript/actions/workflows/ci.yml)
[![Bun](https://img.shields.io/badge/runtime-bun-fbf0df?logo=bun&logoColor=black)](https://bun.sh)
[![TypeScript](https://img.shields.io/badge/language-TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![WGSL](https://img.shields.io/badge/target-WGSL-5C6BC0?logo=webgpu&logoColor=white)](https://www.w3.org/TR/WGSL/)
[![WebGPU](https://img.shields.io/badge/runs%20on-WebGPU-00A3A1?logo=googlechrome&logoColor=white)](https://gpuweb.github.io/gpuweb/)
[![License](https://img.shields.io/badge/license-TBD-lightgrey)](#)
[![Status](https://img.shields.io/badge/status-day%20zero-orange)](#status)

```text
  TypeScript kernel          subset check          WGSL emit           WebGPU run
 ┌─────────────────┐      ┌──────────────┐      ┌────────────┐      ┌──────────────┐
 │ out[i] = a[i]   │ ───▶ │ accept /     │ ───▶ │ WGSL       │ ───▶ │ dispatch +   │
 │      + b[i]     │      │ reject       │      │ module     │      │ readback     │
 └─────────────────┘      └──────────────┘      └────────────┘      └──────────────┘
                                                              │
                                                              ▼
                                                    harness: coverage ·
                                                    correctness · timing
```

</div>

---

## Why

WGSL is a second language most TypeScript developers do not want to learn. Browser ML stacks ship finished models you mostly cannot rewrite as code. Heavy CPU work in the page janks the UI.

Shaderscript keeps GPU source as **real TypeScript** (syntax and APIs only — no invented dialect). GPU-only ideas use ordinary TypeScript: library functions, types, and annotations. The subset is strict: most full TypeScript stays invalid under `use gpu`. The ceiling is WGSL — if WGSL can say it, this subset aims to say it.

## Status

| Bar | Today |
|-----|--------|
| Product / architecture / constitution | Locked |
| Factory rails + structure CI | Live |
| `packages/shaderscript` (checker · compiler · runner) | Not built yet |
| Hello compute harness | Planned first slice |
| Vite / Next / LSP | Later |

Proof is not “it looked fine.” The harness tracks **coverage %**, **correctness vs reference**, and **timing vs hand WGSL**.

## Roadmap

### Phase 0 — Rails *(done)*
- [x] Product brief, architecture, constitution
- [x] Structure checks + CI
- [x] One-package rule until a second consumer forces a seam

### Phase 1 — Hello compute *(next)*
- [ ] `packages/shaderscript`: subset checker + compiler + thin WebGPU runner
- [ ] Element-wise float add: `out[i] = a[i] + b[i]`
- [ ] Harness spine: checklist row, CPU reference, timing vs hand-WGSL twin
- [ ] `bun run test:compile` always in CI
- [ ] GPU correctness / timing: local prove (or flagged unverifiable in CI) until headless WebGPU exists

### Phase 2 — Coverage climb
- [ ] Grow the fixed WGSL feature checklist with 1:1 tests
- [ ] Report honest coverage percent as the progress marker
- [ ] Close the gap from naive emit toward strong hand-optimized WGSL (measure every step)

### Phase 3 — Practical DX
- [ ] Host / runtime API (buffers, bind, dispatch, readback) from normal TypeScript
- [ ] Errors that point at TypeScript source lines
- [ ] `use gpu` (or equivalent) + Vite plugin + Next.js plugin
- [ ] Fast save → recompile
- [ ] Official examples: hello compute, reduction/filter, editable layer
- [ ] Subset lint in CI (Biome first, then ESLint where needed)
- [ ] Typed host ↔ kernel bindings
- [ ] WGSL escape hatch while coverage grows
- [ ] Loud failure when WebGPU is missing

### Phase 4 — Show the foundation
- [ ] Live edit playground
- [ ] Editable small model / layer path (not a black-box catalog)
- [ ] Broader demos: crunching, sims, embeddings / image models on the same primitive

## Non-goals (for now)

- Full TypeScript runtime on the GPU (GC, free closures, async, …)
- A custom TypeScript-like dialect
- Beating transformers.js / ONNX as a packaged model catalog
- Claiming “complete WGSL” or “matches hand-optimized WGSL” before the harness shows it

## Prove ladder

| Change | Command | Where |
|--------|---------|--------|
| Structure | `bun run checks:structure` | CI + local |
| Subset / compile | `bun run test:compile` | CI (add with package) |
| Harness | `bun run test:harness` | Local GPU bars; CI device-free parts |

## Repo map

```text
.ai/                 product, architecture, skills, lessons
packages/checks/     structure scanner (today)
packages/shaderscript/   checker + compiler + runner (planned)
AGENTS.md            agent router + constitution
```

## Development

```bash
bun install
bun run checks:structure
```

Agents and humans follow `AGENTS.md`. Commit only through `/check-and-commit`.

## License

License TBD. Code is public for now; treat it as source-available until a license lands.
