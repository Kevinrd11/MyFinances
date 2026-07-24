import { AppHeader } from "@/components/app/app-header";
import { DesktopSidebar, MobileBottomNavigation, MobileHeader } from "@/components/app/navigation";
import { requireUser } from "@/lib/auth/session";

export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const displayName = user.name?.trim() || "Usuario";
  const firstName = displayName.split(/\s+/)[0];

  return (
    <div className="min-h-dvh bg-background lg:flex">
      <DesktopSidebar userName={displayName} userEmail={user.email} />
      <div className="min-w-0 flex-1">
        <MobileHeader />
        <AppHeader firstName={firstName} />
        <main className="mx-auto w-full max-w-[1600px] px-4 pb-24 pt-5 sm:px-6 lg:px-8 lg:pb-10 lg:pt-7">
          {children}
        </main>
        <MobileBottomNavigation />
      </div>
    </div>
  );
}

