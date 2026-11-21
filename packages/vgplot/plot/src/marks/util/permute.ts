export function indices(length: number): number[] {
  return Array.from({ length }, (_, i) => i);
}

export function permute(data: number[], order: any[]): number[] {
  const ord = order.reduce((acc, val, i) => (acc[val] = i, acc), {});
  const idx = indices(data.length);
  idx.sort((a, b) => ord[data[a]] - ord[data[b]]);
  return idx;
}
