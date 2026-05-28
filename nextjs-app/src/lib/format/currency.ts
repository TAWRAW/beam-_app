const fmt = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatEur(n: number | null | undefined): string {
  if (n == null) return "—";
  return fmt.format(n);
}

export const TVA_STANDARD = 20;

export function formatEurDuoFromHT(ht: number | null | undefined, tva = TVA_STANDARD): string {
  if (ht == null) return "—";
  const ttc = ht * (1 + tva / 100);
  return `${fmt.format(ht)} HT soit ${fmt.format(ttc)} TTC`;
}

export function formatEurDuoFromTTC(ttc: number | null | undefined, tva = TVA_STANDARD): string {
  if (ttc == null) return "—";
  const ht = ttc / (1 + tva / 100);
  return `${fmt.format(ht)} HT soit ${fmt.format(ttc)} TTC`;
}
