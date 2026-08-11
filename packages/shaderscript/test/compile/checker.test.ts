import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { checkSource } from "../../src/checker.ts";

function readFixture(name: string): string {
  return readFileSync(join(import.meta.dir, "../../fixtures/kernels", name), "utf8");
}

test("hello-add is accepted", () => {
  const source = readFixture("hello-add.ts");
  const result = checkSource(source, "hello-add.ts");
  expect(result.ok).toBe(true);
  expect(result.diagnostics).toEqual([]);
});

test("reject-no-use-gpu is rejected", () => {
  const source = readFixture("reject-no-use-gpu.ts");
  const result = checkSource(source, "reject-no-use-gpu.ts");
  expect(result.ok).toBe(false);
  expect(result.diagnostics.length).toBeGreaterThan(0);
  expect(result.diagnostics.some((d) => d.message.includes("use gpu"))).toBe(true);
});

test("reject-unsupported is rejected", () => {
  const source = readFixture("reject-unsupported.ts");
  const result = checkSource(source, "reject-unsupported.ts");
  expect(result.ok).toBe(false);
  expect(result.diagnostics.length).toBeGreaterThan(0);
  expect(
    result.diagnostics.some(
      (d) => d.message.includes("+") || d.message.includes("unsupported") || d.message.includes("element"),
    ),
  ).toBe(true);
});
