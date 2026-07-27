import {
  addDays,
  addMonths,
  addYears,
  endOfMonth,
  formatISO,
  isAfter,
  isBefore,
  isEqual,
  parseISO,
  startOfMonth,
} from 'date-fns';

export const parseDate = (value: string): Date => parseISO(value);

export const toIsoDate = (date: Date): string => formatISO(date, { representation: 'date' });

export const monthStart = (value: string): Date => startOfMonth(parseDate(value));

export const monthEnd = (value: string): Date => endOfMonth(parseDate(value));

export const eachMonth = (startDate: string, endDate: string): string[] => {
  const start = startOfMonth(parseDate(startDate));
  const end = startOfMonth(parseDate(endDate));
  const months: string[] = [];
  let cursor = start;

  while (!isAfter(cursor, end)) {
    months.push(toIsoDate(cursor));
    cursor = addMonths(cursor, 1);
  }

  return months;
};

export const isWithinInclusive = (
  date: Date,
  start: Date,
  end?: Date,
): boolean => {
  if (isBefore(date, start)) {
    return false;
  }

  if (!end) {
    return true;
  }

  return isBefore(date, end) || isEqual(date, end);
};

export const addByFrequency = (
  date: Date,
  frequency:
    | 'one-time'
    | 'weekly'
    | 'biweekly'
    | 'monthly'
    | 'quarterly'
    | 'semi-annual'
    | 'annual',
): Date => {
  switch (frequency) {
    case 'one-time':
      return addYears(date, 1000);
    case 'weekly':
      return addDays(date, 7);
    case 'biweekly':
      return addDays(date, 14);
    case 'monthly':
      return addMonths(date, 1);
    case 'quarterly':
      return addMonths(date, 3);
    case 'semi-annual':
      return addMonths(date, 6);
    case 'annual':
      return addYears(date, 1);
    default:
      return date;
  }
};
