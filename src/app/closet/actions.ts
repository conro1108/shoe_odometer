"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import {
  createShoe,
  updateShoe,
  deleteShoe,
  retireShoe,
  unretireShoe,
} from "@/lib/queries/shoes";
import { createWalk, updateWalk, deleteWalk } from "@/lib/queries/walks";
import { getUploadUrl } from "@/lib/upload";
import { shoeSchema } from "@/lib/validations/shoe";
import { walkSchema } from "@/lib/validations/walk";

type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function addShoeAction(formData: FormData): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    const parsed = shoeSchema.safeParse({
      name: formData.get("name"),
      brand: formData.get("brand"),
      startingMileage: formData.get("startingMileage"),
      photoUrl: formData.get("photoUrl") || undefined,
    });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }
    const shoe = await createShoe(user.id, {
      ...parsed.data,
      photoUrl: parsed.data.photoUrl ?? undefined,
    });
    revalidatePath("/closet");
    return { success: true, data: shoe };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function updateShoeAction(shoeId: string, formData: FormData): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    const photoUrlRaw = formData.get("photoUrl");
    const parsed = shoeSchema.partial().safeParse({
      name: formData.get("name") || undefined,
      brand: formData.get("brand") || undefined,
      startingMileage: formData.get("startingMileage") || undefined,
      // null → clear; undefined → don't update
      photoUrl: photoUrlRaw !== null ? photoUrlRaw || null : undefined,
    });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }
    const shoe = await updateShoe(
      shoeId,
      user.id,
      parsed.data as unknown as Parameters<typeof updateShoe>[2]
    );
    revalidatePath("/closet");
    revalidatePath(`/closet/${shoeId}`);
    return { success: true, data: shoe };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function deleteShoeAction(shoeId: string): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    await deleteShoe(shoeId, user.id);
    revalidatePath("/closet");
    return { success: true, data: null };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function retireShoeAction(shoeId: string): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    const shoe = await retireShoe(shoeId, user.id);
    revalidatePath("/closet");
    revalidatePath(`/closet/${shoeId}`);
    return { success: true, data: shoe };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function unretireShoeAction(shoeId: string): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    const shoe = await unretireShoe(shoeId, user.id);
    revalidatePath("/closet");
    revalidatePath(`/closet/${shoeId}`);
    return { success: true, data: shoe };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function addWalkAction(formData: FormData): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    const parsed = walkSchema.safeParse({
      shoeId: formData.get("shoeId"),
      miles: formData.get("miles"),
      date: formData.get("date"),
      notes: formData.get("notes") || undefined,
    });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }
    const walk = await createWalk(user.id, {
      ...parsed.data,
      notes: parsed.data.notes ?? undefined,
    });
    revalidatePath("/closet");
    revalidatePath(`/closet/${parsed.data.shoeId}`);
    return { success: true, data: walk };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function updateWalkAction(walkId: string, formData: FormData): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    const notesRaw = formData.get("notes");
    const parsed = walkSchema.omit({ shoeId: true }).partial().safeParse({
      miles: formData.get("miles") || undefined,
      date: formData.get("date") || undefined,
      // null → clear; undefined → don't update
      notes: notesRaw !== null ? notesRaw || null : undefined,
    });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }
    const walk = await updateWalk(
      walkId,
      user.id,
      parsed.data as unknown as Parameters<typeof updateWalk>[2]
    );
    revalidatePath("/closet");
    revalidatePath(`/closet/${walk.shoeId}`);
    return { success: true, data: walk };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function deleteWalkAction(walkId: string): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    const walk = await deleteWalk(walkId, user.id);
    revalidatePath("/closet");
    revalidatePath(`/closet/${walk.shoeId}`);
    return { success: true, data: null };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function getUploadUrlAction(fileName: string): Promise<ActionResult> {
  try {
    if (!fileName || typeof fileName !== "string" || fileName.length > 255) {
      return { success: false, error: "Invalid file name" };
    }
    const user = await getCurrentUser();
    const result = await getUploadUrl(user.id, fileName);
    return { success: true, data: result };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
