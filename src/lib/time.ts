// src/lib/time.ts
import { DateTime } from "luxon";

export const BUSINESS_TZ = "America/Toronto";

export function slotToInstantISO(dateISO: string, timeHHMM: string): string {
  const [hour, minute] = timeHHMM.split(":").map(Number);

  const dt = DateTime.fromISO(dateISO, { zone: BUSINESS_TZ })
    .set({ hour, minute, second: 0, millisecond: 0 });

  if (!dt.isValid) throw new Error(`Invalid slot datetime: ${dt.invalidReason}`);

  return dt.toUTC().toISO()!;
}

export function dayRangeInstantISO(dateISO: string): { startISO: string; endISO: string } {
  const start = DateTime.fromISO(dateISO, { zone: BUSINESS_TZ }).startOf("day");
  const end = start.plus({ days: 1 });

  return { startISO: start.toUTC().toISO()!, endISO: end.toUTC().toISO()! };
}
