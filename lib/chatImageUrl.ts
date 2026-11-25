"use client";

import { supabase } from "@/lib/supabaseClient";

const CHAT_IMAGE_PUBLIC_PATH = "/storage/v1/object/public/chat-images/";

/** Creates a short-lived URL for a chat image, supporting both legacy public URLs and new stored paths. */
export async function createChatImageSignedUrl(value: string): Promise<string | null> {
  if (!value) return null;

  let path = value;
  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      const markerIndex = url.pathname.indexOf(CHAT_IMAGE_PUBLIC_PATH);
      if (markerIndex === -1) return null;
      path = decodeURIComponent(url.pathname.slice(markerIndex + CHAT_IMAGE_PUBLIC_PATH.length));
    } catch {
      return null;
    }
  }

  if (!path || path.startsWith("/") || path.includes("..")) return null;

  const { data, error } = await supabase.storage
    .from("chat-images")
    .createSignedUrl(path, 60 * 60);

  if (error) {
    console.error("Could not create chat image URL:", error.message);
    return null;
  }

  return data.signedUrl;
}
