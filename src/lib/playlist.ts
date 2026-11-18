export type Weighted<T> = T & { weight: number };

export function expandByWeight<T>(items: Weighted<T>[]) {
  const expanded: Weighted<T>[] = [];
  for (const item of items) {
    const weight = Math.min(5, Math.max(1, Math.round(item.weight)));
    for (let index = 0; index < weight; index += 1) expanded.push(item);
  }
  return expanded;
}
