# Task 7: Wire CI, mint First examples row, run device-free proof

**Depends on:** 6
**Spec:** .ai/specs/2026-08-10-hello-compute.md § Acceptance criteria; Proof plan
**Plan:** .ai/plans/2026-08-10-hello-compute.md
**Lessons tags:** process, platform, product

**Files:**
- Modify: `packages/shaderscript/src/index.ts` — barrel exports
- Modify: `.github/workflows/ci.yml` — `test:compile`; `test:harness` without `SHADERSCRIPT_EXPECT_GPU`
- Modify: `AGENTS.md` — First examples Hello compute → `packages/shaderscript` (shipped); Validation table: drop stale "(add script with packages/shaderscript)" notes
- Modify: `README.md` — Now checkboxes + scripts + `SHADERSCRIPT_EXPECT_GPU`
- Copy from: N/A

**Steps:**
1. Export idioms, check/compile, runner, normalize, checklist helpers.
2. CI: after the Structure step add `bun run test:compile`; add `bun run test:harness` without `SHADERSCRIPT_EXPECT_GPU` so GPU bars stay unverifiable, not failed.
3. One First examples row only. Update README try commands.
4. Run device-free ladder. Do not claim CI GPU proof.
5. Confirm no Task 1 placeholder tests (`expect(true).toBe(true)`) remain under `packages/shaderscript/test/`.

**Verify:**
```bash
bun run checks:structure
bun run test:compile
bun run test:harness
# Expected: all exit 0; GPU bars skip/unverifiable unless device exists
```

**Out of scope:** Fake CI GPU proof; opening PR; commits except via parent `/check-and-commit`.

**Escape hatches:** If device-free harness fails, STOP — do not drop harness from CI. Do not invent a second First examples path.
