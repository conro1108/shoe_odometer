import { supabase } from "@/lib/supabase";

export async function getUploadUrl(userId: string, fileName: string) {
  const path = `${userId}/${Date.now()}-${fileName}`;

  const { data, error } = await supabase.storage
    .from("shoe-photos")
    .createSignedUploadUrl(path);

  if (error || !data) throw new Error(error?.message ?? "Failed to generate upload URL");

  const { data: { publicUrl } } = supabase.storage
    .from("shoe-photos")
    .getPublicUrl(path);

  return { uploadUrl: data.signedUrl, publicUrl };
}
