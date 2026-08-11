import { checklist, coveragePercent } from "./checklist.ts";
import {
  requestDeviceOrThrowAsync,
  runComputeReadbackAsync,
} from "../src/runner.ts";

/**
 * Asserts two Float32Arrays are exactly equal (bit-identical values).
 * @param actual - Observed values.
 * @param expected - Reference values.
 * @throws If lengths or any element differ.
 */
export function assertExactF32Equal(
  actual: Float32Array,
  expected: Float32Array,
): void {
  if (actual.length !== expected.length) {
    throw new Error(
      `f32 length mismatch: actual ${actual.length} vs expected ${expected.length}`,
    );
  }
  for (let i = 0; i < actual.length; i++) {
    if (actual[i] !== expected[i]) {
      throw new Error(
        `f32 mismatch at ${i}: actual ${actual[i]} vs expected ${expected[i]}`,
      );
    }
  }
}

/**
 * Coverage report string for harness output.
 * @returns Human-readable coverage line.
 */
export function formatCoverageReport(): string {
  const ids = checklist.map((row) => `${row.id}:${row.covered ? "yes" : "no"}`);
  return `coverage ${coveragePercent()}% [${ids.join(", ")}]`;
}

/**
 * Whether local GPU prove is required for this process.
 * @returns True when SHADERSCRIPT_EXPECT_GPU=1.
 */
export function expectsGpu(): boolean {
  return process.env.SHADERSCRIPT_EXPECT_GPU === "1";
}

export interface DeviceAcquireOk {
  readonly ok: true;
  readonly device: GPUDevice;
}

export interface DeviceAcquireFail {
  readonly ok: false;
  readonly reason: string;
}

export type DeviceAcquireResult = DeviceAcquireOk | DeviceAcquireFail;

/**
 * Logs adapter class when isFallbackAdapter is available.
 * Does not throw; logging only.
 */
async function logAdapterClassAsync(): Promise<void> {
  try {
    const navigatorLike = globalThis.navigator as Navigator | undefined;
    const gpu = navigatorLike?.gpu;
    if (gpu === undefined) {
      return;
    }
    const adapter = await gpu.requestAdapter();
    if (adapter === null) {
      return;
    }
    const fallback = (
      adapter as GPUAdapter & { readonly isFallbackAdapter?: boolean }
    ).isFallbackAdapter;
    if (typeof fallback !== "boolean") {
      return;
    }
    console.log(
      fallback
        ? "webgpu adapter class: fallback/software"
        : "webgpu adapter class: non-fallback",
    );
  } catch {
    // Logging must not change acquire success or fail paths.
  }
}

/**
 * Tries to acquire a device without throwing.
 * @returns Device or failure reason.
 */
export async function tryAcquireDeviceAsync(): Promise<DeviceAcquireResult> {
  try {
    const device = await requestDeviceOrThrowAsync();
    await logAdapterClassAsync();
    return { ok: true, device };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return { ok: false, reason };
  }
}

export interface GpuCorrectnessResult {
  readonly actual: Float32Array;
  readonly elapsedMs: number;
}

/**
 * Runs compiled WGSL on GPU and returns readback plus wall time.
 * @param device - WebGPU device.
 * @param wgsl - Shader module source.
 * @param inputs - Storage inputs in bind order.
 * @param outputLength - Output element count.
 * @returns Readback and elapsed ms.
 */
export async function runGpuCorrectnessAsync(
  device: GPUDevice,
  wgsl: string,
  inputs: readonly Float32Array[],
  outputLength: number,
): Promise<GpuCorrectnessResult> {
  const started = performance.now();
  const actual = await runComputeReadbackAsync({
    device,
    wgsl,
    entryPoint: "main",
    inputs,
    outputLength,
  });
  const elapsedMs = performance.now() - started;
  return { actual, elapsedMs };
}

/**
 * Timing gap report for emit vs hand-WGSL twin. Does not claim optimized.
 * @param emitMs - Compiled emit wall time.
 * @param twinMs - Twin wall time.
 * @returns Plain timing gap string.
 */
export function formatTimingGap(emitMs: number, twinMs: number): string {
  const gapMs = emitMs - twinMs;
  return `timing gap emit-twin=${gapMs.toFixed(3)}ms (emit=${emitMs.toFixed(3)}ms twin=${twinMs.toFixed(3)}ms); no optimized claim`;
}
