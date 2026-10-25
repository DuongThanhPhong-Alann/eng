export function formatDuration(seconds: number | null | undefined) {
  if (seconds == null) return "—";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes === 0) return `${remainingSeconds} giây`;
  return `${minutes} phút ${remainingSeconds.toString().padStart(2, "0")} giây`;
}

export function formatDate(date: string | null | undefined) {
  if (!date) return "Đang làm dở";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(date));
}

export function normalizeAnswer(value: string) {
  return value.trim().toLocaleLowerCase("en-US").replace(/\s+/g, " ");
}
