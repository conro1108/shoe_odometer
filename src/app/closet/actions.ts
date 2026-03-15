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

type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function addShoeAction(formData: FormData): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    const name = formData.get("name") as string;
    const brand = formData.get("brand") as string;
    const photoUrl = (formData.get("photoUrl") as string) || undefined;
    const startingMileage = parseFloat(formData.get("startingMileage") as string) || 0;

    if (!name || !brand) return { success: false, error: "Name and brand are required" };

    const shoe = await createShoe(user.id, { name, brand, photoUrl, startingMileage });
    revalidatePath("/closet");
    return { success: true, data: shoe };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function updateShoeAction(shoeId: string, formData: FormData): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    const name = (formData.get("name") as string) || undefined;
    const brand = (formData.get("brand") as string) || undefined;
    const photoUrl = (formData.get("photoUrl") as string) || undefined;
    const startingMileageRaw = formData.get("startingMileage");
    const startingMileage = startingMileageRaw ? parseFloat(startingMileageRaw as string) : undefined;

    const shoe = await updateShoe(shoeId, user.id, { name, brand, photoUrl, startingMileage });
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
    const shoeId = formData.get("shoeId") as string;
    const miles = parseFloat(formData.get("miles") as string);
    const date = new Date(formData.get("date") as string);
    const notes = (formData.get("notes") as string) || undefined;

    if (!shoeId || isNaN(miles) || isNaN(date.getTime())) {
      return { success: false, error: "shoeId, miles, and date are required" };
    }

    const walk = await createWalk(user.id, { shoeId, miles, date, notes });
    revalidatePath("/closet");
    revalidatePath(`/closet/${shoeId}`);
    return { success: true, data: walk };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function updateWalkAction(walkId: string, formData: FormData): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    const milesRaw = formData.get("miles");
    const dateRaw = formData.get("date");
    const notes = (formData.get("notes") as string) || undefined;

    const miles = milesRaw ? parseFloat(milesRaw as string) : undefined;
    const date = dateRaw ? new Date(dateRaw as string) : undefined;

    const walk = await updateWalk(walkId, user.id, { miles, date, notes });
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
    const user = await getCurrentUser();
    const result = await getUploadUrl(user.id, fileName);
    return { success: true, data: result };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
