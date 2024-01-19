export function repeat(length: number, str: string): string[] {
  return Array.from({ length }, () => str);
}
