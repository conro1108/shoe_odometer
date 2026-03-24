"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { MoreVertical, Pencil, Archive, ArchiveRestore, Trash2, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ShoeWithMileage } from "@/lib/types";
import { deleteShoeAction, retireShoeAction, unretireShoeAction } from "@/app/closet/actions";
import { AddWalkDialog } from "@/components/add-walk-dialog";
import { toast } from "sonner";

interface ShoeCardProps {
  shoe: ShoeWithMileage;
}

export function ShoeCard({ shoe }: ShoeCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isRetired = shoe.retiredAt !== null;

  function handleEdit(e: React.MouseEvent) {
    e.preventDefault();
    router.push(`/closet/${shoe.id}`);
  }

  async function handleRetireToggle(e: React.MouseEvent) {
    e.preventDefault();
    setLoading(true);
    const result = isRetired
      ? await unretireShoeAction(shoe.id)
      : await retireShoeAction(shoe.id);
    setLoading(false);
    if (!result.success) toast.error(result.error);
    else router.refresh();
  }

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    if (!confirm(`Delete "${shoe.name}"? This cannot be undone.`)) return;
    setLoading(true);
    const result = await deleteShoeAction(shoe.id);
    setLoading(false);
    if (!result.success) toast.error(result.error);
    else router.refresh();
  }

  return (
    <Card
      className="overflow-hidden transition-shadow hover:shadow-md h-full cursor-pointer group"
      onClick={() => router.push(`/closet/${shoe.id}`)}
    >
      {/* Shoe photo */}
      <div className="relative bg-gray-100 h-48 flex items-center justify-center">
        {shoe.photoUrl ? (
          <img
            src={shoe.photoUrl}
            alt={shoe.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-6xl select-none">👟</span>
        )}
        {isRetired && (
          <div className="absolute top-2 left-2">
            <Badge variant="secondary">Retired</Badge>
          </div>
        )}
        {/* Three-dot menu */}
        <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 bg-white/80 hover:bg-white shadow-sm"
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleEdit} disabled={loading}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleRetireToggle} disabled={loading}>
                {isRetired ? (
                  <>
                    <ArchiveRestore className="mr-2 h-4 w-4" />
                    Unretire
                  </>
                ) : (
                  <>
                    <Archive className="mr-2 h-4 w-4" />
                    Retire
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                disabled={loading}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Name + brand */}
        <div>
          <p className="font-semibold leading-tight truncate group-hover:text-primary transition-colors">
            {shoe.name}
          </p>
          <p className="text-sm text-muted-foreground truncate">{shoe.brand}</p>
        </div>

        {/* Mileage */}
        <p className="text-2xl font-bold tabular-nums">
          {shoe.totalMileage.toFixed(1)}
          <span className="text-sm font-normal text-muted-foreground ml-1">mi</span>
        </p>

        {/* Walk stats */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{shoe.walkCount} {shoe.walkCount === 1 ? "walk" : "walks"}</span>
          {shoe.lastWalkDate ? (
            <span>
              {formatDistanceToNow(new Date(shoe.lastWalkDate), { addSuffix: true })}
            </span>
          ) : (
            <span>No walks yet</span>
          )}
        </div>

        {/* Quick add walk */}
        {!isRetired && (
          <div onClick={(e) => e.stopPropagation()}>
            <AddWalkDialog shoeId={shoe.id} trigger={
              <Button variant="outline" size="sm" className="w-full">
                <Plus className="h-4 w-4 mr-1" />
                Log Walk
              </Button>
            } />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
