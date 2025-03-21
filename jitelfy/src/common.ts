/*
    For commonly used helper-functions across files.
 */

import { format, formatDistance, subDays } from "date-fns";

/**
 * Formats a given date to a nicer looking string.
 * @param date the date to format
 */
export const formatDate = (date: Date) => {
    /* Make time prettier */
    return format(date, "MMM dd, yyyy HH:mm b");
}