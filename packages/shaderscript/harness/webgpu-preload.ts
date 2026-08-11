let pendingInstall: Promise<void> | undefined;

/**
 * Soft-installs WebGPU globals for harness GPU lanes.
 * Never throws. On missing bun-webgpu / Dawn / setup failure, logs a reason
 * and leaves navigator.gpu unchanged.
 * @returns void
 */
export function installWebGpuGlobals(): void {
  if (pendingInstall !== undefined) {
    return;
  }
  pendingInstall = (async () => {
    try {
      const { setupGlobals } = (await import("bun-webgpu")) as {
        setupGlobals: (opts?: { libPath?: string }) => Promise<void>;
      };
      await setupGlobals();
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      console.log(`webgpu preload soft-fail: ${reason}`);
    }
  })();
}

// Module load must call installWebGpuGlobals() (Bun --preload side effect).
// bun-webgpu setupGlobals is async; top-level await keeps preload finished
// before harness tests run.
installWebGpuGlobals();
await pendingInstall!;
