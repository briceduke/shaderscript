# Local / headless WebGPU harness Research

## Summary

Survey of how peers give a JS harness a real `navigator.gpu` outside stock Bun, so GPU correctness and timing can leave “unverifiable.” Strong tools keep **device-free tests as the CI default**, inject WebGPU via **Dawn (or wgpu) in-process** or a **browser host**, and treat **software adapters** (SwiftShader / Lavapipe) as an optional CI path — not a substitute for local hardware prove when timing matters. TypeGPU keeps unit CI without GPU and treats browser GPU on GitHub runners as hard. Chrome’s ecosystem docs name the Node Dawn module as the supported “same JS API, not in a page” path. Slice 2 should clear hello-compute AC7/AC8 with the smallest seam that installs `navigator.gpu` before `bun run test:harness`, keep the existing EXPECT_GPU contract, and leave CI GPU / software adapters as a later optional bar.

**Scope note:** README “Next — Coverage climb” is a different product slice. This file is the **local/headless WebGPU for harness** slice named after hello-compute leave-draft (clear AC7/AC8). If grill chooses coverage climb instead, park this file and open a separate research slug.

## Sources surveyed

- **Chrome WebGPU ecosystem** — Official map: Dawn standalone, Node `webgpu` module, wgpu/Deno parallel
- **Dawn node (`webgpu` npm / dawn.node)** — Prebuilt Dawn bindings for Node; software GPU notes; puppeteer alternative for page tests
- **bun-webgpu** — Dawn FFI for Bun; `setupGlobals()` installs `navigator.gpu`
- **wgpu testing docs** — Validation/noop vs GPU tests; CTS via Deno; CI software Vulkan (Lavapipe) poison memory
- **Dawn CTS / infra** — SwiftShader / Lavapipe / Chrome `--use-webgpu-adapter=swiftshader`; separate perf suite
- **TypeGPU** — Closest TS peer; CI `vitest --project=!browser`; local `test:browser` (Vitest browser-preview); mocks for unit; no Playwright shipped
- **WebGPU CTS intro** — Normative operation proof vs unit demos; SkipTestCase for missing caps
- **Shaderscript hello-compute research + harness** — Settled skip/fail contract already in repo
- **Node core WebGPU** — Discussed; maintainers steer to dawn.node; not shipping in core Node

## Shared patterns

### 1. Split device-free proof from device-required proof
- **wgpu**: `wgpu-validation` / noop backend vs `wgpu-gpu`; CTS list in CI; GPU tests need a device; noop is not compute proof
- **TypeGPU**: CI runs `vitest run --project=!browser` (structural omit); local `test:browser` uses Vitest browser-preview + Chromium; unit tests mock `GPUDevice` / stub `navigator`
- **Shaderscript (slice 1)**: `test:compile` + device-free harness always; GPU lane skip=`unverifiable` unless `SHADERSCRIPT_EXPECT_GPU=1`
- **Why it is common**: Adapter availability is not guaranteed; spine must stay green without a GPU

### 2. Install WebGPU into the JS process via Dawn (or wgpu), not by inventing a second API
- **Chrome ecosystem**: Node runs the same WebGPU JS through a Dawn-based module
- **npm `webgpu`**: `create([])` + `globals` → assign onto `globalThis` / local `navigator`
- **bun-webgpu**: `setupGlobals()` then `navigator.gpu.requestAdapter()`
- **Why it is common**: Product claim stays WebGPU; host only supplies the implementation

### 3. Browser automation is the alternate door, not the only one
- **Dawn `webgpu` authors**: Prefer puppeteer/Chromium when testing a *webpage*; Node Dawn for compute/readback outside the page
- **TypeGPU**: Shipped local GPU path is Vitest browser-preview (not Playwright); #1048 noted Playwright would need self-hosted GPU for CI
- **Chrome headless**: Default headless often disables GPU; real WebGPU needs Vulkan/WebGPU flags and preferably real drivers — SwiftShader is a tagged software path, not silent hardware
- **Why it is common**: Browser has the mature driver stack; cost is a second runner, browser deps, and weaker Bun-native prove

