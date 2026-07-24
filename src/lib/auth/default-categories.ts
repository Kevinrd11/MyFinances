import type { Prisma } from "@prisma/client";

type CategorySeed = Pick<Prisma.CategoryCreateManyInput, "name" | "type" | "color" | "icon" | "isSystem">;

export const DEFAULT_CATEGORIES: CategorySeed[] = [
  { name: "Tours", type: "INCOME", color: "#059669", icon: "Map", isSystem: true },
  { name: "Páginas web", type: "INCOME", color: "#10b981", icon: "Code2", isSystem: true },
  { name: "Mantenimiento web", type: "INCOME", color: "#14b8a6", icon: "Wrench", isSystem: true },
  { name: "Propinas", type: "INCOME", color: "#84cc16", icon: "Sparkles", isSystem: true },
  { name: "Comisiones", type: "INCOME", color: "#22c55e", icon: "BadgeDollarSign", isSystem: true },
  { name: "Trabajo independiente", type: "INCOME", color: "#0d9488", icon: "Briefcase", isSystem: true },
  { name: "Reembolsos", type: "INCOME", color: "#65a30d", icon: "Undo2", isSystem: true },
  { name: "Otros ingresos", type: "INCOME", color: "#16a34a", icon: "CircleDollarSign", isSystem: true },
  { name: "Alimentación", type: "EXPENSE", color: "#f97316", icon: "Utensils", isSystem: true },
  { name: "Transporte", type: "EXPENSE", color: "#eab308", icon: "Car", isSystem: true },
  { name: "Vivienda", type: "EXPENSE", color: "#8b5cf6", icon: "House", isSystem: true },
  { name: "Servicios", type: "EXPENSE", color: "#6366f1", icon: "ReceiptText", isSystem: true },
  { name: "Universidad", type: "EXPENSE", color: "#3b82f6", icon: "GraduationCap", isSystem: true },
  { name: "Salud", type: "EXPENSE", color: "#ef4444", icon: "HeartPulse", isSystem: true },
  { name: "Entretenimiento", type: "EXPENSE", color: "#ec4899", icon: "Clapperboard", isSystem: true },
  { name: "Suscripciones", type: "EXPENSE", color: "#a855f7", icon: "RefreshCcw", isSystem: true },
  { name: "Hosting", type: "EXPENSE", color: "#0ea5e9", icon: "Server", isSystem: true },
  { name: "Dominios", type: "EXPENSE", color: "#06b6d4", icon: "Globe2", isSystem: true },
  { name: "Software", type: "EXPENSE", color: "#64748b", icon: "AppWindow", isSystem: true },
  { name: "Inteligencia artificial", type: "EXPENSE", color: "#7c3aed", icon: "Bot", isSystem: true },
  { name: "Publicidad", type: "EXPENSE", color: "#f43f5e", icon: "Megaphone", isSystem: true },
  { name: "Equipo", type: "EXPENSE", color: "#475569", icon: "Laptop", isSystem: true },
  { name: "Otros gastos", type: "EXPENSE", color: "#94a3b8", icon: "Ellipsis", isSystem: true },
];

