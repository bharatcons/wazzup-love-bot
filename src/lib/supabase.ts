import { createClient } from '@supabase/supabase-js';
import { Reminder } from '@/types/reminder';

// Use environment variables with fallback to hardcoded values for safety
export const supabaseUrl = import.meta.env.NEXT_PUBLIC_SUPABASE_URL || 'https://znaqgqelezdzvqxqhiqi.supabase.co';
// This is the public anon key - it's safe to include in client-side code
export const supabaseAnonKey = import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpuYXFncWVsZXpkenZxeHFoaXFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyNjExNDAsImV4cCI6MjA2MTgzNzE0MH0.LZso6K7Cz5x056ZFQRb80nG2tS6iIDgG7LUNxa_7iTc';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Add console logging to debug connection issues
console.log('Supabase initialized with URL:', supabaseUrl);
console.log('Using anon key ending with:', supabaseAnonKey.substring(supabaseAnonKey.length - 10));

// Reminder database functions
export async function fetchReminders() {
  const { data, error } = await supabase
    .from('reminders')
    .select('*');
  
  if (error) {
    console.error('Error fetching reminders:', error);
    return [];
  }
  
  return data as Reminder[];
}

export async function addReminderToDb(reminder: Omit<Reminder, 'id'>) {
  const { data, error } = await supabase
    .from('reminders')
    .insert([reminder])
    .select()
    .single();
  
  if (error) {
    console.error('Error adding reminder:', error);
    throw error;
  }
  
  return data as Reminder;
}

export async function updateReminderInDb(reminder: Reminder) {
  const { error } = await supabase
    .from('reminders')
    .update(reminder)
    .eq('id', reminder.id);
  
  if (error) {
    console.error('Error updating reminder:', error);
    throw error;
  }
  
  return reminder;
}

export async function deleteReminderFromDb(id: string) {
  const { error } = await supabase
    .from('reminders')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting reminder:', error);
    throw error;
  }
  
  return id;
}