### 4. Software adapters for CI; hardware for local truth (especially timing)
- **Dawn node / CTS**: `VK_ICD_FILENAMES` → SwiftShader or Lavapipe; Chrome `--use-webgpu-adapter=swiftshader` as a **tagged** config with many Skips in expectations
- **wgpu CI**: Lavapipe with `LVP_POISON_MEMORY` for init bugs
- **Dawn / Chromium infra**: Hardware GPU bots are the regression bar; software is a separate lane, not a substitute for vendor silicon
- **Dawn perf**: Separate `dawn_perf_tests` with real optimization flags — not the same as “any adapter”
- **Why it is common**: Correctness can run on software; performance gaps vs hand WGSL need a fair device story

### 5. Explicit skip vs fail when no adapter
- **wgpu GPU harness**: Capability / expectation system for unsupported GPUs
- **CTS**: Missing optional features → `SkipTestCase` (skip, not fail); Dawn `expectations.txt` uses Skip/Failure tags per platform/adapter
- **TypeGPU**: Structural omit of browser project in CI (not soft `skipIf` in the unit job)
- **Shaderscript**: No device + EXPECT unset → skip + `unverifiable`; EXPECT set → fail loud
- **Why it is common**: Silent green without a device lies; hard-fail everywhere blocks CI

## Answers to research questions

1. **How do strong tools expose WebGPU outside the browser for a compute harness?** — Dawn-in-process (npm `webgpu` / dawn.node; Bun: `bun-webgpu` `setupGlobals`) or a Chromium host (Playwright/puppeteer). Chrome ecosystem docs treat the Node Dawn module as first-class for “same JS, not in a page.” Deno uses wgpu. (Chrome ecosystem; Dawn node README; bun-webgpu README; wgpu testing.)

