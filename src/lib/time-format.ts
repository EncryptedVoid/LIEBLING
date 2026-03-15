/**
 * Format a time string (HH:mm) based on user preference
 */
export function formatTimeDisplay(time: string, format: "12h" | "24h"): string {
  if (!time) return "";

  const [hoursStr, minutesStr] = time.split(":");
  const hours = parseInt(hoursStr, 10);
  const minutes = minutesStr || "00";

  if (format === "24h") {
    return `${hours.toString().padStart(2, "0")}:${minutes}`;
  }

  // 12h format
  const ampm = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

/**
 * Get placeholder text for time input based on format
 */
export function getTimePlaceholder(format: "12h" | "24h"): string {
  return format === "24h" ? "14:30" : "2:30 PM";
}