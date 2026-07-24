"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMoney, type SupportedCurrency } from "@/lib/finance/format";

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "var(--surface)",
  color: "var(--foreground)",
  boxShadow: "0 12px 30px rgba(15,23,42,.12)",
  fontSize: 12,
};

export function CashFlowChart({
  data,
  currency,
}: {
  data: { month: string; Ingresos: number; Gastos: number }[];
  currency: SupportedCurrency;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 2, left: -22, bottom: 0 }}>
        <defs>
          <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#059669" stopOpacity={0.22} />
            <stop offset="95%" stopColor="#059669" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f97316" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} dy={8} />
        <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} tickFormatter={(value) => formatMoney(value, currency, true)} />
        <Tooltip contentStyle={tooltipStyle} formatter={(value) => formatMoney(Number(value), currency)} />
        <Area type="monotone" dataKey="Ingresos" stroke="#059669" strokeWidth={2.5} fill="url(#incomeFill)" />
        <Area type="monotone" dataKey="Gastos" stroke="#f97316" strokeWidth={2.2} fill="url(#expenseFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function DistributionChart({
  data,
  currency,
}: {
  data: { name: string; value: number; color: string }[];
  currency: SupportedCurrency;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="grid size-32 place-items-center rounded-full border-[18px] border-muted text-center text-xs text-muted-foreground">
          Sin gastos
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius="60%" outerRadius="84%" paddingAngle={2} stroke="none">
          {data.map((item) => <Cell key={item.name} fill={item.color} />)}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} formatter={(value) => formatMoney(Number(value), currency)} />
      </PieChart>
    </ResponsiveContainer>
  );
}

