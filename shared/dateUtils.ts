import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Parses a date string or Date object into a Date object that represents the same 
 * calendar day in the local timezone, avoiding timezone shifts.
 */
export function parseDateSafe(date: string | Date | null | undefined): Date | null {
  if (!date) return null;
  
  let d: Date;

  if (date instanceof Date) {
    // Para campos DATE vindos do banco, muitos drivers retornam meia-noite em UTC.
    // Se usarmos getFullYear/getMonth/getDate no fuso local, pode "voltar um dia".
    // Extraímos os componentes em UTC e reconstruímos uma data local fixa ao meio-dia.
    return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12, 0, 0);
  } else if (typeof date === "string") {
    // Check if it's a simple YYYY-MM-DD string
    const match = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const day = parseInt(match[3], 10);
      return new Date(year, month, day, 12, 0, 0);
    }
    
    d = parseISO(date);
  } else {
    return null;
  }

  if (isNaN(d.getTime())) return null;

  // If we have a full Date object (possibly from superjson/database), 
  // we want to extract the year, month, and day as they appear in the object
  // but ensure we are at noon to avoid any timezone/DST shifts when formatting.
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0);
}

/**
 * Formats a date safely avoiding timezone shifts.
 */
export function formatDateSafe(date: string | Date | null | undefined, formatStr: string = "dd/MM/yyyy"): string {
  const d = parseDateSafe(date);
  if (!d) return "-";
  return format(d, formatStr, { locale: ptBR });
}

/**
 * Converts a date to YYYY-MM-DD string safely for HTML date inputs.
 */
export function toISODateString(date: string | Date | null | undefined): string {
  const d = parseDateSafe(date);
  if (!d) return "";
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}