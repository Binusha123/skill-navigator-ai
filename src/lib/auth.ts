// Real Supabase auth — replaces the previous localStorage mock.
// Kept under the same import path for backward compatibility.
// Prefer the `useAuth` hook in components for reactive state.
import { supabase } from "@/integrations/supabase/client";

export interface AppUser {
  id: string;
  email: string;
  name: string;
}

const userFromSupabase = (u: { id: string; email?: string | null; user_metadata?: Record<string, unknown> } | null): AppUser | null => {
  if (!u) return null;
  const meta = (u.user_metadata ?? {}) as { display_name?: string };
  return {
    id: u.id,
    email: u.email ?? "",
    name: meta.display_name || (u.email ? u.email.split("@")[0] : "User"),
  };
};

export const auth = {
  async signup(name: string, email: string, password: string): Promise<AppUser> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: name },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) throw error;
    if (!data.user) throw new Error("Signup failed");
    return userFromSupabase(data.user)!;
  },
  async login(email: string, password: string): Promise<AppUser> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return userFromSupabase(data.user)!;
  },
  async logout(): Promise<void> {
    await supabase.auth.signOut();
  },
  async current(): Promise<AppUser | null> {
    const { data } = await supabase.auth.getUser();
    return userFromSupabase(data.user);
  },
};
