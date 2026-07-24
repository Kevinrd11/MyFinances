import { WalletCards } from "lucide-react";
import { ModulePlaceholder } from "@/components/app/module-placeholder";

export default function Page() {
  return <ModulePlaceholder title="Cuentas" description="Administre bancos, efectivo, tarjetas y fondos en CRC o USD con balances derivados automáticamente." phase={2} icon={WalletCards} />;
}

