import { NextResponse } from "next/server";
import { createAuthClient } from "@/lib/supabase/server";
import { authConfigured } from "@/gkb/lib/auth";

export async function POST() {
  if (authConfigured()) {
    try {
      const supabase = await createAuthClient();
      await supabase.auth.signOut();
    } catch {
      // already signed out
    }
  }
  return NextResponse.json({ loggedIn: false });
}
