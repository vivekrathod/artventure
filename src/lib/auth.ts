import { createServerSupabaseClient, supabaseAdmin } from "./supabase/server";
import { headers } from "next/headers";

export async function getUser() {
  const supabase = await createServerSupabaseClient();

  // Check for Authorization header (for API testing with Bearer tokens)
  const headersList = await headers();
  const authHeader = headersList.get("authorization");

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    return user;
  }

  // Default: use cookie-based authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function requireAuth() {
  const user = await getUser();
  if (!user) {
    throw new Error("Unauthorized: Authentication required");
  }
  return user;
}

export async function isUserAdmin(): Promise<boolean> {
  const user = await getUser();

  if (!user) {
    return false;
  }

  try {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("is_admin")
      .eq("user_id", user.id)
      .single();

    return (profile as any)?.is_admin || false;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

export async function requireAdmin() {
  await requireAuth();
  const isAdmin = await isUserAdmin();

  if (!isAdmin) {
    throw new Error("Unauthorized: Admin access required");
  }

  return true;
}

export async function getOrCreateProfile(userId: string, email: string, fullName?: string) {
  try {
    // Check if profile exists
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (existingProfile) {
      return existingProfile;
    }

    // Create new profile
    const { data: newProfile, error } = await supabaseAdmin
      .from("profiles")
      // @ts-expect-error - Supabase type inference issue with generated types
      .insert({
        user_id: userId,
        full_name: fullName || null,
        is_admin: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating profile:", error);
      return null;
    }

    return newProfile;
  } catch (error) {
    console.error("Error in getOrCreateProfile:", error);
    return null;
  }
}
