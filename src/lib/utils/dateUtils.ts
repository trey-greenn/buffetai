import { format, toZonedTime } from 'date-fns-tz';

// NYC timezone
export const NYC_TIMEZONE = 'America/New_York';

// Format date to NYC timezone
export function formatToEasternTime(dateString: string): string {
  if (!dateString) return 'Not set';
  
  try {
    const date = new Date(dateString);
    const nyTime = toZonedTime(date, NYC_TIMEZONE);
    return format(nyTime, 'MMM d, yyyy h:mm a zzz', { timeZone: NYC_TIMEZONE });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

// Convert local datetime-local input to NYC timezone
export function convertToEasternTime(localDateString: string): string {
  if (!localDateString) return '';
  
  try {
    // Create a date from the local input
    const date = new Date(localDateString);
    
    // Convert to NYC time by manually adjusting for timezone
    const nyTime = toZonedTime(date, NYC_TIMEZONE);
    
    // Return ISO string for storage
    return nyTime.toISOString();
  } catch (error) {
    console.error('Error converting to Eastern time:', error);
    return '';
  }
}
