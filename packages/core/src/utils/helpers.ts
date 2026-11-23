export function padPageNum(pageNumber: number): string {
  return String(pageNumber).padStart(3, '0');
}

export function parseIntAttr(element: Element, attr: string): number {
  const val = parseInt(element.getAttribute(attr) ?? '', 10);
  return isNaN(val) ? 0 : val;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function isValidPage(page: number): boolean {
  return Number.isInteger(page) && page >= 1 && page <= 604;
}
