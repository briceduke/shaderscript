const WORKGROUP_SIZE = 64;

export interface RequestDeviceOptions {
  readonly getGpu?: () => GPU | undefined;
}

/**
 * Resolves the default WebGPU entry point from the environment.
 * @returns GPU API or undefined when missing.
 */
function defaultGetGpu(): GPU | undefined {
  const navigatorLike = globalThis.navigator as Navigator | undefined;
  return navigatorLike?.gpu;
}

/**
 * Acquires a WebGPU device or throws.
 * @param options - Optional injectable GPU seam for tests.
 * @returns GPU device.
 */
export async function requestDeviceOrThrowAsync(
  options?: RequestDeviceOptions,
): Promise<GPUDevice> {
  const getGpu = options?.getGpu ?? defaultGetGpu;
  const gpu = getGpu();
  if (gpu === undefined) {
    throw new Error("WebGPU is not available: navigator.gpu is missing");
  }

  const adapter = await gpu.requestAdapter();
  if (adapter === null) {
    throw new Error("WebGPU is not available: no adapter");
  }

  try {
    return await adapter.requestDevice();
  } catch (error) {
    throw new Error("WebGPU is not available: device request failed", {
      cause: error,
    });
  }
}

export interface RunComputeReadbackOptions {
  readonly device: GPUDevice;
  readonly wgsl: string;
  readonly entryPoint: string;
  readonly inputs: readonly Float32Array[];
  readonly outputLength: number;
}

/**
 * Dispatches a compute shader and reads back f32 output.
 * @param options - Device, WGSL, entry point, inputs, and output length.
 * @returns Output Float32Array.
 */
export async function runComputeReadbackAsync(
  options: RunComputeReadbackOptions,
): Promise<Float32Array> {
  const { device, wgsl, entryPoint, inputs, outputLength } = options;
  const outputByteLength = outputLength * Float32Array.BYTES_PER_ELEMENT;

  const inputBuffers = inputs.map((data) => {
    const buffer = device.createBuffer({
      size: data.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(buffer, 0, data);
    return buffer;
  });

  const outputBuffer = device.createBuffer({
    size: outputByteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
  });

  const stagingBuffer = device.createBuffer({
    size: outputByteLength,
    usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
  });

  const module = device.createShaderModule({ code: wgsl });
  const pipeline = device.createComputePipeline({
    layout: "auto",
    compute: {
      module,
      entryPoint,
    },
  });

  const entries: GPUBindGroupEntry[] = [
    ...inputBuffers.map(
      (buffer, binding): GPUBindGroupEntry => ({
        binding,
        resource: { buffer },
      }),
    ),
    {
      binding: inputBuffers.length,
      resource: { buffer: outputBuffer },
    },
  ];

  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries,
  });

  const commandEncoder = device.createCommandEncoder();
  const pass = commandEncoder.beginComputePass();
  pass.setPipeline(pipeline);
  pass.setBindGroup(0, bindGroup);
  pass.dispatchWorkgroups(Math.ceil(outputLength / WORKGROUP_SIZE));
  pass.end();
  commandEncoder.copyBufferToBuffer(
    outputBuffer,
    0,
    stagingBuffer,
    0,
    outputByteLength,
  );
  device.queue.submit([commandEncoder.finish()]);

  await stagingBuffer.mapAsync(GPUMapMode.READ);
  const mapped = new Float32Array(stagingBuffer.getMappedRange());
  const result = new Float32Array(outputLength);
  result.set(mapped.subarray(0, outputLength));
  stagingBuffer.unmap();

  for (const buffer of inputBuffers) {
    buffer.destroy();
  }
  outputBuffer.destroy();
  stagingBuffer.destroy();

  return result;
}
