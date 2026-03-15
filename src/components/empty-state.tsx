import Link from "next/link";
import { Button } from "@/components/ui/button";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <span className="text-7xl mb-6 select-none">👟</span>
      <h2 className="text-2xl font-semibold mb-2">No shoes in your closet yet</h2>
      <p className="text-muted-foreground mb-8 max-w-xs">
        Add your first pair to start tracking mileage
      </p>
      <Button asChild size="lg">
        <Link href="/closet/add">Add Shoe</Link>
      </Button>
    </div>
  );
}
