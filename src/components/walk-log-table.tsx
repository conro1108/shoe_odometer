"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { WalkLog } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { EditWalkDialog } from "@/components/edit-walk-dialog";
import { deleteWalkAction } from "@/app/closet/actions";

interface WalkLogTableProps {
  walks: WalkLog[];
  shoeId: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function WalkLogTable({ walks, shoeId }: WalkLogTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(walkId: string) {
    setDeletingId(walkId);
    try {
      const result = await deleteWalkAction(walkId);
      if (!result.success) throw new Error(result.error);
      toast.success("Walk deleted");
    } catch (err) {
      toast.error((err as Error).message ?? "Failed to delete walk");
    } finally {
      setDeletingId(null);
    }
  }

  if (walks.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">No walks logged yet</p>
        <p className="text-sm mt-1">Use the &quot;Log a Walk&quot; button to get started.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Miles</TableHead>
            <TableHead className="hidden sm:table-cell">Notes</TableHead>
            <TableHead className="text-right w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {walks.map((walk) => (
            <TableRow key={walk.id}>
              <TableCell className="font-medium">
                {format(new Date(walk.date), "MMM d, yyyy")}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {walk.miles.toFixed(1)}
              </TableCell>
              <TableCell className="hidden sm:table-cell text-muted-foreground max-w-[200px] truncate">
                {walk.notes || "\u2014"}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <EditWalkDialog
                    walk={{
                      id: walk.id,
                      shoeId: walk.shoeId,
                      miles: walk.miles,
                      date: walk.date,
                      notes: walk.notes,
                    }}
                    trigger={
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Pencil className="h-3.5 w-3.5" />
                        <span className="sr-only">Edit walk</span>
                      </Button>
                    }
                  />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="sr-only">Delete walk</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete walk?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently remove this {walk.miles.toFixed(1)}-mile walk from{" "}
                          {format(new Date(walk.date), "MMM d, yyyy")}. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(walk.id)}
                          disabled={deletingId === walk.id}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {deletingId === walk.id ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
