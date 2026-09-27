export type LearnerBooking = {
  booked_price: number;
  created_at: string;
  end_at: string;
  id: string;
  listing: { title: string; type: "lesson" | "experience" | "local_guide" } | null;
  message: string | null;
  party_size: number;
  provider: { display_name: string } | null;
  start_at: string;
  status: "pending" | "confirmed" | "rejected" | "cancelled";
};

export function filterLearnerBookings(
  bookings: LearnerBooking[],
  tab: "requests" | "upcoming" | "past",
  now = new Date(),
) {
  if (tab === "requests") return bookings.filter((booking) => booking.status === "pending");
  if (tab === "upcoming") {
    return bookings.filter((booking) => booking.status === "confirmed" && new Date(booking.end_at) >= now);
  }

  return bookings.filter((booking) => booking.status !== "pending" && (booking.status !== "confirmed" || new Date(booking.end_at) < now));
}
