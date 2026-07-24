import { Gauge } from "lucide-react";
import { ModulePlaceholder } from "@/components/app/module-placeholder";

export default function Page() {
  return <ModulePlaceholder title="Presupuestos" description="Asigne límites mensuales por categoría y reciba avisos informativos al 75 %, 90 % y 100 %." phase={4} icon={Gauge} />;
}

