---
name: plan
description: Turn a finalized spec into a slice-first implementation plan at .ai/plans/{YYYY-MM-DD}-{slug}.md plus one task-{N}.md card per task, with explicit Parallel groups. Every task card must include exact paths, exact commands, expected output, a first example path for UI, an out-of-scope list, and escape hatches. Use after open questions are resolved. Do not use while the spec still has open questions, and do not use it to design — design happens in /spec-writing.
disable-model-invocation: true
---

# plan — implementation plan from a spec

Input: a finalized spec (`.ai/specs/{date}-{slug}.md` with zero unresolved open
questions) or, for small changes, an explicit user description. Output: a plan at
`.ai/plans/{YYYY-MM-DD}-{slug}.md` that `/execute` can follow with no session
memory.

Write the plan for an executor that **did not see this chat**: exact paths, steps,
verify commands, out of scope, and escape hatches must stand alone. Do **not**
re-teach design the spec already settled. Cite spec section anchors; leave
rationale in the spec.

**Announce at start:** "Using the plan skill — turning the spec into an
implementation plan."

**Human gate after this skill:** do not run `/execute` until the user approves
the plan.

## Small-change escape

If the work is a 1–2 file fix with a clear prove command, skip the full
spec/plan tax. Point the user at `/fix` (or a tiny plan with one task) instead
of a multi-task layer cake.

## Step 1: Check prerequisites

1. Read the spec. If any Open Question is unchecked → **STOP** and return to
   `/spec-writing` / `/grill`. Do not plan around an open question.
2. Read `.ai/lessons.md` (you are the plan author — full file is fine). Note
   which **Tags** matter for this work. Any package/module `AGENTS.md` the work
   touches.
3. Read matching guides from the root `AGENTS.md` Task Router. Prefer first
   example paths over inventing patterns.
4. Prefer vertical-slice first examples when present. Cap first-example reading
   to paths the tasks will name — do not tour the repo “for inspiration.”

## Step 2: Decompose into tasks (slice-first)

- One task = one verifiable unit of work. If a task cannot be verified by a
  single command or a single browser check, split it.
- **Default order: slice-first.** Prefer tasks that deliver one vertical path
  (UI → logic → data for that slice), then the next slice.
- Use layer order (shared migrate / models / service / routes / UI) **only when
  a shared foundation truly blocks every slice**. Say so in the plan. Do not
  default to migrate→models→service→routes→UI.
- For every UI task, name the **first example**: the file path to copy from
  (`AGENTS.md` first examples table, or nearest neighbor). Do not design UI from
  concepts alone.
- Maximize independent tasks. Split by **file ownership** so parallel workers
  never share a file. Never invent fake dependencies.
- Challenge bloat (Raptor): reject speculative shared layers, “for later”
  packages, and long single chains when 2+ tasks could run together.

## Step 3: Write each task

Write every task to its own card: `.ai/plans/{YYYY-MM-DD}-{slug}/task-{N}.md`,
≤80 lines. The main plan file never repeats task text. Every card uses exactly
this shape:

````markdown
# Task N: {imperative title}

**Depends on:** {task numbers, or "none"}
**Spec:** {path} § {section anchor}   <!-- cite; do not restate design -->
**Plan:** {plan path} ({shared contract section, if the card cites one})
**Files:**
- Create: `{exact path}`
- Modify: `{exact path}` — {what changes}
- Copy from (first example): `{exact path}`   <!-- required for UI; N/A with reason otherwise -->

**Steps:**
1. {exact instruction; include signatures, SQL, or the first example to copy}
2. ...

**Verify:**
```bash
{exact command using bun where applicable}
# Expected: {what the output must contain}
```

**Out of scope:**
- {thing that looks related but must NOT be touched}

**Escape hatches:**
- If {assumption} is false, STOP and report — do not improvise.
````

### Hard requirements (every task)

These are mandatory. A plan missing any of them is not ready for approval:

1. **Exact paths** — create/modify/copy-from paths are real repo paths, not
   globs or "somewhere under `src/`".
2. **Exact commands** — full commands the executor will run (prefer `bun`
   / `bun test` / `bun run <script>`). No "run the usual checks".
3. **Expected output** — what a passing Verify block must show.
4. **First example path for UI** — every UI task names a file to copy. If no first example
   exists yet, say so and point at the supervised first example build, or STOP and
   ask the human to mint one.
5. **Out-of-scope list** — at least one concrete nearby thing not to touch
   (or an explicit `none — isolated change` with why).
6. **Escape hatches** — at least one "If assumption X is false, STOP" line when
   the task rests on an assumption (schema exists, env var set, first example path
   still valid, seed data present, and so on).

Hard rules for stack and proof:

- Prefer bun. Do not plan `pnpm` or `npm` commands unless the app's own docs
  force a one-off exception (then say why).
- Verification is scoped. Do not plan a whole-monorepo typecheck that will thrash
  the machine when a package-scoped command exists.
