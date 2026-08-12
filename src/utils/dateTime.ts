const pad = (value: number) => String(value).padStart(2, '0');

/** Formats a date/time value in local time as YYYY-MM-DD HH:mm:ss. */
export function formatDateTime(value: unknown, fallback = '-'): string {
  if (value === null || value === undefined || value === '') return fallback;

  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime()) || date.getFullYear() < 1000) return fallback;

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
