import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import ProfilePage from "./page";

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
}

interface Address {
  id: string;
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  is_default: boolean;
}

async function requireBuyerUser() {
  const supabase = createSupabaseServerClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData?.session?.user?.id;

  if (!userId) {
    redirect("/login");
  }

  const { data: user, error } = await supabase
    .from("users")
    .select("id, email, full_name, phone, avatar_url, role")
    .eq("id", userId)
    .single();

  if (error || !user || user.role !== "buyer") {
    redirect("/marketplace");
  }

  return user as UserProfile;
}

async function getUserAddresses(userId: string): Promise<Address[]> {
  // For now, return empty array since we don't have an addresses table
  // In a real implementation, you'd fetch from a user_addresses table
  return [];
}

export default async function ProfilePageWrapper() {
  const user = await requireBuyerUser();
  const addresses = await getUserAddresses(user.id);

  return <ProfilePage user={user} addresses={addresses} />;
}