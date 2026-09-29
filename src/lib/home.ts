type BookingSchedule = {
  end_at: string;
  id: string;
  start_at: string;
  status: "pending" | "confirmed" | "rejected" | "cancelled";
};

export function nextConfirmedBooking<T extends BookingSchedule>(bookings: T[], now = new Date()) {
  return bookings
    .filter((booking) => booking.status === "confirmed" && new Date(booking.end_at) >= now)
    .sort((first, second) => new Date(first.start_at).getTime() - new Date(second.start_at).getTime())[0] ?? null;
}