2. **Native Dawn binding vs browser host — when pick which?** — Prefer in-process Dawn when the harness already runs as `bun test` / Node and only needs storage compute + readback (matches our runner). Prefer browser when proving canvas/DOM integration or when the product *is* a page. Dawn’s own `webgpu` README says use puppeteer for webpage tests; use Node for compute/readback. TypeGPU’s GPU-in-CI pain is mostly the browser+runner gap, not the absence of Dawn. (npm `webgpu` notes; TypeGPU #1048.)

3. **What software / headless options exist for CI?** — SwiftShader or Lavapipe via Vulkan ICD for Dawn node CTS; Chromium `--use-webgpu-adapter=swiftshader` (tagged, many web_platform Skips); wgpu Lavapipe in Linux CI. Default headless Chrome is not “free GPU.” GH runners still need software ICD or self-hosted hardware. Do not wait on core Node WebGPU (nodejs#42896 steers to dawn.node). (Dawn node README; Dawn/Chromium GPU docs; Chrome headless WebGPU posts; wgpu testing.)

4. **What skip vs fail policy should we keep?** — Keep slice 1: device-free always green; GPU skip + `unverifiable` when no device and EXPECT unset; fail when EXPECT set. TypeGPU omits the browser project from CI entirely; CTS skips missing caps. (hello-compute research; TypeGPU workflows; CTS SkipTestCase; wgpu GPU vs validation.)

5. **What is the leanest path to clear AC7/AC8 without inventing `packages/host`?** — Bootstrap Dawn in the same Bun process before GPU tests (`bun-webgpu`, or prove whether npm `webgpu` loads under Bun). Keeps one harness entry (`bun run test:harness`), avoids Ask First `packages/host`, and matches Chrome’s “JS WebGPU outside the browser” story. Browser host (Playwright/puppeteer or Vitest-browser style) is the fallback if Bun Dawn fails on Windows — TypeGPU’s peer path is Vitest browser, not Bun-as-WebGPU. New dependency is still **Ask First**. (Constitution Ask First; architecture no `packages/host` yet; Chrome ecosystem; TypeGPU browser project.)

6. **Is a software adapter enough for the timing bar?** — Enough for *smoke that the timing path runs*; weak as evidence vs “hand WGSL on the same silicon.” Dawn keeps perf in a separate suite. Prefer local hardware when claiming AC8 cleared for leave-draft; allow software only if grill marks timing still draft / caveated. (Dawn testing.md perf section; product performance bar.)

## Source-specific notes

### Chrome WebGPU ecosystem
- Dawn = Chrome’s native WebGPU implementation, usable outside the browser.
- Official note: Node can run unmodified WebGPU JS via a Dawn-based module.
- Parallel Rust path: wgpu (+ Deno).

### npm `webgpu` (dawn.node)
- Usage: `import { create, globals } from 'webgpu'`; assign globals; `navigator = { gpu: create([]) }`.
- Options: `backend=…` (incl. `null`), `adapter=…`, Dawn feature toggles. `null`/noop is API-only — not correctness/timing proof.
- Lifetime: keeping `navigator` alive can prevent process exit — delete when done.
- Authors recommend puppeteer for *page* tests; Node path is for compute/textures/readback.
- Documented WIP gaps vs browser (e.g. EventTarget on `GPUDevice`). Software GPU: SwiftShader / Lavapipe via ICD.
- `@webgpu/types` is types only — does not install a device.

### bun-webgpu
- Bun-native: `import { setupGlobals } from 'bun-webgpu'; setupGlobals();`
- Needs Dawn shared libraries (`download_artifacts` / prebuilts); Zig to rebuild native bits.
- Runs CTS subsets (~78% pass on a reported `webgpu:api,*` slice) — fine for hello-add, not a CTS claim.
- Maturity: young (0.1.x), high download count, small star count — treat as optional/dev prove dep until grilled.

### wgpu
- Clear lanes: validation/noop (no GPU) vs gpu tests vs CTS (Deno).
- Do not put pure validation in the GPU suite; noop does not execute compute/render.
- Linux CI uses software Vulkan (Lavapipe) with memory poison for init bugs.

### TypeGPU
- Closest product peer for TS → WGSL.
- CI: `test-unit.yml` → `pnpm test:unit-and-attest` only; browser project excluded (`--project=!browser`).
- Local GPU: `test:browser` → Vitest `@vitest/browser-preview` + Chromium; example e2e + perf recording.
- Unit path: mock device fixtures + WGSL snapshots / simulate — not GPU readback.
- Bun used for package build, not as WebGPU test host. Copy CI honesty; do not copy “browser-only” as our first door.

### Dawn CTS / perf / infra
- CTS on dawn.node or Chrome; SwiftShader tagged with expectations Skips; hardware Swarming bots are the real bar.
- Perf metrics live in `dawn_perf_tests` — separate from “adapter exists.”
- Headless Chrome needs explicit WebGPU/Vulkan flags; without drivers it falls to software.

### Shaderscript (already settled)
- Runner throws without gpu/adapter/device.
- Harness: EXPECT unset → skip + unverifiable; EXPECT set → fail.
- GPU test file already asserts exact f32 + timing gap string; only the device is missing.

## Recommended approach for this app

1. **Name the slice** — Local WebGPU device for harness (clear hello-compute GPU correctness + timing ACs). Coverage climb is slice 3.
2. **Primary door** — `bun-webgpu` `setupGlobals()` before GPU tests. Escape hatch: npm `webgpu` under Bun → thin Chromium smoke. No `packages/host` first.
3. **Dependency** — `bun-webgpu` as **devDependency** on `@shaderscript/shaderscript`. Soft-fail preload if missing. Human runs Dawn `download_artifacts` once; document in README. Not in CI this slice.
4. **Keep the EXPECT_GPU contract** — No rewrite of skip/fail. Document “how to get a device” in README / harness notes.
5. **Windows leave-draft bar** — Correctness + timing must clear on this Windows + Bun machine (or stay draft with blocker). Escape hatch is in-slice if primary fails here.
6. **Software adapter honesty** — May clear correctness; timing stays caveated/draft without hardware smoke.
7. **CI GPU stays later** — No SwiftShader/Lavapipe job in slice 2. Device-free CI unchanged.
8. **No second package** — Bootstrap lives as harness preload (or a tiny module beside harness), not `packages/host` / `packages/lsp`.

## Grill decisions

### Already settled (no ask)

- [x] Device-free vs GPU split — **Answer:** Keep slice 1 contract (CI device-free; GPU local or unverifiable).
- [x] EXPECT_GPU semantics — **Answer:** unset = skip + unverifiable; set = fail if no device.
- [x] No CPU fallback — **Answer:** Loud failure / skip only.
- [x] No `packages/host` unless forced — **Answer:** Constitution Ask First; prefer in-process Dawn first.
- [x] Fixed heuristics (Scene / symmetric ops / platform client / transition) — **Answer:** N/A (harness prove infra, not a user-facing product slice).

### Resolved in grill

- [x] **Coverage climb** — **Answer:** This research is slice 2 (local/headless WebGPU for harness, clear AC7/AC8). Coverage climb (checklist growth) is slice 3 — do not merge into this slice.
- [x] **Which Dawn door?** — **Answer:** Primary `bun-webgpu` (`setupGlobals()` before GPU tests). Escape hatch order: prove npm `webgpu` under Bun; if both fail on Windows, thin Chromium smoke. Do not invent `packages/host` first; do not lead with browser.
- [x] **Dependency class** — **Answer:** `bun-webgpu` as **devDependency** on `@shaderscript/shaderscript` (prove-only). Harness preload tries `setupGlobals` and soft-fails if missing so device-free CI stays green. Human runs Dawn `download_artifacts` once; document in README. Not in CI for slice 2. Ask First satisfied as explicit prove/dev dep, not a published runtime dep.
- [x] **Windows prove bar** — **Answer:** GPU correctness + timing must clear on this Windows + Bun machine for the slice to leave draft. If primary Dawn fails, run the escape hatch in-slice until Windows proves, or keep draft with that blocker listed. “Works on another OS only” is not enough to clear leave-draft while local `EXPECT_GPU=1` still skips.
- [x] **Software adapter for local smoke** — **Answer:** Software adapter may clear **GPU correctness** (exact f32 vs CPU) when that is the only adapter available. Timing may run and record a gap, but the timing AC stays **caveated / draft** for leave-draft unless a hardware adapter smoked it. Prefer hardware for both when available.
- [x] **CI SwiftShader job** — **Answer:** Explicitly out of slice 2. Keep CI as device-free `test:compile` + `test:harness` without `EXPECT_GPU`. Optional software CI is a later slice after local Windows prove works.

## Sources

- https://developer.chrome.com/docs/web-platform/webgpu/webgpu-ecosystem
- https://developer.chrome.com/blog/supercharge-web-ai-testing
- https://developer.chrome.com/docs/web-platform/webgpu/colab-headless
- https://dawn.googlesource.com/dawn/+/HEAD/src/dawn/node/README.md
- https://dawn.googlesource.com/dawn/+/refs/heads/main/docs/dawn/infra.md
- https://dawn.googlesource.com/dawn/+/HEAD/webgpu-cts/expectations.txt
- https://www.npmjs.com/package/webgpu
- https://github.com/dawn-gpu/node-webgpu
- https://github.com/kommander/bun-webgpu
- https://www.npmjs.com/package/bun-webgpu
- https://raw.githubusercontent.com/kommander/bun-webgpu/main/README.md
- https://github.com/gfx-rs/wgpu/blob/trunk/docs/testing.md
- https://raw.githubusercontent.com/gfx-rs/wgpu/trunk/docs/testing.md
- https://dawn.googlesource.com/dawn/+/HEAD/docs/dawn/testing.md
- https://dawn.googlesource.com/dawn/+/HEAD/webgpu-cts/README.md
- https://gpuweb.github.io/cts/docs/intro/README.md
- https://github.com/software-mansion/TypeGPU/issues/1048
- https://github.com/software-mansion/TypeGPU/blob/main/vitest.config.mts
- https://github.com/software-mansion/TypeGPU/blob/main/.github/workflows/test-unit.yml
- https://github.com/software-mansion/TypeGPU/blob/main/apps/typegpu-docs/vitest.config.mts
- https://docs.swmansion.com/TypeGPU/
- https://github.com/dawn-gpu/webgpu-debug-helper
- https://github.com/nodejs/node/issues/42896
- https://www.npmjs.com/package/@webgpu/types
- `.ai/research/hello-compute.md`
- `.ai/architecture.md`
- `packages/shaderscript/test/harness/gpu.test.ts`
