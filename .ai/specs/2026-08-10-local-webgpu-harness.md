# Local WebGPU harness

**Status:** planned
**Research:** [.ai/research/local-webgpu-harness.md](../research/local-webgpu-harness.md)
  (platform notes for Dawn / Bun / skip-vs-fail live in that file; no separate platform note.)

## Problem

Hello compute (slice 1) shipped the spine and device-free proof, but GPU correctness and timing stay **unverifiable** on stock Bun: `navigator.gpu` is missing, so `SHADERSCRIPT_EXPECT_GPU=1` fails and leave-draft cannot clear hello-compute AC7/AC8. Without a local device door, the harness cannot prove the product bars that need a real adapter.

## Goals

- Install a real WebGPU `navigator.gpu` into the same Bun process the harness already uses, so `bun run test:harness` with `SHADERSCRIPT_EXPECT_GPU=1` can acquire a device.
- Clear hello-compute GPU correctness (exact f32 vs CPU) and timing gap recording (emit vs hand-WGSL twin) on this Windows + Bun machine for leave-draft — or stay draft with that blocker listed.
- Keep the existing EXPECT_GPU skip/fail contract unchanged.
- Keep CI device-free: structure + `test:compile` + `test:harness` without `EXPECT_GPU` stay green; no GPU job in this slice.
- Stay inside `packages/shaderscript` (harness preload or tiny module beside harness). No `packages/host`.

## Non-goals

- Coverage climb / growing the WGSL checklist (slice 3).
- CI SwiftShader / Lavapipe / software-adapter jobs.
- Inventing `packages/host`, `packages/lsp`, or `packages/vite-plugin`.
- Rewriting the runner API or changing exact-f32 / twin timing semantics from hello-compute.
- Claiming “matches hand-optimized WGSL” or treating software-adapter timing as leave-draft proof.
- Publishing `bun-webgpu` (or Dawn) as a runtime dependency of the library.
- Browser-first prove path as the primary door (Chromium is escape hatch only).

## Design decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Scoping / data door | None | Library/toolchain; no tenant or persisted app data (`AGENTS.md`). |
| Hard rules | Real TS only; one package; harness prove; CI subset+compile | Constitution unchanged. This slice only supplies the missing device for existing harness bars. |
| Pattern to copy | Hello compute vertical slice (`packages/shaderscript`) | First example already owns kernel → check → WGSL → run → harness; this adds the local device door for GPU lanes. |
| Proof | `checks:structure` → `test:compile` → `test:harness` with `SHADERSCRIPT_EXPECT_GPU=1` on Windows | Device-free CI unchanged; GPU leave-draft needs local hardware (or caveated software for correctness only). |
| Frozen surfaces | None | `BACKWARD_COMPATIBILITY.md` empty. |
| Ask first | `bun-webgpu` as **devDependency** (prove-only) on `@shaderscript/shaderscript`; no new packages | Explicit prove/dev dep, not a published runtime dep. Soft-fail preload if missing so CI stays green. |
| Out of scope | Coverage climb; CI software GPU; `packages/host`; runner redesign | Research grill; keep the slice thin. |
| Scene | N/A | Harness prove infra, not a user-facing product surface (research grill). Developer smoke steps live in Proof plan. |
| Symmetric ops | N/A | No list↔unlist-style pair. |
| Client / platform | Keep EXPECT_GPU; Dawn bootstrap before GPU tests; loud fail when EXPECT set and no device | Same honesty as hello-compute; only the device source changes. |
| Transition plan | N/A | No economy or persisted state. Unverifiable → locally proved is a proof-status change, not a data migration. |
| Unverifiable risks | CI still cannot prove GPU; software timing weak | Named Windows smoke; timing caveated without hardware adapter. |
| Slice name | Local WebGPU for harness (clear hello AC7/AC8) | Coverage climb is a different product slice. |
| Primary Dawn door | `bun-webgpu` `setupGlobals()` before GPU tests | In-process same JS WebGPU API; one harness entry; avoids `packages/host`. |
| Escape hatch order | Prove npm `webgpu` under Bun → if both fail on Windows, thin Chromium smoke | Do not lead with browser; do not invent a host package first. |
| Preload behavior | Soft-fail if Dawn / `bun-webgpu` missing | Device-free CI and machines without artifacts stay green; EXPECT unset → skip + unverifiable. |
| Windows leave-draft bar | Correctness + timing must clear here (or draft with blocker) | “Works on another OS only” does not clear leave-draft while local EXPECT still skips. |
| Software adapter | May clear **correctness**; timing stays caveated/draft without hardware smoke | Dawn keeps perf on real silicon; honesty over fake green. |
| CI GPU | Out of slice | No SwiftShader/Lavapipe job until local Windows prove works. |
| Layout | Harness preload or tiny module beside harness in `packages/shaderscript` | Raptor; second consumer before new packages. |

