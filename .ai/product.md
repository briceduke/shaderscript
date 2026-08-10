# Product

## What this product is

A real **subset of TypeScript** (plus a few typed library idioms) that compiles to WGSL and runs on WebGPU. Not “TypeScript-like”: GPU source uses real TypeScript syntax and APIs only — no new language syntax. Idioms for GPU-only ideas (workgroup memory, barriers, and the like) are ordinary TypeScript: library functions, types, and annotations. The subset is strict: most full TypeScript is still invalid under `use gpu`. Developers must see that while writing (LSP / editor intelligence). The product is programmable GPU compute end to end, with complete WGSL coverage as the ceiling — if WGSL can say it, this subset can say it. Practical use means it plugs into real apps (`use gpu`, Vite plugin, Next.js plugin) so kernels live in a normal codebase.

## Who

TypeScript developers who want GPU work (compute, and later models) without learning WGSL. People who want to open, change, and recompile GPU logic — not only call a black-box model pack.

## Problem

WGSL (and the GPU mental model) is a hard second language. Existing browser ML stacks (for example transformers.js, ONNX Runtime Web) ship finished models you mostly cannot rewrite as code. Heavy CPU work in the page also janks the UI. There is no clean way today to write GPU kernels as a real TypeScript subset, with full WGSL power, stay editable, get clear editor feedback on what is in-subset vs out, and drop them into a normal Vite or Next.js app.

## What "good" looks like

Proof is a rigorous harness with three bars. Guesswork and “it looked fine” do not count.

1. **Coverage** — A fixed WGSL feature checklist maps 1:1 to deterministic tests. The suite reports coverage percent (for example 50%, 80%, 100%). That number is the progress marker for the ceiling.
2. **Functionality** — Compiled kernels run on WebGPU and match a trusted reference (CPU reference and/or hand-written WGSL with the same meaning). Wrong results fail the harness. GPU source must be real TypeScript syntax (no custom dialect), and under `use gpu` it must pass the subset checker — most full TypeScript remains invalid there.
3. **Performance** — Same workloads profile compiled output against carefully written, optimized hand WGSL. The end goal is compiler output that is very strong next to that baseline, not naive WGSL that “works.” Early ships may be slower; the harness must still measure the gap so progress is visible.
4. **Authoring feedback (later, required for practical use)** — Under `use gpu`, LSP / editor intelligence shows what TypeScript is allowed and what is not (errors, completions, hover) so developers do not discover subset rules only at compile time. CI uses the same subset rules via Biome first (this project’s lint stack), then ESLint for ecosystems that need it.
5. **Practical DX (later, required — not novelty)** — Host/runtime API; errors that point at TypeScript source; fast save→recompile in Vite/Next; small official examples; typed host↔kernel bindings; WGSL escape hatch while coverage grows; loud clear failure when WebGPU is missing (CPU fallback optional later, not required).

MVP scene under that harness: one compute kernel in the TypeScript subset → WGSL → WebGPU, results match reference, and timing is recorded even if optimization is still weak.

Later product checks: a small model or layer written in the subset can be edited and recompiled so output changes without a black-box API; kernels marked with a `use gpu` (or equivalent) directive build through Vite and Next.js plugins in a real app; subset validity is visible in the editor and in Biome/ESLint CI; calling a kernel from normal TS through the host API works end to end.

## MVP vs later

**MVP**

- Compile a useful numeric/compute subset to WGSL and run it on WebGPU.
- Escape-hatch idioms (typed functions/types) only where that first kernel needs them.
- Stand up the rigorous harness spine: coverage percent, correctness vs reference, and performance profiling vs hand WGSL (measure first; do not claim “optimized” yet).
- One end-to-end kernel with CPU-reference proof; record timings against a hand-WGSL twin where practical.

**Later**

