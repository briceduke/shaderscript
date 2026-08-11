import { checklist, coveragePercent } from "./checklist.ts";
import { runComputeReadbackAsync } from "../src/runner.ts";

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

interface AdapterInfoLike {
  readonly device?: string;
  readonly backendType?: number;
  readonly isFallbackAdapter?: boolean;
}

/** Dawn Null backend type enum value (bun-webgpu / Dawn). */
const DAWN_BACKEND_NULL = 1;

/**
 * Whether the adapter is Dawn's null backend (API only; compute returns garbage).
 * @param adapter - Acquired GPU adapter.
 * @returns True when null-backend; treat as no usable device.
 */
function isNullBackendAdapter(adapter: GPUAdapter): boolean {
  const info = (adapter as GPUAdapter & { readonly info?: AdapterInfoLike })
    .info;
  if (info === undefined) {
    return false;
  }
  if (info.device === "null-backend") {
    return true;
  }
  return info.backendType === DAWN_BACKEND_NULL;
}

/**
 * Logs adapter class when fallback flag is available on info or adapter.
 * Does not throw; logging only.
 * @param adapter - Acquired GPU adapter.
 * @returns void
 */
function logAdapterClass(adapter: GPUAdapter): void {
  try {
    const info = (adapter as GPUAdapter & { readonly info?: AdapterInfoLike })
      .info;
    const fromInfo = info?.isFallbackAdapter;
    const fromAdapter = (
      adapter as GPUAdapter & { readonly isFallbackAdapter?: boolean }
    ).isFallbackAdapter;
    const fallback =
      typeof fromInfo === "boolean"
        ? fromInfo
        : typeof fromAdapter === "boolean"
          ? fromAdapter
          : undefined;
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
 * Rejects Dawn null-backend adapters so device-free CI stays green and EXPECT=1 fails loud.
 * @returns Device or failure reason.
 */
export async function tryAcquireDeviceAsync(): Promise<DeviceAcquireResult> {
  try {
    const navigatorLike = globalThis.navigator as Navigator | undefined;
    const gpu = navigatorLike?.gpu;
    if (gpu === undefined) {
      return {
        ok: false,
        reason: "WebGPU is not available: navigator.gpu is missing",
      };
    }
    const adapter = await gpu.requestAdapter();
    if (adapter === null) {
      return { ok: false, reason: "WebGPU is not available: no adapter" };
    }
    if (isNullBackendAdapter(adapter)) {
      return {
        ok: false,
        reason:
          "WebGPU is not available: Dawn null-backend (no usable GPU driver)",
      };
    }
    const device = await adapter.requestDevice();
    logAdapterClass(adapter);
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
