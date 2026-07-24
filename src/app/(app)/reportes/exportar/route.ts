import type { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { getReportData } from "@/lib/data/reports";

function csvCell(value: string | number | null | undefined) {
  const text = value == null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET(request: NextRequest) {
  const user = await requireUser();
  const report = await getReportData(user, {
    from: request.nextUrl.searchParams.get("from") ?? undefined,
    to: request.nextUrl.searchParams.get("to") ?? undefined,
    account: request.nextUrl.searchParams.get("account") ?? undefined,
  });
  const rows = [
    [
      "Fecha",
      "Tipo",
      "Descripción",
      "Categoría",
      "Cuenta",
      "Monto original",
      "Moneda",
      `Monto en ${report.primaryCurrency}`,
      "Medio de pago",
      "Notas",
    ],
    ...report.transactions.map((transaction) => [
      transaction.date.slice(0, 10),
      transaction.type === "INCOME" ? "Ingreso" : "Gasto",
      transaction.description,
      transaction.category,
      transaction.account,
      transaction.amount,
      transaction.currency,
      transaction.convertedAmount.toFixed(2),
      transaction.paymentMethod,
      transaction.notes,
    ]),
  ];
  const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
  const filename = `myfinances-reporte-${report.range.from}-${report.range.to}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
