/**
 * CPU reference for hello-add: out[i] = a[i] + b[i].
 * @param a - Left input.
 * @param b - Right input.
 * @returns Output Float32Array.
 */
export function cpuAddF32(a: Float32Array, b: Float32Array): Float32Array {
  const length = Math.min(a.length, b.length);
  const out = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    out[i] = a[i] + b[i];
  }
  return out;
}
