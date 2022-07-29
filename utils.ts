export function equalUint8Array(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length != b.length) return false;

  return a.every((_, i) => a[i] === b[i]);
}
