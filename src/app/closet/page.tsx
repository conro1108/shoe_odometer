import { getCurrentUser } from "@/lib/auth";
import { getShoesByUser } from "@/lib/queries/shoes";
import { ShoeGrid } from "@/components/shoe-grid";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function ClosetPage() {
  const user = await getCurrentUser();
  const shoesWithMileage = await getShoesByUser(user.id);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Closet</h1>
          <p className="text-muted-foreground mt-1">
            {shoesWithMileage.length} {shoesWithMileage.length === 1 ? "pair" : "pairs"} tracked
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
