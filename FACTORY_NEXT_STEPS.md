# Factory next steps

App folder: `C:\Users\brice\dev\shaderscript`

Do these in order. Do not stop at “init finished.”

1. Open the app folder in Cursor. In a shell: cd C:\Users\brice\dev\shaderscript

2. From the app folder, run `bun install`. The `prepare` script runs `factory install-rules` and writes `.cursor/rules` and `.cursor/commands`.

3. If you are new to AIDLC, read `.ai/docs/how-aidlc-works.md` before you write features. It explains the process in plain English.

4. Run `/product` first. Write `.ai/product.md` (what this product is, who it is for, what it does, what success looks like).

5. Run `/architecture`. Write `.ai/architecture.md` (boundaries, data needs, and whether you need a database).

6. Run `/constitution` as the technical second pass. Fill the seven blanks in AGENTS.md from the settled product and architecture.

7. Build the first examples of each pattern to copy, supervised (day 1–3). Prefer one thin path end to end. See `.ai/docs/greenfield-and-exemplars.md`. Add each to the First examples table in AGENTS.md.

8. Run `bun run checks:structure`. CI uses the same script.

9. This is a lean stamp. Keep rails small until the app earns them (structure check, lessons, commit gate stay).

10. Add a database package only if `.ai/architecture.md` says you need persisted data, then re-run `/constitution` for the data access door.

## Pointers

- Product skill: `.ai/skills/product`
- Architecture skill: `.ai/skills/architecture`
- Constitution skill: `.ai/skills/constitution`
- First examples: `.ai/docs/greenfield-and-exemplars.md`
- How AIDLC works: `.ai/docs/how-aidlc-works.md`
- Agent router: `AGENTS.md`
