import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { coveragePercent } from "../../harness/checklist.ts";
import { cpuAddF32 } from "../../harness/cpu-ref.ts";
import {
  assertExactF32Equal,
  formatCoverageReport,
} from "../../harness/run.ts";
import { compileKernelSource } from "../../src/compiler.ts";
import { normalizeWgsl } from "../../src/normalize-wgsl.ts";

function readKernel(name: string): string {
  return readFileSync(
    join(import.meta.dir, "../../fixtures/kernels", name),
    "utf8",
  );
}

function readGolden(name: string): string {
  return readFileSync(
    join(import.meta.dir, "../../fixtures/golden", name),
    "utf8",
  );
}

test("device-free hello-add golden via compile+normalize", () => {
  const source = readKernel("hello-add.ts");
  const result = compileKernelSource(source, "hello-add.ts");
  expect(result.ok).toBe(true);
  if (!result.ok) {
    return;
  }
  const golden = readGolden("hello-add.wgsl");
  expect(normalizeWgsl(result.wgsl)).toBe(normalizeWgsl(golden));
});

test("device-free CPU ref out[i]=a[i]+b[i]", () => {
  const a = new Float32Array([1, 2, 3, 4]);
  const b = new Float32Array([10, 20, 30, 40]);
  const out = cpuAddF32(a, b);
  expect(Array.from(out)).toEqual([11, 22, 33, 44]);
});

test("device-free coverage reported for hello-add-f32", () => {
  expect(coveragePercent()).toBe(100);
  const report = formatCoverageReport();
  expect(report).toContain("hello-add-f32");
  expect(report).toContain("coverage");
  console.log(report);
});

test("wrong-results assertExactF32Equal fails on unequal arrays", () => {
  const actual = new Float32Array([1, 2, 3]);
  const expected = new Float32Array([1, 2, 9]);
  expect(() => assertExactF32Equal(actual, expected)).toThrow(/mismatch/);
});
