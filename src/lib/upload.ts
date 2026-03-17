import { getSupabaseClient } from "@/lib/supabase";

export async function getUploadUrl(userId: string, fileName: string) {
  const supabase = getSupabaseClient();
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100);
  const path = `${userId}/${Date.now()}-${safeName}`;

  const { data, error } = await supabase.storage
    .from("shoe-photos")
    .createSignedUploadUrl(path);

  if (error || !data) throw new Error(error?.message ?? "Failed to generate upload URL");

  const { data: { publicUrl } } = supabase.storage
    .from("shoe-photos")
    .getPublicUrl(path);

  return { uploadUrl: data.signedUrl, publicUrl };
}
