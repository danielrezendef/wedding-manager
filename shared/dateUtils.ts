import { format, parseISO } from "date-fns";

/**
 * Parses a date string or Date object into a Date object that represents the same 
 * calendar day in the local timezone, avoiding timezone shifts.
 */
export function parseDateSafe(date: string | Date | null | undefined): Date | null {
  if (!date) return null;
  
  if (typeof date === "string") {
    // If it's just YYYY-MM-DD, parse it manually to avoid UTC shift
    const match = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const day = parseInt(match[3], 10);
      // Create date at noon in local time to avoid any DST or timezone edge cases
      return new Date(year, month, day, 12, 0, 0);
    }
    
    // Otherwise try parseISO
    const parsed = parseISO(date);
    if (!isNaN(parsed.getTime())) {
      parsed.setHours(12, 0, 0, 0);
      return parsed;
    }
  }
  
  if (date instanceof Date) {
    const d = new Date(date.getTime());
    d.setHours(12, 0, 0, 0);
    return d;
  }
  
  return null;
}

/**
 * Formats a date safely avoiding timezone shifts.
 */
export function formatDateSafe(date: string | Date | null | undefined, formatStr: string = "dd/MM/yyyy"): string {
  const d = parseDateSafe(date);
  if (!d) return "-";
  return format(d, formatStr);
}

/**
 * Converts a date to YYYY-MM-DD string safely.
 */
export function toISODateString(date: string | Date | null | undefined): string {
  const d = parseDateSafe(date);
  if (!d) return "";
  return format(d, "yyyy-MM-dd");
}
