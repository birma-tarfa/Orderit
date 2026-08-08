import { createClient } from "@supabase/supabase-js";

export async function createOrderNotification(
  userId: string,
  title: string,
  body: string,
  orderId: string,
  userType: 'buyer' | 'vendor' = 'buyer'
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const link = userType === 'vendor' 
    ? `/vendor/orders/${orderId}`
    : `/buyer/orders/${orderId}`;

  await supabase.from("notifications").insert({
    user_id: userId,
    title,
    body,
    type: "order",
    is_read: false,
    link,
  });
}
