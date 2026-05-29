import dynamic from "next/dynamic";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ProfilePage = dynamic(() => import("./ProfilePage"), {
  loading: () => <div className="p-8">Loading profile...</div>,
});

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

  return user;
}

export default async function BuyerProfilePage() {
  await requireBuyerUser();
  return <ProfilePage />;
}