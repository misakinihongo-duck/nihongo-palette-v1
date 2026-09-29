export type BookingDraft = {
  message: string;
  partySize: string;
  scheduleId: string | null;
};

export function validateBookingDraft({ message, partySize, scheduleId }: BookingDraft, availableCapacity: number) {
  if (!scheduleId) return "日時を選択してください。";
  if (!Number.isInteger(Number(partySize)) || Number(partySize) < 1) {
    return "参加人数は1人以上の整数で入力してください。";
  }
  if (Number(partySize) > availableCapacity) return "選択した日時枠の残席を超えています。";
  if (message.length > 1000) return "メッセージは1000文字以内で入力してください。";

  return null;
}
