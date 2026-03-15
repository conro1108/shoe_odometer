import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getShoeDetail } from "@/lib/queries/shoes";
import { getWalksByShoe } from "@/lib/queries/walks";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MileageStats } from "@/components/mileage-stats";
import { WalkLogTable } from "@/components/walk-log-table";
import { AddWalkDialog } from "@/components/add-walk-dialog";

interface ShoeDetailPageProps {
  params: { id: string };
}

export default async function ShoeDetailPage({ params }: ShoeDetailPageProps) {
  const user = await getCurrentUser();
  const [shoe, walks] = await Promise.all([
    getShoeDetail(params.id, user.id),
    getWalksByShoe(params.id, user.id),
  ]);

  if (!shoe) {
    notFound();
  }

  const isRetired = shoe.retiredAt !== null;

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Back link */}
      <Link
        href="/closet"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Closet
      </Link>

      {/* Shoe header */}
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Photo */}
        <div className="relative bg-gray-100 rounded-lg w-full sm:w-48 h-48 flex-shrink-0 flex items-center justify-center overflow-hidden">
          {shoe.photoUrl ? (
            <img
              src={shoe.photoUrl}
              alt={shoe.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-7xl select-none">👟</span>
          )}
          {isRetired && (
            <div className="absolute top-2 left-2">
              <Badge variant="secondary">Retired</Badge>
            </div>
          )}
        </div>

        {/* Name, brand, action */}
        <div className="flex flex-col justify-between flex-1 min-w-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight truncate">{shoe.name}</h1>
            <p className="text-lg text-muted-foreground mt-1">{shoe.brand}</p>
          </div>
          <div className="mt-4">
            <AddWalkDialog shoeId={shoe.id} />
          </div>
        </div>
      </div>

      <Separator />

      {/* Mileage stats */}
      <MileageStats
        totalMileage={shoe.totalMileage}
        walkCount={shoe.walkCount}
        walks={walks}
      />

      <Separator />

      {/* Walk history */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Walk History</h2>
        <WalkLogTable walks={walks} shoeId={shoe.id} />
      </div>
    </div>
  );
}
