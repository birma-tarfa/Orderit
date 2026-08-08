import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const { receiverId, senderName, content, senderId } = await request.json();
    if (!receiverId || !senderName || !content || !senderId)
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    // Use service role to bypass RLS for inserting notifications
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase.from("notifications").insert({
      user_id: receiverId,
      title: `New message from ${senderName}`,
      body: content.slice(0, 80),
      type: "message",
      is_read: false,
      link: `/messages?with=${senderId}`,
    });

    if (error) {
      console.error("Notification insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Message notification error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
