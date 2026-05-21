import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function createOrderNotification(buyerId: string, title: string, body: string, orderId: string) {
  const supabase = createSupabaseServerClient();
  await supabase.from("notifications").insert([{ user_id: buyerId, title, body, type: "order", is_read: false, link: `/orders/${orderId}` }]);
}
