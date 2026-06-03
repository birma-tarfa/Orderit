import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { name, phone } = await request.json();
    if (!name && !phone) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

    const supabase = createSupabaseServerClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: vp } = await supabase
      .from("vendor_profiles").select("id").eq("user_id", user.id).single();

    if (!vp) return NextResponse.json({ error: "Vendor profile not found" }, { status: 404 });

    const updates: Record<string, any> = {};
    if (name) updates.dispatch_rider_name = name;
    if (phone) updates.dispatch_rider_phone = phone;

    const { error } = await supabase.from("orders").update(updates).eq("id", params.id).eq("vendor_id", vp.id);
    if (error) return NextResponse.json({ error: "Failed to update order" }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("assign-rider error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
