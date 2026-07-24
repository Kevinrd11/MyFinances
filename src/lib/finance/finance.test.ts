import { describe, expect, it } from "vitest";
import { convertMoney, formatMoney } from "@/lib/finance/format";
import { calculateAccountBalance, transactionSign } from "@/lib/finance/ledger";

describe("convertMoney", () => {
  it("convierte dólares a colones con el tipo guardado", () => {
    expect(convertMoney(100, "USD", "CRC", 510)).toBe(51_000);
  });

  it("convierte colones a dólares con el tipo guardado", () => {
    expect(convertMoney(51_000, "CRC", "USD", 510)).toBe(100);
  });

  it("no altera un monto en la misma moneda", () => {
    expect(convertMoney(12_345, "CRC", "CRC", 510)).toBe(12_345);
  });
});

describe("transactionSign", () => {
  it("trata ingresos y transferencias entrantes como aumentos", () => {
    expect(transactionSign("INCOME", null)).toBe(1);
    expect(transactionSign("TRANSFER", "IN")).toBe(1);
  });

  it("trata gastos y transferencias salientes como disminuciones", () => {
    expect(transactionSign("EXPENSE", null)).toBe(-1);
    expect(transactionSign("TRANSFER", "OUT")).toBe(-1);
  });
});

describe("calculateAccountBalance", () => {
  it("calcula el balance y conserva el efecto neto de una transferencia", () => {
    const source = calculateAccountBalance(100_000, [
      { amount: 25_000, type: "INCOME", transferDirection: null },
      { amount: 10_000, type: "TRANSFER", transferDirection: "OUT" },
      { amount: 5_000, type: "EXPENSE", transferDirection: null },
    ]);
    const destination = calculateAccountBalance(0, [
      { amount: 10_000, type: "TRANSFER", transferDirection: "IN" },
    ]);

    expect(source).toBe(110_000);
    expect(destination).toBe(10_000);
    expect(source + destination).toBe(120_000);
  });
});

describe("formatMoney", () => {
  it("formatea las monedas admitidas", () => {
    expect(formatMoney(1_000, "CRC")).toContain("1");
    expect(formatMoney(25.5, "USD")).toContain("25");
  });
});
