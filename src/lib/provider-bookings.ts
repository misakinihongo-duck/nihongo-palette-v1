export type ProviderBooking = {
  booked_price: number;
  created_at: string;
  end_at: string;
  id: string;
  learner: { name: string; nickname: string | null } | null;
  listing: { title: string; type: "lesson" | "experience" | "local_guide" } | null;
  message: string | null;
  party_size: number;
  start_at: string;
  status: "pending" | "confirmed" | "rejected" | "cancelled";
};

export function filterProviderBookings(
  bookings: ProviderBooking[],
  tab: "pending" | "confirmed" | "past",
  now = new Date(),
) {
  if (tab === "pending") return bookings.filter((booking) => booking.status === "pending");
  if (tab === "confirmed") {
    return bookings.filter((booking) => booking.status === "confirmed" && new Date(booking.end_at) >= now);
  }

  return bookings.filter((booking) => booking.status === "confirmed" && new Date(booking.end_at) < now);
}
