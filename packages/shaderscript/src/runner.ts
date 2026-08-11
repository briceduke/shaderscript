/**
 * Acquires a WebGPU device or throws.
 * @returns GPU device.
 */
export async function requestDeviceOrThrowAsync(): Promise<GPUDevice> {
  throw new Error("not implemented");
}

/**
 * Dispatches a compute shader and reads back f32 output.
 * @param options - Device, WGSL, entry point, inputs, and output length.
 * @returns Output Float32Array.
 */
export async function runComputeReadbackAsync(options: {
  readonly device: GPUDevice;
  readonly wgsl: string;
  readonly entryPoint: string;
  readonly inputs: readonly Float32Array[];
  readonly outputLength: number;
}): Promise<Float32Array> {
  void options;
  throw new Error("not implemented");
}
