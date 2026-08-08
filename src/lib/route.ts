import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { receiverId, senderName, content, senderId } = await req.json();
    const supabase = await createClient();

    const { error } = await supabase.from('notifications').insert({
      user_id: receiverId,
      title: `New message from ${senderName} 💬`,
      body: content.length > 80 ? `${content.slice(0, 77)}...` : content,
      type: 'message',
      is_read: false,
      link: `/messages?with=${senderId}`
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Notification API Error:', error);
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
  }
}
