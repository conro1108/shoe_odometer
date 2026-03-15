"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
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
import PhotoUpload from "@/components/photo-upload";
import { shoeSchema, type ShoeFormData } from "@/lib/validations/shoe";
import { addShoeAction } from "@/app/closet/actions";

type FieldErrors = Partial<Record<keyof ShoeFormData, string>>;

export default function AddShoeDialog() {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [startingMileage, setStartingMileage] = useState("0");

  function reset() {
    setName("");
    setBrand("");
    setStartingMileage("0");
    setPhotoUrl(null);
    setErrors({});
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsed = shoeSchema.safeParse({
      name,
      brand,
      startingMileage,
      photoUrl: photoUrl || undefined,
    });

    if (!parsed.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof ShoeFormData;
        fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    const formData = new FormData();
    formData.set("name", parsed.data.name);
    formData.set("brand", parsed.data.brand);
    formData.set("startingMileage", String(parsed.data.startingMileage));
    if (parsed.data.photoUrl) formData.set("photoUrl", parsed.data.photoUrl);

    try {
      const result = await addShoeAction(formData);
      if (!result.success) throw new Error(result.error);
      toast.success("Shoe added!");
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
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Shoe
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Add a Shoe</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 pt-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="add-name">Name</Label>
            <Input
              id="add-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ghost 15"
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="add-brand">Brand</Label>
            <Input
              id="add-brand"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g. Brooks"
            />
            {errors.brand && <p className="text-xs text-red-500">{errors.brand}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="add-mileage">Starting Mileage</Label>
            <Input
              id="add-mileage"
              type="number"
              min={0}
              step="0.1"
              value={startingMileage}
              onChange={(e) => setStartingMileage(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Set this if the shoes were already worn before tracking.
            </p>
            {errors.startingMileage && (
              <p className="text-xs text-red-500">{errors.startingMileage}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Photo</Label>
            <PhotoUpload onUpload={(url) => setPhotoUrl(url)} />
            {errors.photoUrl && <p className="text-xs text-red-500">{errors.photoUrl}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Adding…" : "Add Shoe"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
