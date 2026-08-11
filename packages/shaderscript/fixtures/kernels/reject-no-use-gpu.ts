import { type StorageF32, globalId } from "../../src/idioms.ts";

export function add(a: StorageF32, b: StorageF32, out: StorageF32): void {
  const i = globalId.x;
  if (i >= a.length) {
    return;
  }
  out[i] = a[i] + b[i];
}
