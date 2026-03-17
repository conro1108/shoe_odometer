"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Plus, CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { walkSchema, type WalkFormData } from "@/lib/validations/walk";
import { addWalkAction } from "@/app/closet/actions";

type FieldErrors = Partial<Record<keyof WalkFormData, string>>;

interface AddWalkDialogProps {
  shoeId: string;
  trigger?: React.ReactNode;
}

export function AddWalkDialog({ shoeId, trigger }: AddWalkDialogProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [showCalendar, setShowCalendar] = useState(false);

  const [miles, setMiles] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState("");

  function reset() {
    setMiles("");
    setDate(new Date());
    setNotes("");
    setErrors({});
    setShowCalendar(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsed = walkSchema.safeParse({
      shoeId,
      miles,
      date,
      notes: notes || null,
    });

    if (!parsed.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof WalkFormData;
        fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    const formData = new FormData();
    formData.set("shoeId", parsed.data.shoeId);
    formData.set("miles", String(parsed.data.miles));
    formData.set("date", parsed.data.date.toISOString());
    if (parsed.data.notes) formData.set("notes", parsed.data.notes);

    try {
      const result = await addWalkAction(formData);
      if (!result.success) throw new Error(result.error);
      toast.success("Walk logged!");
      reset();
      setOpen(false);
    } catch (err) {
      toast.error((err as Error).message ?? "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Log a Walk
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Log a Walk</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 pt-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="walk-miles">Miles</Label>
            <Input
              id="walk-miles"
              type="number"
              min={0.1}
              step="0.1"
              value={miles}
              onChange={(e) => setMiles(e.target.value)}
              placeholder="e.g. 3.2"
            />
            {errors.miles && <p className="text-xs text-red-500">{errors.miles}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Date</Label>
            <Button
              type="button"
              variant="outline"
              className="justify-start text-left font-normal"
              onClick={() => setShowCalendar(!showCalendar)}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(date, "MMM d, yyyy")}
            </Button>
            {showCalendar && (
              <div className="rounded-md border p-0 w-fit">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => {
                    if (d) {
                      setDate(d);
                      setShowCalendar(false);
                    }
                  }}
                  disabled={{ after: new Date() }}
                />
              </div>
            )}
            {errors.date && <p className="text-xs text-red-500">{errors.date}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="walk-notes">Notes (optional)</Label>
            <textarea
              id="walk-notes"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How was the walk?"
              maxLength={500}
            />
            {errors.notes && <p className="text-xs text-red-500">{errors.notes}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Logging..." : "Log Walk"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
