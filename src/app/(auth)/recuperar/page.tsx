import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Recuperar acceso" };

export default function RecoveryPage() {
  return <AuthForm mode="recovery" />;
}

