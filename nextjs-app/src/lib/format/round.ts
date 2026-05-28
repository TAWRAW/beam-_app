export const arrondi2 = (n: number): number => Math.round(n * 100) / 100;

export const arrondi4 = (n: number): number => Math.round(n * 10_000) / 10_000;

export const arrondi2Sum = (xs: number[]): number =>
  arrondi2(xs.reduce((s, x) => s + x, 0));
