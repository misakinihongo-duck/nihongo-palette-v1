"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { validateMessageBody, type ConversationMessage, type ConversationSummary } from "@/lib/messaging";
import { createClient } from "@/lib/supabase/client";

type MessagingPanelProps = {
  activeConversationId: string | null;
  conversations: ConversationSummary[];
  onConversationChange: (conversationId: string | null) => void;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function MessagingPanel({ activeConversationId, conversations, onConversationChange }: MessagingPanelProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const activeConversation = conversations.find((conversation) => conversation.id === activeConversationId) ?? null;

  useEffect(() => {
    if (!activeConversationId) {
      return;
    }

    let isCurrent = true;
    async function loadMessages() {
      setIsLoading(true);
      setErrorMessage(null);
      const supabase = createClient();
      const [{ data, error }] = await Promise.all([
        supabase.rpc("get_conversation_messages", { p_conversation_id: activeConversationId }),
        supabase.rpc("mark_conversation_read", { p_conversation_id: activeConversationId }),
      ]);

      if (!isCurrent) return;
      setIsLoading(false);
      if (error) return setErrorMessage(error.message);
      setMessages((data ?? []) as ConversationMessage[]);
      router.refresh();
    }

    void loadMessages();
    return () => { isCurrent = false; };
  }, [activeConversationId, router]);

  async function sendMessage() {
    if (!activeConversationId) return;
    const validationError = validateMessageBody(draft);
    if (validationError) return setErrorMessage(validationError);

    setIsSubmitting(true);
    setErrorMessage(null);
    const { error } = await createClient().rpc("send_conversation_message", {
      p_body: draft,
      p_conversation_id: activeConversationId,
    });
    setIsSubmitting(false);
    if (error) return setErrorMessage(error.message);

    setDraft("");
    const { data, error: messagesError } = await createClient().rpc("get_conversation_messages", {
      p_conversation_id: activeConversationId,
    });
    if (messagesError) return setErrorMessage(messagesError.message);
    setMessages((data ?? []) as ConversationMessage[]);
    router.refresh();
  }

  if (activeConversationId && activeConversation) {
    return <section aria-labelledby="conversation-title" className="grid gap-5"><button className="w-fit text-sm font-semibold text-[#476BC7]" onClick={() => onConversationChange(null)} type="button">メッセージ一覧に戻る</button><div className="rounded-2xl border border-[#D9E1F5] bg-white"><div className="border-b border-[#E7ECF8] p-5"><p className="text-sm font-semibold text-[#6E8FE8]">MESSAGE</p><h2 className="mt-1 text-xl font-bold text-[#17203D]" id="conversation-title">{activeConversation.other.name}</h2><div className="mt-4 rounded-xl bg-[#FFF9ED] p-3"><p className="text-xs font-semibold text-[#6B7895]">サービス</p><p className="mt-1 text-sm font-semibold text-[#17203D]">{activeConversation.listing.title}</p></div></div><div className="grid min-h-64 gap-3 bg-[#FBFCFF] p-5">{isLoading ? <p className="text-sm text-[#6B7895]">メッセージを読み込んでいます。</p> : messages.length ? messages.map((message) => <div className="max-w-[85%]" key={message.id}><div className="rounded-2xl bg-white px-4 py-3 text-sm leading-6 text-[#17203D] shadow-sm">{message.body}</div><p className="mt-1 text-xs text-[#6B7895]">{formatDateTime(message.created_at)}</p></div>) : <p className="self-center text-center text-sm text-[#6B7895]">まだメッセージはありません。最初のひとことを送ってみましょう。</p>}</div><div className="border-t border-[#E7ECF8] p-4"><label className="sr-only" htmlFor="message-body">メッセージ</label><textarea className="min-h-24 w-full rounded-xl border border-[#BFCBE8] p-3 text-base text-[#17203D]" id="message-body" maxLength={2000} onChange={(event) => setDraft(event.target.value)} placeholder="メッセージを入力" value={draft} />{errorMessage ? <p aria-live="polite" className="mt-2 text-sm text-[#C95551]">{errorMessage}</p> : null}<div className="mt-3 flex justify-end"><button className="h-11 rounded-xl bg-[#6E8FE8] px-5 text-sm font-semibold text-white disabled:opacity-60" disabled={isSubmitting} onClick={() => void sendMessage()} type="button">{isSubmitting ? "送信中..." : "送信"}</button></div></div></div></section>;
  }

  return <section aria-labelledby="messages-title" className="grid gap-5"><div><p className="text-sm font-semibold text-[#6E8FE8]">MESSAGES</p><h2 className="mt-1 text-xl font-bold text-[#17203D]" id="messages-title">メッセージ</h2></div>{conversations.length ? <div className="grid gap-3">{conversations.map((conversation) => <button className="grid gap-2 rounded-2xl border border-[#D9E1F5] bg-white p-4 text-left" key={conversation.id} onClick={() => onConversationChange(conversation.id)} type="button"><div className="flex items-center justify-between gap-3"><p className="font-semibold text-[#17203D]">{conversation.other.name}</p>{conversation.unread_count ? <span className="rounded-full bg-[#F47A6A] px-2 py-0.5 text-xs font-semibold text-white">{conversation.unread_count}</span> : null}</div><p className="text-sm font-medium text-[#42506F]">{conversation.listing.title}</p><p className="truncate text-sm text-[#6B7895]">{conversation.latest_message ?? "会話をはじめましょう。"}</p><p className="text-xs text-[#6B7895]">{conversation.latest_message_at ? formatDateTime(conversation.latest_message_at) : formatDateTime(conversation.updated_at)}</p></button>)}</div> : <div className="rounded-2xl border border-dashed border-[#BFCBE8] bg-[#FFF9ED] px-5 py-8 text-sm leading-7 text-[#42506F]">まだメッセージはありません。サービス詳細や予約詳細から会話を始められます。</div>}</section>;
}
