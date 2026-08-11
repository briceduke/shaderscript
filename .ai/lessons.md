# Lessons

Append after every correction. Plan authors, grill, spec, and constitution read
this file before non-trivial work. Execute workers use only the plan’s
**Lessons** tags or ≤40-line digest — not this whole file.

Schema for each entry: **Context → Problem → Rule → Applies to**, plus optional
**Tags:** Prefer `process` / `platform` / `product` when useful (add domain tags
like `bot-discord` as needed). Untagged entries count as general process. After
2+ hits in a tag that imply a missing grill/spec heuristic, update that skill in
the same branch as the next related slice (not someday).

---

## Context

Agents treat “no failing test” as proof that a change is safe.

## Problem

Absence of proof is not disproof. Unchecked work ships as if verified.

## Rule

Use the proof trichotomy: proved, disproved, or unverifiable. A check you did not run counts as failed. Flag unverifiable work for a human.

## Applies to

All features, bugs, PRs, and cloud-agent tasks.

---

## Context

A new repo has no neighbor screens or modules to copy.

## Problem

Agent #1 invents a shape; agent #2 invents another. Week-two brownfield in a two-week-old app.

## Rule

Mint the first instance of each pattern to copy supervised. Record it in AGENTS.md First examples. Copy the first example until real neighbors exist.

## Applies to

First module, route, form, system, command, and any new pattern type.

---

## Context

Checks packages often ship with a grandfathering baseline for legacy debt.

## Problem

In a greenfield app, agents treat the baseline as a place to dump new debt without review.

## Rule

Keep the baseline empty. Adding an entry needs a written reason and Ask First. Target: permanently zero.

## Applies to

`packages/checks` baseline files and any exception list.

---

## Context

Chat and local memory feel faster than opening `.ai/` files.

## Problem

Rules, lessons, and plans drift. Later agents miss corrections that already happened.

## Rule

`.ai/` is the source of truth. Read lessons before non-trivial work. Append lessons after corrections. Fix a stale AGENTS.md in the same branch.

## Applies to

All non-trivial work and any edit that changes process or constitution.

---

## Context

Agents can commit from many skills or ad-hoc shell commands.

## Problem

Gates get skipped. Bad commits land. History loses the one-door audit trail.

## Rule

Commit only through `/check-and-commit`. No other skill commits.

## Applies to

Every commit on every branch.

---

## Context

Greenfield stamps copied the full Carbon line: empty multi-scanners, DB stubs, conductor, automations, and constitution-first day zero.

## Problem

Empty scanners and DB stubs are debt. Agents treat them as real work. Constitution before product and architecture locks technical rails before the product is clear. Soft “optional” parallel notes let one agent eat a whole plan.

## Rule

Stamp a lean MVP: structure check only; no DB until architecture says so; product → architecture → constitution; vertical slices; parallel groups in plans; fan-out execute by default when files do not overlap. Prefer fewer parts (Raptor 3 / milspec).

## Applies to

`factory init`, seed template, day-zero skills, plan/execute, and AGENTS Always.

---

## Context

Init used `--profile saas|b2c|game|bot|minimal` to pre-fill constitution drafts and write `factory.json.profile`.

## Problem

Fake app types at stamp time are debt. They pretend the product was decided before `/product` and `/architecture`. Agents copy the draft instead of inventing structure from the real product.

## Rule

One lean stamp. No profile enum. Product says what this product is in freeform words. Architecture derives structure. Constitution only locks settled design. Name repeated layouts as **patterns to copy** and record the **first example** path in plain English — not “canonical shape” or hollow exemplar jargon.

## Applies to

`factory init`, `factory.json`, AGENTS First examples table, constitution Q4, and day-zero skills.

---

## Context

`/execute` fans out implementers, then the parent spawns a `/check-and-commit`
subagent as each task finishes (even one at a time).

## Problem

Each commit agent pays a full cold start (skill + lessons + plan) and often
re-runs the same package gates the implementer already reported. Concurrent
commits also race on git and clobber the plan Progress checklist.

## Rule

Parallelism stops at implementation. The commit lane is serial and **parent
in-process**: one verify (or trust a thick done report) → `/check-and-commit` in
the parent session → Progress checkbox. Do not spawn a commit agent per task.
Implementers never edit `.ai/plans/`.

## Applies to

`/execute`, `/check-and-commit`, plan Progress lists, Multitask and subagent fan-out.

**Tags:** process, execute

---

## Context

Execute worker briefs say “read `.ai/lessons.md` and the group/main plan” for
every implement and every smoke fix.

## Problem

Cold-start agents re-load the same long context. Design already lives in the
spec; group preambles restate it; lessons restate AGENTS hard rules. Token cost
scales with agent count, not with human gates.

## Rule

Worker brief = Task N card only (≤80 lines). Plan cites the spec; does not
restate design. Plan lists **Lessons** tags or a short digest; workers read that
only. After slice ship, smoke nits use parent `/fix` + one commit — not a
root-cause → fix → commit agent chain.

## Applies to

`/plan`, `/execute`, worker briefs, post-smoke fixes, `.ai/lessons.md` tags.

**Tags:** process, execute, plan

---

## Context

The seed kept `packages/database` stubs and an omit list for conductor / automations / groomer that were not even in the template. Agent-label wake workflow sat unused.

## Problem

Deferred stubs in the factory repo are still debt. “Omit on stamp” pretends the junk is intentional inventory. Agents and humans waste time wondering why it exists.

