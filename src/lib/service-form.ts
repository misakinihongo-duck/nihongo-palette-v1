export type ServiceDetails = {
  capacity: string;
  durationMinutes: string;
  format: "online" | "offline";
  location: string;
  price: string;
};

export type ServiceSchedule = {
  capacity: string;
  date: string;
  endTime: string;
  startTime: string;
};

export function validateServiceDetails({ capacity, durationMinutes, format, location, price }: ServiceDetails) {
  if (!Number.isInteger(Number(price)) || Number(price) < 0) {
    return "料金は0以上の整数で入力してください。";
  }
  if (!Number.isInteger(Number(durationMinutes)) || Number(durationMinutes) <= 0) {
    return "所要時間は1分以上の整数で入力してください。";
  }
  if (!Number.isInteger(Number(capacity)) || Number(capacity) <= 0) {
    return "定員は1人以上の整数で入力してください。";
  }
  if (format === "offline" && !location.trim()) {
    return "オフライン開催の場合は場所を入力してください。";
  }

  return null;
}

export function validateServiceSchedule({ capacity, date, endTime, startTime }: ServiceSchedule) {
  if (!date || !startTime || !endTime) return "日付と開始・終了時刻を入力してください。";
  if (!Number.isInteger(Number(capacity)) || Number(capacity) <= 0) {
    return "日時枠の定員は1人以上の整数で入力してください。";
  }
  if (`${date}T${endTime}` <= `${date}T${startTime}`) {
    return "終了時刻は開始時刻より後にしてください。";
  }

  return null;
}
