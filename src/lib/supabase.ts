
import { createClient } from '@supabase/supabase-js';
import { Reminder } from '@/types/reminder';

export const supabaseUrl = 'https://znaqgqelezdzvqxqhiqi.supabase.co';
// This is the public anon key - it's safe to include in client-side code
export const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpuYXFncWVsZXpkenZxeHFoaXFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTUzMTgyNDAsImV4cCI6MjAzMDg5NDI0MH0.M5AKnAO1QHonl0Vmhj_36oLhPFwwN6NnCis0v9_Qu7Y';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
