/**
 * Time format utilities for 12h/24h conversion
 */

export type TimeFormat = "12h" | "24h";

/**
 * Format a time string (HH:mm) for display based on user preference
 */
export function formatTimeDisplay(time: string | null | undefined, format: TimeFormat): string {
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
 * Convert 12h time parts to 24h format string (HH:mm)
 */
export function to24HourFormat(
  hour: number,
  minute: number,
  period: "AM" | "PM"
): string {
  let hours24 = hour;

  if (period === "AM") {
    if (hour === 12) hours24 = 0;
  } else {
    if (hour !== 12) hours24 = hour + 12;
  }

  return `${hours24.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
}

/**
 * Parse a 24h time string into 12h parts
 */
export function parse24HourTo12Hour(time: string): {
  hour: number;
  minute: number;
  period: "AM" | "PM";
} {
  const [hoursStr, minutesStr] = time.split(":");
  const hours24 = parseInt(hoursStr, 10);
  const minute = parseInt(minutesStr, 10) || 0;

  const period: "AM" | "PM" = hours24 >= 12 ? "PM" : "AM";
  let hour = hours24 % 12;
  if (hour === 0) hour = 12;

  return { hour, minute, period };
}

/**
 * Parse a 24h time string into parts
 */
export function parse24Hour(time: string): { hour: number; minute: number } {
  const [hoursStr, minutesStr] = time.split(":");
  return {
    hour: parseInt(hoursStr, 10) || 0,
    minute: parseInt(minutesStr, 10) || 0,
  };
}

/**
 * Get placeholder text for time input based on format
 */
export function getTimePlaceholder(format: TimeFormat): string {
  return format === "24h" ? "14:30" : "2:30 PM";
}

/**
 * Generate hour options based on format
 */
export function getHourOptions(format: TimeFormat): number[] {
  if (format === "24h") {
    return Array.from({ length: 24 }, (_, i) => i);
  }
  return Array.from({ length: 12 }, (_, i) => i + 1);
}

/**
 * Generate minute options (every 5 minutes)
 */
export function getMinuteOptions(): number[] {
  return Array.from({ length: 12 }, (_, i) => i * 5);
}