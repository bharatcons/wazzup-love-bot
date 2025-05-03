
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Reminder } from '@/types/reminder';
import { useToast } from '@/components/ui/use-toast';

interface ReminderContextType {
  reminders: Reminder[];
  addReminder: (reminder: Omit<Reminder, 'id'>) => void;
  updateReminder: (reminder: Reminder) => void;
  deleteReminder: (id: string) => void;
  toggleReminderActive: (id: string) => void;
  activeReminders: Reminder[];
  upcomingReminders: Reminder[];
}

const ReminderContext = createContext<ReminderContextType | undefined>(undefined);

export const useReminders = () => {
  const context = useContext(ReminderContext);
  if (context === undefined) {
    throw new Error('useReminders must be used within a ReminderProvider');
  }
  return context;
};

interface ReminderProviderProps {
  children: ReactNode;
}

export const ReminderProvider: React.FC<ReminderProviderProps> = ({ children }) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Load reminders from localStorage on mount
    const savedReminders = localStorage.getItem('whatsappReminders');
    if (savedReminders) {
      try {
        setReminders(JSON.parse(savedReminders));
      } catch (error) {
        console.error('Failed to parse reminders from localStorage:', error);
      }
    }
  }, []);

  useEffect(() => {
    // Save reminders to localStorage whenever they change
    localStorage.setItem('whatsappReminders', JSON.stringify(reminders));
  }, [reminders]);

  const addReminder = (reminderData: Omit<Reminder, 'id'>) => {
    const newReminder: Reminder = {
      ...reminderData,
      id: crypto.randomUUID(),
    };

    setReminders((prevReminders) => [...prevReminders, newReminder]);
    toast({
      title: "Reminder Created",
      description: `Reminder for ${reminderData.contactName} has been scheduled.`,
    });
  };

  const updateReminder = (updatedReminder: Reminder) => {
    setReminders((prevReminders) =>
      prevReminders.map((reminder) =>
        reminder.id === updatedReminder.id ? updatedReminder : reminder
      )
    );
    toast({
      title: "Reminder Updated",
      description: `Changes to reminder for ${updatedReminder.contactName} have been saved.`,
    });
  };

  const deleteReminder = (id: string) => {
    const reminderToDelete = reminders.find(reminder => reminder.id === id);
    setReminders((prevReminders) => prevReminders.filter((reminder) => reminder.id !== id));
    toast({
      title: "Reminder Deleted",
      description: reminderToDelete 
        ? `Reminder for ${reminderToDelete.contactName} has been removed.` 
        : "Reminder has been removed.",
      variant: "destructive",
    });
  };

  const toggleReminderActive = (id: string) => {
    setReminders((prevReminders) =>
      prevReminders.map((reminder) =>
        reminder.id === id
          ? { ...reminder, isActive: !reminder.isActive }
          : reminder
      )
    );
    
    const targetReminder = reminders.find(reminder => reminder.id === id);
    if (targetReminder) {
      const newState = !targetReminder.isActive;
      toast({
        title: newState ? "Reminder Activated" : "Reminder Deactivated",
        description: `Reminder for ${targetReminder.contactName} is now ${newState ? "active" : "inactive"}.`,
      });
    }
  };

  // Filter for active reminders
  const activeReminders = reminders.filter(reminder => reminder.isActive);

  // Get upcoming reminders (next 24 hours)
  const upcomingReminders = activeReminders.filter(reminder => {
    // For simplicity, we're just checking daily reminders for now
    return reminder.frequency === 'daily';
  });

  const value = {
    reminders,
    addReminder,
    updateReminder,
    deleteReminder,
    toggleReminderActive,
    activeReminders,
    upcomingReminders,
  };

  return (
    <ReminderContext.Provider value={value}>
      {children}
    </ReminderContext.Provider>
  );
};