## Rule

The template only contains what we stamp. No DB stubs. No ghost omit paths. Add a database package (or wake loop) in a real app when architecture proves the need — do not keep a half-built copy “for later” in the seed.

## Applies to

`template/`, `getOmittedTemplatePaths`, factory-owned paths, and graduate-later docs.

---

## Context

Player or platform truth (ACK, naming, permissions, rate limits) was learned after
`/execute` had already shaped handlers and contracts.

## Problem

Work that looked green in CI failed in the real client. Specs and plans missed
the scene + client contract. Unverifiable smoke was skipped until ship.

## Rule

Require Scene + Client contract + unverifiable smoke before execute. Put scene
and client contract into grill/spec. List unverifiable items and the named human
smoke script in the proof plan before execute. Run the readonly judge on ship.
After 2+ tagged hits that imply a missing grill/spec heuristic, promote that
lesson into the skill in the same branch as the next related slice.

## Applies to

Grill, spec-writing, plan Proof sections, execute, test, and ship gates when a
client surface is new or unsettled.

**Tags:** process

---

## Context

Shaderscript GPU source is marketed as a real TypeScript subset.

## Problem

Agents invent TypeScript-like dialect syntax for workgroup memory, barriers, or other GPU-only ideas. That breaks the product claim and forces a second language.

## Rule

GPU source stays real TypeScript. GPU-only ideas use ordinary TypeScript (library functions, types, annotations). Reject custom dialect syntax. Checker and compiler own the subset.

## Applies to

Subset checker, compiler, idioms, LSP/lint later, and any kernel authoring path.

**Tags:** product, platform

---

## Context

Architecture settled one package for checker + compiler + thin runner.

## Problem

Agents split `packages/lsp`, `packages/vite-plugin`, `packages/host`, or more compiler packages on day one “for cleanliness.” Extra seams before a second consumer.

## Rule

Keep checker, compiler, and thin runner in `packages/shaderscript` until a second consumer forces a seam. Ask first before adding those packages or a database package.

## Applies to

Package layout, structure check, day-zero and early slices.

**Tags:** platform, process

---

## Context

Product success is coverage percent, correctness vs reference, and timing vs hand WGSL.

## Problem

A demo that “looks fine” ships as proof. Coverage counts get fuzzy. Performance claims have no baseline.

## Rule

The harness is the prove path: fixed WGSL checklist mapped 1:1 to tests, correctness vs CPU reference and/or hand WGSL, timing vs hand-WGSL twin. A demo alone is not enough.

## Applies to

Compiler work, kernel slices, CI prove, ship claims, and cloud-agent tasks.

**Tags:** product, process

---

## Context

WebGPU is not always available in CI.

## Problem

Agents block the spine or fail CI on GPU correctness/timing when no device exists, or they skip subset/compile tests that always can run.

## Rule

CI always runs subset + compile. GPU correctness and timing are local prove or flagged unverifiable until headless WebGPU exists. Do not block the spine on CI GPU day one.

## Applies to

Proof ladder, CI config, harness tests, and draft PRs with unverifiable GPU bars.

**Tags:** platform, process

---

## Context

Plan audit before execute found: a tsconfig copied from a neighbor package would have excluded the fixture it was meant to typecheck (vacuous green), a locked "do not redesign" API that could not typecheck its own fixture, and a parallel group whose verify bar secretly depended on a sibling task's behavior.

## Problem

A verify command that never sees the target file passes without proving anything. A locked contract that contradicts its own example forces workers to stall or silently deviate. File-disjoint tasks can still be behavior-dependent (a golden test needs the real checker, not just its stub signature).

## Rule

At plan time: trace each verify command to the files it actually checks; make locked APIs typecheck against the plan's own fixture code before locking them; treat "parallel" as file-disjoint AND behavior-disjoint — a task whose tests exercise another task's real output starts after it.

## Applies to

`/plan`, plan audits, worker briefs, locked module APIs, and any copied tsconfig or config scaffold.

**Tags:** process, plan

---

## Context

Plans carried full task text in the main plan file and again in per-task card files.

## Problem

Two copies of every task drift: each plan fix lands twice or diverges. Workers never read the main plan, so its copy of the task text is dead weight.

## Rule

Task text lives only in `task-N.md` cards. The main plan carries the tracker (Progress with card links), parallel groups, dependencies, shared contracts (locked APIs), and global scope. Fix a task in its card; fix a contract in the plan.

## Applies to

`/plan`, plan audits, `/execute` worker briefs.

**Tags:** process, plan

---

## Context

Slice 2 wired `bun-webgpu` preload. Published npm layout has no `dawn/download_artifacts.ts`; platform optionalDependencies ship the native lib. On Linux without Vulkan, `setupGlobals` still succeeds and Dawn returns a **null-backend** adapter that acquires a device and returns garbage f32.

## Problem

Locked download path and “device present → run GPU asserts” treat null-backend as a real device. Device-free `test:harness` fails in CI/cloud even when EXPECT is unset. README that documents a missing download script misleads humans.

## Rule

After `bun-webgpu` install, inspect the real on-disk layout before locking docs. Treat Dawn `null-backend` (adapter.info.device / backendType Null) as **no usable device** — skip + unverifiable when EXPECT unset; fail loud when EXPECT=1. Do not equate null-backend with a software/fallback adapter.

## Applies to

`/execute` harness preload, local WebGPU prove, README Dawn setup, CI device-free gates.

**Tags:** platform, execute, harness