## Behavior

### Bootstrap

1. Before GPU harness tests run, a small preload (or harness-side import) tries to install WebGPU globals via `bun-webgpu` `setupGlobals()`.
2. If the module or Dawn artifacts are missing, preload soft-fails (log/reason) and does not crash device-free runs.
3. After a successful setup, `navigator.gpu` exists in-process; existing `requestDeviceOrThrowAsync` / `tryAcquireDeviceAsync` paths work unchanged.

### Human one-time setup

1. Add `bun-webgpu` as a **devDependency** of `@shaderscript/shaderscript`.
2. Human runs Dawn / package `download_artifacts` (or the package’s documented install step) once on the machine.
3. README (or harness notes) documents: install dep, download artifacts, then `SHADERSCRIPT_EXPECT_GPU=1 bun run test:harness`.

### EXPECT_GPU contract (unchanged)

| Environment | Device missing | Device present |
|-------------|----------------|----------------|
| `SHADERSCRIPT_EXPECT_GPU` unset | GPU lane skip + `unverifiable`; device-free pass | GPU lane runs; correctness + timing assert |
| `SHADERSCRIPT_EXPECT_GPU=1` | **Fail** loud with reason | GPU lane runs; correctness + timing assert |

No CPU fallback. Runner still throws if dispatch/readback is requested without a device.

### Escape hatch (in-slice if primary fails on Windows)

1. Try npm `webgpu` (dawn.node) under Bun with the same “install globals before harness” shape.
2. If both Dawn doors fail on this Windows machine, thin Chromium smoke that still exercises hello-add correctness + timing recording — only as last resort; do not invent `packages/host`.
3. Leave-draft stays blocked until one path proves on Windows (or the PR lists the blocker).

### Software vs hardware honesty

- Software adapter may clear **GPU correctness** (exact f32 vs CPU) when it is the only adapter.
- Timing may run and print a gap string, but the timing leave-draft AC stays **caveated / draft** unless a hardware adapter smoked it.
- Prefer hardware for both when available.

## Scene

N/A — harness prove infrastructure, not a user-facing product scene. Developer steps are the human smoke script in Proof plan.

## Client / platform contract

Surface: Bun-process WebGPU for harness (not a shipped thick host API; not a chat/browser product client).

| Rule | Contract |
|------|----------|
| ACK / defer | N/A — in-process prove. |
| Naming / sanitize | N/A. |
| Permissions | Needs Dawn artifacts + adapter/device when GPU lane runs. |
| Rate limits | N/A. |
| Order | Preload WebGPU globals → existing check/emit fixtures → acquire device → bind/dispatch/readback → compare / time. Never rewrite skip/fail. |
| No device (EXPECT unset) | Skip GPU lane + report unverifiable; device-free pass. |
| No device (EXPECT=1) | Fail loud. |
| Missing Dawn preload | Soft-fail; same as no device for the table above. |
| Mirror honesty | Timing reports measured gap only; no “optimized” claim; software timing does not clear leave-draft timing AC. |
| Symmetric ops | N/A. |

Platform failure modes to keep visible: missing `bun-webgpu` / Dawn libs, `setupGlobals` failure, missing `navigator.gpu`, null adapter, EXPECT=1 with no device.

## Transition plan

N/A — no persisted state or economy. Proof status only: hello-compute GPU ACs move from unverifiable/draft toward proved on local Windows hardware (or stay draft with listed blocker).

## Acceptance criteria

