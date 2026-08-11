/**
 * Storage buffer of f32 values. Kernels write `out[i]`.
 */
export interface StorageF32 {
  readonly length: number;
  [index: number]: number;
}

/**
 * Global invocation id (x dimension only for hello-add).
 */
export interface GlobalId {
  readonly x: number;
}

/**
 * Builtin global id available inside `'use gpu'` kernels.
 */
export declare const globalId: GlobalId;
