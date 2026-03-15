import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ShoeWithMileage } from "@/lib/types";
import { ShoeGrid } from "@/components/shoe-grid";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function ClosetPage() {
  const user = await getCurrentUser();

  const [shoes, mileages] = await Promise.all([
    prisma.shoe.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.walkLog.groupBy({
      by: ["shoeId"],
      where: { shoe: { userId: user.id } },
      _sum: { miles: true },
      _count: true,
      _max: { date: true },
    }),
  ]);

  const mileageMap = new Map(
    mileages.map((m) => [
      m.shoeId,
      {
        totalMileage: (m._sum.miles ?? 0),
        walkCount: m._count,
        lastWalkDate: m._max.date,
      },
    ])
  );

  const shoesWithMileage: ShoeWithMileage[] = shoes.map((shoe) => {
    const stats = mileageMap.get(shoe.id);
    return {
      ...shoe,
      totalMileage: shoe.startingMileage + (stats?.totalMileage ?? 0),
      walkCount: stats?.walkCount ?? 0,
      lastWalkDate: stats?.lastWalkDate ?? null,
    };
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Closet</h1>
          <p className="text-muted-foreground mt-1">
            {shoes.length} {shoes.length === 1 ? "pair" : "pairs"} tracked
          </p>
        </div>
        <Button asChild>
          <Link href="/closet/add">Add Shoe</Link>
        </Button>
      </div>

      {shoesWithMileage.length === 0 ? (
        <EmptyState />
      ) : (
        <ShoeGrid shoes={shoesWithMileage} />
      )}
    </div>
  );
}
