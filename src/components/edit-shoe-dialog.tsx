"use client";

import { useState } from "react";
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
import PhotoUpload from "@/components/photo-upload";
import { shoeSchema, type ShoeFormData } from "@/lib/validations/shoe";
import { updateShoeAction } from "@/app/closet/actions";

interface EditShoeDialogProps {
  shoe: {
    id: string;
    name: string;
    brand: string;
    startingMileage: number;
    photoUrl: string | null;
  };
  trigger: React.ReactNode;
}

type FieldErrors = Partial<Record<keyof ShoeFormData, string>>;

export default function EditShoeDialog({ shoe, trigger }: EditShoeDialogProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  const [name, setName] = useState(shoe.name);
  const [brand, setBrand] = useState(shoe.brand);
  const [startingMileage, setStartingMileage] = useState(String(shoe.startingMileage));
  const [photoUrl, setPhotoUrl] = useState<string | null>(shoe.photoUrl);

  function reset() {
    setName(shoe.name);
    setBrand(shoe.brand);
    setStartingMileage(String(shoe.startingMileage));
    setPhotoUrl(shoe.photoUrl);
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
      const result = await updateShoeAction(shoe.id, formData);
      if (!result.success) throw new Error(result.error);
      toast.success("Shoe updated!");
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
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Edit Shoe</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 pt-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-name">Name</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-brand">Brand</Label>
            <Input
              id="edit-brand"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
            />
            {errors.brand && <p className="text-xs text-red-500">{errors.brand}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-mileage">Starting Mileage</Label>
            <Input
              id="edit-mileage"
              type="number"
              min={0}
              step="0.1"
              value={startingMileage}
              onChange={(e) => setStartingMileage(e.target.value)}
            />
            {errors.startingMileage && (
              <p className="text-xs text-red-500">{errors.startingMileage}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Photo</Label>
            <PhotoUpload
              onUpload={(url) => setPhotoUrl(url)}
              currentPhotoUrl={photoUrl ?? undefined}
            />
            {errors.photoUrl && <p className="text-xs text-red-500">{errors.photoUrl}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Saving…" : "Save Changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
