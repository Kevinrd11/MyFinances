import { Card } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="h-16 w-72 rounded-2xl bg-muted" />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => <Card key={index} className="h-32 bg-muted/60" />)}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.65fr_.75fr]">
        <Card className="h-80 bg-muted/60" />
        <Card className="h-80 bg-muted/60" />
      </div>
    </div>
  );
}