- [ ] `bun-webgpu` is a **devDependency** of `@shaderscript/shaderscript` (not a published runtime dependency).
- [ ] A harness preload (or equivalent import before GPU tests) calls `setupGlobals()` (or documented equivalent) and soft-fails if the module/artifacts are missing.
- [ ] README or harness notes document: install dep, download Dawn artifacts, run `SHADERSCRIPT_EXPECT_GPU=1 bun run test:harness`.
- [ ] Without GPU / without artifacts: `bun run test:harness` (EXPECT unset) still passes device-free tests and reports GPU lane unverifiable (no silent green for correctness/timing).
- [ ] With `SHADERSCRIPT_EXPECT_GPU=1` and no device after preload attempt: harness **fails** loud.
- [ ] On this Windows + Bun machine with a working Dawn door (or documented escape hatch): GPU hello-add readback matches CPU ref with exact f32 equality.
- [ ] Same local prove records timing gap emit vs hand-WGSL twin; output does not claim “optimized.”
- [ ] Timing leave-draft is cleared only when a **hardware** adapter smoked the timing lane; software-only timing stays caveated/draft.
- [ ] No `packages/host` (or other new packages) added.
- [ ] CI remains device-free: no SwiftShader/Lavapipe GPU job in this slice; root scripts `checks:structure`, `test:compile`, `test:harness` still apply.
- [ ] Existing runner / EXPECT_GPU semantics are not rewritten (preload supplies `navigator.gpu`; contract stays).

## Open questions

None — all settled in research grill before write. Audit trail:

- [x] Coverage climb vs this slice — **Answer:** This is slice 2 (local WebGPU for harness). Coverage climb is slice 3.
- [x] Which Dawn door? — **Answer:** Primary `bun-webgpu` `setupGlobals()`. Escape: npm `webgpu` under Bun → thin Chromium smoke. No `packages/host` first.
- [x] Dependency class — **Answer:** `bun-webgpu` as prove-only **devDependency**; soft-fail preload; human `download_artifacts` once; not in CI this slice. Ask First satisfied as prove/dev dep.
- [x] Windows prove bar — **Answer:** Correctness + timing must clear on this Windows + Bun machine for leave-draft, or stay draft with blocker.
- [x] Software adapter — **Answer:** May clear correctness; timing caveated/draft without hardware smoke.
- [x] CI SwiftShader job — **Answer:** Out of slice 2.
- [x] Device-free / EXPECT_GPU / no CPU fallback / no `packages/host` — **Answer:** Keep slice 1 contract (research “already settled”).
- [x] Scene / symmetric ops / transition — **Answer:** N/A for this infra slice.

## Proof plan

| Criterion | How proved |
|-----------|------------|
| DevDependency only | `packages/shaderscript/package.json` lists `bun-webgpu` under `devDependencies` |
| Preload soft-fail | Device-free `bun run test:harness` green without artifacts; log/reason on soft-fail |
| Docs | README / harness notes contain install + EXPECT_GPU steps |
| EXPECT unset, no device | Harness skip + unverifiable string; device-free pass |
| EXPECT=1, no device | Harness fails with clear reason |
| GPU correctness | `SHADERSCRIPT_EXPECT_GPU=1 bun run test:harness` on Windows; exact f32 vs CPU |
| Timing recording | Same run prints gap string; no “optimized” |
| Hardware vs software timing | Smoke notes which adapter class; leave-draft timing only if hardware |
| No new packages | Structure check / tree: still one library package |
| CI unchanged | CI runs structure + compile + harness without EXPECT_GPU; no new GPU job |

**Unverifiable (CI cannot prove):**

- Real adapter acquire on GitHub runners
- Hardware timing honesty
- Dawn artifact download on contributor machines (human step)

**Human smoke script (Windows leave-draft):**

1. Install package deps; run Dawn / `bun-webgpu` artifact download per README.
2. Run `bun run test:compile` — expect green.
3. Run `bun run test:harness` with EXPECT unset and (if possible) without a device — expect device-free pass and GPU unverifiable (or GPU pass if a device is already present).
4. Run `SHADERSCRIPT_EXPECT_GPU=1 bun run test:harness` — expect hello-add exact f32 pass and a timing gap line (no optimized claim).
5. Note adapter class (hardware vs software). If software only: mark timing AC still draft/caveated; correctness may clear.
6. If primary Dawn fails on Windows: try escape hatch in order; if still blocked, leave draft with the blocker named in the PR.
7. Temporarily unset artifacts or force no-gpu with EXPECT=1 — expect loud fail.

Ship without steps 1/4 on Windows: draft PR flagged for human GPU smoke; do not treat CI alone as clearing hello-compute AC7/AC8.

## Changelog

- 2026-08-10: created from `.ai/research/local-webgpu-harness.md` (grill closed; no undecided items). Status `ready-for-plan`.
