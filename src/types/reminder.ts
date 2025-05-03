
export type Frequency = 'daily' | 'weekly' | 'monthly' | 'once';

export type WeekDay = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface ReminderTime {
  hour: number;
  minute: number;
}

export interface Reminder {
  id: string;
  contactName: string;
  phoneNumber: string;
  message: string;
  time: ReminderTime;
  frequency: Frequency;
  weekDays?: WeekDay[];
  monthDay?: number;
  date?: string; // ISO string for 'once' frequency
  isActive: boolean;
  lastTriggered?: string; // ISO date string
}
