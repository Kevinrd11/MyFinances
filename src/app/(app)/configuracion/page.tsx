import { Settings } from "lucide-react";
import { ModulePlaceholder } from "@/components/app/module-placeholder";

export default function Page() {
  return <ModulePlaceholder title="Configuración" description="Personalice moneda, tipo de cambio, tema, categorías, alertas y respaldos." phase={2} icon={Settings} />;
}