- Grow coverage until the WGSL checklist is complete.
- Tighten the compiler so emitted WGSL approaches (and aims to match) strong hand-optimized WGSL on the profiled suite — not naive codegen left forever.
- App integration and DX roadmap (required for practical use, not a side quest or novelty):
  - **Host/runtime API** — typed create buffers, bind resources, dispatch, read results from normal TypeScript.
  - **Errors map to TypeScript** — compile/runtime failures point at subset source lines, not opaque WGSL-only dumps.
  - **Save → recompile** — Vite/Next feedback in seconds.
  - **Official examples** — hello compute, one reduction/filter, one editable-layer path; docs copy those.
  - A `use gpu` directive (or equivalent) so GPU entrypoints live in a normal TypeScript codebase.
  - Vite plugin and Next.js plugin.
  - LSP / editor intelligence for `use gpu` regions: in-subset vs out-of-subset while writing.
  - **Subset lint in CI** — Biome first (project priority), then ESLint for stacks that need it; same rules as the checker/LSP where possible.
  - **Typed bindings** — host types match kernel params so wrong buffer layout fails early.
  - **WGSL escape hatch** — call or embed hand WGSL while coverage grows without abandoning the TypeScript path.
  - **No WebGPU** — loud, actionable failure; optional CPU fallback later (easy to bloat — not required for practical v1 of this list).
- Live edit playground (change a layer/kernel, see output update).
- nanoGPT-scale (or similar) client-side model as the flashy proof of the foundation.
- Broader demos: data crunching, particles/simulations, embeddings/image models on the same primitive.

## Non-goals

- Running a full TypeScript runtime (GC, dynamic objects, free closures, recursion, async, strings-as-first-class GPU values) natively on the GPU. The subset is the door, not the claim.
- Inventing a TypeScript-like dialect or separate syntax. GPU source stays real TypeScript; GPU-only needs use library functions, types, and annotations TypeScript already allows. Out-of-subset full-TS features are rejected by the subset checker / LSP, not replaced with new syntax.
- Beating transformers.js / ONNX head-on as a packaged model catalog. They ship models; this ships write-and-modify ability.
- Polished playground UX, viral demos, “complete WGSL coverage,” “matches hand-optimized WGSL,” bundler plugins, full LSP, or the full DX list as the first ship. Those wait until the compile → run path and harness spine are real — but host API, TS-mapped errors, fast recompile, examples, Vite / Next.js / `use gpu`, subset LSP, Biome-then-ESLint subset lint, typed bindings, WGSL escape hatch, and clear no-WebGPU errors stay on the roadmap because without them the product is novelty, not practical.
- Inventing features WGSL cannot express. WGSL is the checklist and the ceiling.
- Shipping without a real prove path for coverage, correctness, and performance. A demo alone is not enough.
- Requiring a CPU fallback for every kernel. Clear failure when WebGPU is missing is enough until a fallback earns its keep.

## Open risks

- Some WGSL bits (workgroup memory, barriers, atomics, textures) have no natural TypeScript shape; the idioms must stay ordinary TypeScript (functions, types, annotations) and not turn into custom syntax.
- A `use gpu` directive plus Vite/Next plugins must fit real app builds without becoming a fragile second toolchain.
- Subset rules are easy to violate because normal TypeScript accepts far more than the GPU subset; without strong LSP and Biome/ESLint feedback, developers will fight the compiler late and give up.
- Host API and typed bindings must stay thin or they become a second product that overshadows the language.
- Coverage percent only helps if the checklist is honest, fixed, and mapped 1:1 to tests — fuzzy counting would lie.
- Performance claims only help if the hand-WGSL baselines are fair (same algorithm, strong writing) and the profiler is repeatable.
- Closing the gap from naive to optimized WGSL is real compiler work; the harness must show the gap so “later” does not drift forever.
- WebGPU test environments (CI vs local GPU) may limit how much of the prove ladder can run automatically.
- Editability is only an edge if compile and feedback stay fast enough that people prefer this over a black box.
