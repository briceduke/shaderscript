import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { compileKernelSource } from "../../src/compiler.ts";
import { normalizeWgsl } from "../../src/normalize-wgsl.ts";

function readKernel(name: string): string {
  return readFileSync(join(import.meta.dir, "../../fixtures/kernels", name), "utf8");
}

function readGolden(name: string): string {
  return readFileSync(join(import.meta.dir, "../../fixtures/golden", name), "utf8");
}

test("hello-add compiles to golden WGSL", () => {
  const source = readKernel("hello-add.ts");
  const result = compileKernelSource(source, "hello-add.ts");
  expect(result.ok).toBe(true);
  if (!result.ok) {
    return;
  }
  const golden = readGolden("hello-add.wgsl");
  expect(normalizeWgsl(result.wgsl)).toBe(normalizeWgsl(golden));
});

test("hello-add bindings are 0, 1, 2 in order", () => {
  const source = readKernel("hello-add.ts");
  const result = compileKernelSource(source, "hello-add.ts");
  expect(result.ok).toBe(true);
  if (!result.ok) {
    return;
  }
  const bindingOrder = [...result.wgsl.matchAll(/@binding\((\d+)\)/g)].map((m) => m[1]);
  expect(bindingOrder).toEqual(["0", "1", "2"]);
});

test("reject-no-use-gpu yields ok false with no wgsl", () => {
  const source = readKernel("reject-no-use-gpu.ts");
  const result = compileKernelSource(source, "reject-no-use-gpu.ts");
  expect(result.ok).toBe(false);
  if (result.ok) {
    return;
  }
  expect(result.diagnostics.length).toBeGreaterThan(0);
  expect("wgsl" in result).toBe(false);
});

test("reject-unsupported yields ok false with no wgsl", () => {
  const source = readKernel("reject-unsupported.ts");
  const result = compileKernelSource(source, "reject-unsupported.ts");
  expect(result.ok).toBe(false);
  if (result.ok) {
    return;
  }
  expect(result.diagnostics.length).toBeGreaterThan(0);
  expect("wgsl" in result).toBe(false);
});
