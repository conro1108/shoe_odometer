import { Card, CardContent } from "@/components/ui/card";
import type { WalkLog } from "@prisma/client";

interface MileageStatsProps {
  totalMileage: number;
  walkCount: number;
  walks: WalkLog[];
}

export function MileageStats({ totalMileage, walkCount, walks }: MileageStatsProps) {
  const walkedMiles = walks.reduce((sum, w) => sum + w.miles, 0);
  const avgPerWalk = walks.length > 0 ? walkedMiles / walks.length : null;

  const now = new Date();
  const thisMonthMiles = walks
    .filter((w) => {
      const d = new Date(w.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, w) => sum + w.miles, 0);

  const stats = [
    { label: "Total Miles", value: `${totalMileage.toFixed(1)} mi` },
    { label: "Total Walks", value: String(walkCount) },
    {
      label: "Avg Per Walk",
      value: avgPerWalk !== null ? `${avgPerWalk.toFixed(1)} mi` : "\u2014",
    },
    { label: "Miles This Month", value: `${thisMonthMiles.toFixed(1)} mi` },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-4 flex flex-col items-center text-center">
            <p className="text-3xl font-bold tabular-nums">{stat.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
