/**
 * Order Status Helper Functions
 * Provides consistent status labels and colors across the application
 */

export const statusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    pending: "Pending",
    confirmed: "Confirmed",
    preparing: "Preparing",
    out_for_delivery: "Out for Delivery",
    delivered: "Delivered",
    cancelled: "Cancelled",
    // Fallback for 'shipped' (legacy status)
    shipped: "Out for Delivery",
  };
  return labels[status] ?? status;
};

export const statusColor = (status: string): string => {
  const colors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    preparing: "bg-orange-100 text-orange-800",
    out_for_delivery: "bg-purple-100 text-purple-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    // Fallback for 'shipped' (legacy status)
    shipped: "bg-purple-100 text-purple-800",
  };
  return colors[status] ?? "bg-gray-100 text-gray-800";
};

export const statusIcon = (status: string) => {
  switch (status) {
    case "pending":
      return "⏳";
    case "confirmed":
      return "✓";
    case "preparing":
      return "👨‍🍳";
    case "out_for_delivery":
      return "🚗";
    case "delivered":
      return "✓✓";
    case "cancelled":
      return "✗";
    default:
      return "•";
  }
};
