export type SupportedCurrency = "CRC" | "USD";

export function formatMoney(value: number, currency: SupportedCurrency, compact = false) {
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency,
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: currency === "CRC" ? 0 : 2,
  }).format(value);
}

export function convertMoney(
  amount: number,
  from: SupportedCurrency,
  to: SupportedCurrency,
  crcPerUsd: number,
) {
  if (from === to) return amount;
  return from === "USD" ? amount * crcPerUsd : amount / crcPerUsd;
}

