export type AppNotification = {
  booking_id: string | null;
  conversation_id: string | null;
  created_at: string;
  id: string;
  read_at: string | null;
  type: "booking_request" | "booking_accepted" | "booking_rejected" | "booking_cancelled" | "new_message";
};

const notificationCopy: Record<AppNotification["type"], string> = {
  booking_accepted: "予約が承認されました。",
  booking_cancelled: "予約がキャンセルされました。",
  booking_rejected: "予約リクエストへの返答が届きました。",
  booking_request: "新しい予約リクエストが届きました。",
  new_message: "新しいメッセージが届きました。",
};

export function notificationMessage(notification: AppNotification) {
  return notificationCopy[notification.type];
}
