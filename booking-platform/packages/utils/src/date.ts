/**
 * Date and time utility functions
 */

/**
 * Format a date to a readable string (DD/MM/YYYY)
 */
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Format time (HH:MM AM/PM)
 */
export const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 || 12;
  
  return `${formattedHour}:${minutes} ${suffix}`;
};

/**
 * Generate all occurrences of a recurring event
 */
export const generateOccurrences = (schedule: {
  startDate: Date;
  endDate?: Date;
  daysOfWeek?: string[];
  timeSlot: {
    start: string;
    end: string;
  };
}): Array<{ date: Date; start: string; end: string }> => {
  const { startDate, endDate, daysOfWeek, timeSlot } = schedule;
  const occurrences: Array<{ date: Date; start: string; end: string }> = [];
  
  // If not recurring, return single date
  if (!daysOfWeek || daysOfWeek.length === 0 || !endDate) {
    occurrences.push({
      date: new Date(startDate),
      start: timeSlot.start,
      end: timeSlot.end
    });
    return occurrences;
  }
  
  // Map day strings to numbers (0 = Sunday, 1 = Monday, etc.)
  const dayMap: Record<string, number> = {
    'Sun': 0,
    'Mon': 1,
    'Tue': 2,
    'Wed': 3,
    'Thu': 4,
    'Fri': 5,
    'Sat': 6
  };
  
  // Convert day strings to numbers
  const daysOfWeekNum = daysOfWeek.map(day => dayMap[day]);
  
  // Generate occurrences
  const currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0);
  
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    
    if (daysOfWeekNum.includes(dayOfWeek)) {
      occurrences.push({
        date: new Date(currentDate),
        start: timeSlot.start,
        end: timeSlot.end
      });
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return occurrences;
};

/**
 * Check if a time slot conflicts with another
 */
export const isTimeSlotConflict = (
  slot1: { start: Date; end: Date },
  slot2: { start: Date; end: Date }
): boolean => {
  return (
    (slot1.start < slot2.end && slot1.end > slot2.start) ||
    (slot2.start < slot1.end && slot2.end > slot1.start)
  );
};