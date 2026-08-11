import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cpuAddF32 } from "../../harness/cpu-ref.ts";
import {
  assertExactF32Equal,
  expectsGpu,
  formatTimingGap,
  runGpuCorrectnessAsync,
  tryAcquireDeviceAsync,
} from "../../harness/run.ts";
import { compileKernelSource } from "../../src/compiler.ts";

function readKernel(name: string): string {
  return readFileSync(
    join(import.meta.dir, "../../fixtures/kernels", name),
    "utf8",
  );
}

function readTwin(name: string): string {
  return readFileSync(
    join(import.meta.dir, "../../fixtures/twins", name),
    "utf8",
  );
}

test("gpu hello-add correctness and timing vs twin", async () => {
  const acquired = await tryAcquireDeviceAsync();
  if (!acquired.ok) {
    if (expectsGpu()) {
      throw new Error(
        `SHADERSCRIPT_EXPECT_GPU=1 but device missing: ${acquired.reason}`,
      );
    }
    console.log(`unverifiable: GPU lane skipped (${acquired.reason})`);
    return;
  }

  const source = readKernel("hello-add.ts");
  const compiled = compileKernelSource(source, "hello-add.ts");
  expect(compiled.ok).toBe(true);
  if (!compiled.ok) {
    return;
  }

  const a = new Float32Array([1.5, -2, 0.25, 8]);
  const b = new Float32Array([0.5, 3, 0.75, -1]);
  const expected = cpuAddF32(a, b);
  const twinWgsl = readTwin("hello-add.wgsl");

  const emitRun = await runGpuCorrectnessAsync(
    acquired.device,
    compiled.wgsl,
    [a, b],
    expected.length,
  );
  assertExactF32Equal(emitRun.actual, expected);

  const twinRun = await runGpuCorrectnessAsync(
    acquired.device,
    twinWgsl,
    [a, b],
    expected.length,
  );
  assertExactF32Equal(twinRun.actual, expected);

  const timing = formatTimingGap(emitRun.elapsedMs, twinRun.elapsedMs);
  expect(timing.toLowerCase()).not.toContain("optimized");
  console.log(timing);
});
