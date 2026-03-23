import { fromZonedTime, formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale";

/**
 * Convierte fecha y hora ingresadas por el usuario (en su zona horaria) a UTC para guardar en DB.
 * @param date  "2026-03-22"
 * @param time  "19:15"
 * @param tz    "America/Lima" | "America/Bogota" | etc.
 */
export function toUTC(date: string, time: string, tz: string): Date {
  return fromZonedTime(new Date(`${date}T${time}:00`), tz);
}

/**
 * Formatea una fecha UTC de la DB en la zona horaria del usuario.
 */
export function tzFormat(
  date: Date | string,
  fmt: string,
  tz: string
): string {
  return formatInTimeZone(new Date(date), tz, fmt, { locale: es });
}

/**
 * Retorna la zona horaria del navegador. Solo usar en componentes cliente.
 */
export function getBrowserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
