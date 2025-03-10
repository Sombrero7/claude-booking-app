// packages/utils/package.json
{
  "name": "@booking-platform/utils",
  "version": "0.0.1",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "clean": "rm -rf dist",
    "dev": "tsc --watch"
  },
  "devDependencies": {
    "@booking-platform/typescript-config": "*",
    "@types/node": "^18.16.16",
    "typescript": "^5.1.3"
  }
}

// packages/utils/tsconfig.json
{
  "extends": "@booking-platform/typescript-config/node.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}

// packages/utils/src/index.ts
export * from './date';
export * from './api';
export * from './validators';
export * from './fees';

// packages/utils/src/date.ts
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

// packages/utils/src/api.ts
/**
 * API response utility functions
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

/**
 * Create a successful API response
 */
export const successResponse = <T>(data: T): ApiResponse<T> => {
  return {
    success: true,
    data
  };
};

/**
 * Create an error API response
 */
export const errorResponse = (message: string, code?: string): ApiResponse => {
  return {
    success: false,
    error: {
      message,
      code
    }
  };
};

// packages/utils/src/validators.ts
/**
 * Validation utility functions
 */

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate time format (HH:MM)
 */
export const isValidTimeFormat = (time: string): boolean => {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

/**
 * Validate phone number
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
};

// packages/utils/src/fees.ts
/**
 * Fee calculation utility functions
 */

/**
 * Calculate platform fee based on amount
 */
export const calculatePlatformFee = (amount: number): number => {
  if (amount < 10) {
    return 2;
  } else if (amount < 25) {
    return 3;
  } else {
    return Math.max(4, amount * 0.05); // 5% with $4 minimum
  }
};

/**
 * Calculate revenue splits for collaborators
 */
export const calculateCollaboratorSplits = (
  totalAmount: number,
  collaborators: Array<{
    creatorId: string;
    paymentType: 'percentage' | 'flat';
    paymentValue: number;
  }>
): Array<{ creatorId: string; amount: number }> => {
  return collaborators.map(collaborator => {
    let amount: number;
    
    if (collaborator.paymentType === 'percentage') {
      amount = (totalAmount * collaborator.paymentValue) / 100;
    } else {
      amount = collaborator.paymentValue;
    }
    
    return {
      creatorId: collaborator.creatorId,
      amount
    };
  });
};
