import { ShoeCard } from "@/components/shoe-card";
import { ShoeWithMileage } from "@/lib/types";

interface ShoeGridProps {
  shoes: ShoeWithMileage[];
}

export function ShoeGrid({ shoes }: ShoeGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {shoes.map((shoe) => (
        <ShoeCard key={shoe.id} shoe={shoe} />
      ))}
    </div>
  );
}