- Final proof / ship task: packages touched in this plan + one integration set.
  Full monorepo ladder once before PR if needed — not after every group.
- No placeholders: no "TBD", no "similar to Task 3", no "add appropriate logic".
  If you cannot specify it, the spec is incomplete — go back.
- Cover every acceptance criterion in the spec with at least one task. For
  user-facing work, the final proof task routes through `/test` (or the prove
  command for this change type).
- **No design restatement.** Do not copy activity tables, door lists, or decision
  rationales from the spec into the plan or into a “Shared reference” group
  preamble. Cite the spec. Steps say what to build and where; the spec says why.

Red flags — if you write any of these, the task is under-specified; fix it:

- "similar to the previous task" / "as appropriate" / "etc."
- a Verify block with no expected output
- a UI task with no first example file path
- a task with no out-of-scope list and no escape hatch
- a long single dependency chain when 2+ tasks have disjoint files and no real
  shared blocker
- a multi-page “Shared reference” that duplicates the spec

## Step 4: Require ## Parallel groups

After decomposition, every plan **must** include an explicit section:

```markdown
## Parallel groups

### Group A
**Depends on:** none
**Tasks:** 1, 2, 3
**Files disjoint:** yes
**Workers:** fan out one subagent (or Multitask worker) per task

### Group B
**Depends on:** Group A
**Tasks:** 4, 5
**Files disjoint:** yes
**Workers:** fan out one subagent per task

### Group C
**Depends on:** Group B
**Tasks:** 6
**Files disjoint:** n/a (single task)
**Workers:** parent agent
```

Rules for this section:

- Group tasks that have **Depends on: none** (or only completed groups) and
  **disjoint file sets**.
- Maximize independent tasks; split by file ownership.
- Never invent fake dependencies to force a chain.
- If you wrote a long single chain and 2+ tasks could run together, **reject and
  rewrite** before presenting the plan.
- Note when Multitask / subagents should be used for a group (default for any
  group with 2+ ready tasks).
- Each worker gets **only its `task-N.md` card**. Do not write group preamble
  files. Do not point workers at the main plan for task text — the parent
  alone uses the main plan for Progress. A card may cite one shared contract
  section (e.g. a locked module API) by name when the task needs it.

## Step 5: Write the plan file

Save the plan to `.ai/plans/{YYYY-MM-DD}-{slug}.md` and each task card to
`.ai/plans/{YYYY-MM-DD}-{slug}/task-{N}.md` (today's date, same slug as the
spec):

```markdown
# {Feature} — implementation plan

**Spec:** .ai/specs/{date}-{slug}.md
**Research:** .ai/research/{slug}.md (or N/A)
**Branch:** {branch name}
**Status:** draft — waiting for approval
**Ordering:** slice-first (or: shared foundation required — why)
**Lessons:** {tags, e.g. store, bot-discord — or a ≤40-line digest path}
  <!-- workers read only this; plan author already read the full lessons file -->

## Progress
Task text lives only in the linked cards; workers read their card, never this
file. The parent alone edits Progress.
- [ ] Task 1: {title} — [task-1.md]({date}-{slug}/task-1.md)
- [ ] Task 2: {title} — [task-2.md]({date}-{slug}/task-2.md)

## Parallel groups
{Group A / B / … as above}

## Dependencies
{short summary that matches Parallel groups — no fake chains}

## {Shared contract — optional, e.g. Locked module API}
{interfaces or signatures several tasks must implement exactly; cards cite
this section by name}

## Global out of scope
- {items that apply to the whole plan}

## Global escape hatches
- If {assumption} is false, STOP and report — do not improvise.
```

The main plan carries tracker + contract only. Keep each fact in one file:
task text in its card, shared contracts in the plan. Fix a task in its card;
fix a contract in the plan.

The Progress checklist is the live tracker — the `/execute` **parent** checks
items off in this file, one task at a time after each serial commit. Implementers
and `/check-and-commit` must not edit it (parallel writes clobber). Do not
create a separate todo file.

## Step 6: Self-check, then present for approval

- [ ] Slice-first unless a shared foundation truly blocks every slice
- [ ] `## Parallel groups` present, honest, and maximized
- [ ] No long fake chain when 2+ tasks could run together
- [ ] Task text lives only in cards; the main plan has no `## Task N` sections
- [ ] Every task has exact paths, exact commands, and expected output
- [ ] Every UI task names its first example file
- [ ] Every task has an out-of-scope list and escape hatches
- [ ] Every acceptance criterion in the spec is covered
- [ ] Design stays in the spec — plan cites, does not restate
- [ ] **Lessons** line present (tags or short digest)
- [ ] Commands use bun (or document any exception)
- [ ] No speculative layers
- [ ] Final proof is scoped (touched packages + integration), not a ritual full ladder

Present the plan path and a one-paragraph summary. **Wait for human approval.**
Only after approval, set `Status: approved` in the plan file and hand off to
`/execute`.
