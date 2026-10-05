import type { ReminderRepeatType } from '@/types/reminder';

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function withClampedDay(
  anchor: Date,
  year: number,
  monthIndex: number,
  day: number,
): Date {
  const next = new Date(anchor);
  next.setFullYear(year, monthIndex, Math.min(day, daysInMonth(year, monthIndex)));
  return next;
}

export function calculateNextDueDate(
  currentDueDateIso: string,
  repeatType: ReminderRepeatType,
  originalAnchorIso?: string | null,
): string {
  const currentDate = new Date(currentDueDateIso);
  if (Number.isNaN(currentDate.getTime())) return currentDueDateIso;

  if (repeatType === 'one-time') {
    return currentDueDateIso;
  }

  const anchor = originalAnchorIso ? new Date(originalAnchorIso) : currentDate;
  const anchorDay = Number.isNaN(anchor.getTime()) ? currentDate.getDate() : anchor.getDate();
  const anchorMonth = Number.isNaN(anchor.getTime()) ? currentDate.getMonth() : anchor.getMonth();

  if (repeatType === 'weekly') {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 7);
    return next.toISOString();
  }

  if (repeatType === 'monthly') {
    const nextMonthIndex = currentDate.getMonth() + 1;
    const nextYear = currentDate.getFullYear() + Math.floor(nextMonthIndex / 12);
    const normalizedMonthIndex = nextMonthIndex % 12;
    const next = withClampedDay(currentDate, nextYear, normalizedMonthIndex, anchorDay);
    return next.toISOString();
  }

  if (repeatType === 'yearly') {
    const nextYear = currentDate.getFullYear() + 1;
    const next = withClampedDay(currentDate, nextYear, anchorMonth, anchorDay);
    return next.toISOString();
  }

  return currentDueDateIso;
}
