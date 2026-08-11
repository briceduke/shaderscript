# AGENTS.md

Router for agents in this app. Keep under ~300 lines. Put depth in `.ai/` files.

## Always

- Use plain English in all text you write: rules, skills, docs, comments, commit messages, and CLI output.
- Follow ASD-STE100 intent and Orwell’s six rules:
  1. Do not use metaphor, simile, or stock phrases.
  2. Prefer a short word to a long word.
  3. Cut each word you can cut.
  4. Use active voice.
  5. Prefer everyday English to jargon. Keep required product names (Cursor, Neon, bun) as proper nouns.
  6. Break a rule only if the result would be unclear or false.
- Keep fixed technical tokens as they are: file paths, command names, package names, env keys, label names.
- Prefer the design with fewer parts that still meets the need (Raptor 3 / milspec). See `.ai/rules/raptor-milspec.md`.
- Every part must earn its keep: if removing it makes change easier, remove it.
- Prefer one vertical slice that ships over layers that wait for each other.
- Prefer an obvious seam (swap or mock the dependency) over a clever abstraction.
- Do not add “in case we need it later.”
- When two options work, pick the one a mechanic can unscrew without a manual.
- Treat `.ai/` as the single source of truth for rules, skills, lessons, specs, plans, runs, and research.
- Before non-trivial work: plan authors, grill, spec, and constitution read `.ai/lessons.md`. Execute workers read only the plan’s **Lessons** tags or ≤40-line digest (not the full file). Append a lesson after every correction.
- Follow the Task Router. Do not invent a side process.
- Copy the nearest first example when one exists for the pattern you are building.
- Use proved / disproved / can’t tell yet. Absence of proof is not disproof.
- Treat a verification you did not run as failed.
- Ship work you can’t prove only as a draft PR flagged for human checks. Do not drop it silently.
- If a change makes this file stale, fix this file in the same branch.
- Commit only through `/check-and-commit`.

## Ask First

- Any frozen surface listed in `BACKWARD_COMPATIBILITY.md` (none yet).
- New production dependencies.
- Splitting `packages/shaderscript` into more packages (needs a second consumer).
- Adding `packages/lsp`, `packages/vite-plugin`, `packages/host`, or a database package.
- Inventing custom dialect syntax (GPU source must stay real TypeScript).
- Claiming “matches hand-optimized WGSL” or complete coverage without harness numbers.
- Raising how much work may run without you.

## Never

- Grade your own homework. Use the readonly judge subagent for verdicts.
- Point any agent or script at production data or production parents.
- Branch a database from a production ref when you have one. Branch from the seed.
- Commit outside `/check-and-commit`.
- Invent a second layout when a first example already covers the pattern.
- Add an exception list entry without a written reason. Prefer zero exceptions.
- Treat a demo alone as proof. Harness coverage, correctness, and timing are required.
- Block the spine on CI GPU day one. Subset + compile always in CI; GPU bars are local or flagged unverifiable until headless WebGPU exists.
- Add empty conformance/invariants/clobbers scanners “for later.”

## Validation

Run these to prove health.

| Check | Command | When |
|-------|---------|------|
| Structure | `bun run checks:structure` | Before commit; CI |
| Subset / compiler (no GPU) | `bun run test:compile` | Before commit; CI |
| Harness spine | `bun run test:harness` | Before commit; CI (device-free + GPU skip/unverifiable). Local GPU prove: set `SHADERSCRIPT_EXPECT_GPU=1` |
| Structure-only change | `bun run checks:structure` | Enough when only structure config changed |

Add conformance or invariant scripts only when constitution invents a real rule — not empty scanners “for later.”

## Task Router

| Task | Guide |
|------|--------|
| New here / how AIDLC works | `.ai/docs/how-aidlc-works.md` |
| Product brief (day zero) | `.ai/skills/product` |
| High-level design | `.ai/skills/architecture` · `.ai/docs/architecture-overview.md` |
| Technical rules (second pass) | `.ai/skills/constitution` · `.ai/docs/constitution-overview.md` |
| New feature | `research` (optional; domain peers or short platform note) → Scene+Client contract in grill/spec when user-facing/client → `grill` (undecided) → `spec-writing` → raptor check (risky slices) → `plan` → `execute` → `test` + human smoke for unverifiable → `judge` (leave-draft) |
| Risky slice raptor | Readonly pass on `.ai/rules/raptor-milspec.md` before plan approval / execute |
| Ship / leave-draft | Readonly `judge` agent (`.cursor/agents/judge.md`); self-review is optional hygiene only |
| Small fix (1–2 files, clear prove command) | Skip full spec/plan; fix → prove → `/check-and-commit` |
| Smoke nit after slice ship | Parent `/fix` → prove → `/check-and-commit` (no root-cause fan-out) |
| Bug (unknown / multi-file) | `.ai/skills/root-cause` → `fix` → `test` → `check-and-commit` |
| Commit | `.ai/skills/check-and-commit` only |
| Context / where truth lives | `.ai/docs/context-system.md` |
| Proof and evidence | `.ai/docs/proof-and-evidence.md` |
| Patterns to copy / first examples | `.ai/docs/greenfield-and-exemplars.md` |
| Stability tiers | `BACKWARD_COMPATIBILITY.md` |

## Constitution

Filled by `/constitution` from `.ai/product.md` and `.ai/architecture.md`.

1. **Scoping axis:** none (library / toolchain; no tenant, auth, or persisted app data)
2. **Data access door:** none (no database)
3. **Hard rules (2–4):**
   - Real TypeScript only — no custom dialect; GPU-only ideas use ordinary TS (functions, types, annotations)
   - One package `packages/shaderscript` for checker + compiler + thin runner until a second consumer forces a seam
   - Harness is the prove path — fixed WGSL checklist 1:1 with tests; correctness vs reference; timing vs hand WGSL
   - CI always runs subset + compile; GPU correctness/timing are local prove or flagged unverifiable until headless WebGPU exists
4. **Patterns to copy:** Hello compute vertical slice (kernel → check → WGSL → run → harness). First example: `packages/shaderscript`. Encode folder rules in `packages/checks/configs/structure.ts`.
5. **Proof ladder:** `checks:structure` → `test:compile` (CI) → `test:harness` (GPU bars local / unverifiable in CI as needed)
6. **Frozen surfaces:** none yet (see `BACKWARD_COMPATIBILITY.md`)
7. **Who drives work:** you drive. Prove infra: none beyond a local WebGPU device for harness bars. Raise autonomy only with evidence.

## First examples

First supervised build of each pattern to copy. Prefer a vertical slice (one thin path end to end). Mint a First examples row the week a new pattern ships (a second instance would otherwise invent).

| Pattern | First example path | What it shows |
|---------|--------------------|---------------|
| Hello compute (kernel → check → WGSL → run → harness) | `packages/shaderscript` | End-to-end subset TS → WGSL → WebGPU; harness coverage + CPU ref + timing vs hand WGSL |

## Cloud types

**Send freely:** ready small work items (bug, copy, usability) with test-shaped proof; test- or typecheck-provable work; plan fan-out (one agent per independent task, own branch); `@cursor` PR-feedback fixes; read-only root-cause briefs; research and spec drafts; docs and lessons upkeep; read-only audits.

**Keep out:** unresolved design questions; ask-first territory; schema changes without a provisioned branch; anything pointed at production; whole multi-phase features (fan out only the execute step).

**Dispatch hygiene:** give a cloud agent exactly what a doer gets: work item + notes, precedent paths, verify commands, out-of-scope list, Lessons tags/digest (not the full lessons file), and branch connection strings via environment config. Task N card only — not the whole plan.
