import { Reminder, ReminderTime, WeekDay } from "@/types/reminder";

export const formatReminderTime = (time: ReminderTime): string => {
  const hour = time.hour % 12 || 12; // Convert to 12-hour format
  const minute = time.minute.toString().padStart(2, '0');
  const period = time.hour >= 12 ? 'PM' : 'AM';
  return `${hour}:${minute} ${period}`;
};

export const formatPhoneNumber = (phoneNumber: string): string => {
  // Clean the phone number (remove any non-numeric characters)
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Check if it's a valid number (at least 10 digits)
  if (cleaned.length < 10) return phoneNumber;
  
  // Format as (XXX) XXX-XXXX for US numbers or keep original format
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  // International format
  return `+${cleaned}`;
};

export const getWhatsAppLink = (phoneNumber: string): string => {
  // Clean the phone number (remove any non-numeric characters)
  const cleaned = phoneNumber.replace(/\D/g, '');
  return `https://wa.me/${cleaned}`;
};

export const truncateMessage = (message: string, maxLength: number = 50): string => {
  if (message.length <= maxLength) return message;
  return message.substring(0, maxLength) + '...';
};

export const getNextOccurrence = (reminder: Reminder): Date | null => {
  const now = new Date();
  const today = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Convert reminder time to today's date
  const reminderTime = new Date();
  reminderTime.setHours(reminder.time.hour, reminder.time.minute, 0, 0);
  
  // Handle different frequencies
  switch (reminder.frequency) {
    case 'daily':
      // If the time already passed today, set it for tomorrow
      if (reminderTime <= now) {
        reminderTime.setDate(reminderTime.getDate() + 1);
      }
      break;
      
    case 'weekly':
      if (!reminder.weekDays || reminder.weekDays.length === 0) return null;
      
      // Map day strings to numbers (0-6)
      const dayMap: Record<WeekDay, number> = {
        sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6
      };
      
      // Convert weekDays to numbers
      const weekDayNumbers = reminder.weekDays.map(day => dayMap[day]);
      
      // Find the next occurrence
      let daysToAdd = 0;
      let foundNextDay = false;
      
      // Try each day for a week
      for (let i = 0; i < 7; i++) {
        const checkDay = (today + i) % 7;
        if (weekDayNumbers.includes(checkDay)) {
          daysToAdd = i;
          foundNextDay = true;
          break;
        }
      }
      
      if (!foundNextDay) return null;
      
      // Set to the next occurrence
      reminderTime.setDate(reminderTime.getDate() + daysToAdd);
      
      // If it's today but the time has passed, go to next week
      if (daysToAdd === 0 && reminderTime <= now) {
        reminderTime.setDate(reminderTime.getDate() + 7);
      }
      break;
      
    case 'monthly':
      if (!reminder.monthDay) return null;
      
      // Set to this month's occurrence
      reminderTime.setDate(reminder.monthDay);
      
      // If the day already passed this month, go to next month
      if (reminderTime <= now) {
        reminderTime.setMonth(reminderTime.getMonth() + 1);
      }
      break;
      
    case 'once':
      if (!reminder.date) return null;
      
      // Parse the date string
      const oneTimeDate = new Date(reminder.date);
      oneTimeDate.setHours(reminder.time.hour, reminder.time.minute, 0, 0);
      
      // If the date is in the past, return null
      if (oneTimeDate <= now) return null;
      
      return oneTimeDate;
      
    default:
      return null;
  }
  
  return reminderTime;
};

export const getTimeUntilNextOccurrence = (reminder: Reminder): string => {
  const nextOccurrence = getNextOccurrence(reminder);
  
  if (!nextOccurrence) return 'No upcoming occurrence';
  
  const now = new Date();
  const diffMs = nextOccurrence.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 60) {
    return `${diffMins} minute${diffMins !== 1 ? 's' : ''} from now`;
  }
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} from now`;
  }
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays !== 1 ? 's' : ''} from now`;
};

export const getFrequencyLabel = (reminder: Reminder): string => {
  switch (reminder.frequency) {
    case 'daily':
      return 'Every day';
    
    case 'weekly':
      if (!reminder.weekDays || reminder.weekDays.length === 0) return 'Weekly';
      if (reminder.weekDays.length === 7) return 'Every day';
      
      // Capitalize and join day names
      const dayNames = {
        mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday',
        thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday'
      };
      
      return reminder.weekDays.map(day => dayNames[day]).join(', ');
    
    case 'monthly':
      if (!reminder.monthDay) return 'Monthly';
      
      // Add suffix to day number
      const day = reminder.monthDay;
      let suffix = 'th';
      if (day === 1 || day === 21 || day === 31) suffix = 'st';
      if (day === 2 || day === 22) suffix = 'nd';
      if (day === 3 || day === 23) suffix = 'rd';
      
      return `Monthly on the ${day}${suffix}`;
    
    case 'once':
      if (!reminder.date) return 'One-time';
      return `Once on ${new Date(reminder.date).toLocaleDateString()}`;
    
    default:
      return 'Unknown frequency';
  }
};
