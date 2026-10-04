export type ConversationSummary = {
  id: string;
  latest_message: string | null;
  latest_message_at: string | null;
  listing: { id: string; title: string };
  other: { name: string; photo: string | null };
  unread_count: number;
  updated_at: string;
};

export type ConversationMessage = {
  body: string;
  created_at: string;
  id: string;
  read_at: string | null;
  sender_id: string;
};

export function validateMessageBody(body: string) {
  if (!body.trim()) return "メッセージを入力してください。";
  if (body.length > 2000) return "メッセージは2000文字以内で入力してください。";
  return null;
}

export function totalUnreadCount(conversations: ConversationSummary[]) {
  return conversations.reduce((total, conversation) => total + conversation.unread_count, 0);
}
