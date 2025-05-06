import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Reminder } from '@/types/reminder';
import { useToast } from '@/components/ui/use-toast';
import { fetchReminders, addReminderToDb, updateReminderInDb, deleteReminderFromDb, supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNextOccurrence } from '@/utils/reminderUtils';

interface ReminderContextType {
  reminders: Reminder[];
  isLoading: boolean;
  error: Error | null;
  addReminder: (reminder: Omit<Reminder, 'id'>) => Promise<void>;
  updateReminder: (reminder: Reminder) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  toggleReminderActive: (id: string) => Promise<void>;
  activeReminders: Reminder[];
  upcomingReminders: Reminder[];
  setReminders: (reminders: Reminder[]) => void;
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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Load reminders from Supabase
  const { 
    data: reminders = [], 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['reminders'],
    queryFn: fetchReminders,
  });

  // Set up Supabase real-time subscription
  useEffect(() => {
    const subscription = supabase
      .channel('reminders-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'reminders' 
      }, () => {
        // Invalidate the query to refetch data
        queryClient.invalidateQueries({ queryKey: ['reminders'] });
      })
      .subscribe();
      
    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  // Add reminder mutation
  const addReminderMutation = useMutation({
    mutationFn: addReminderToDb,
    onSuccess: (newReminder) => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      toast({
        title: "Reminder Created",
        description: `Reminder for ${newReminder.contactName} has been scheduled.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create reminder",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update reminder mutation
  const updateReminderMutation = useMutation({
    mutationFn: updateReminderInDb,
    onSuccess: (updatedReminder) => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      toast({
        title: "Reminder Updated",
        description: `Changes to reminder for ${updatedReminder.contactName} have been saved.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update reminder",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete reminder mutation
  const deleteReminderMutation = useMutation({
    mutationFn: deleteReminderFromDb,
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      const reminderToDelete = reminders.find(reminder => reminder.id === id);
      toast({
        title: "Reminder Deleted",
        description: reminderToDelete 
          ? `Reminder for ${reminderToDelete.contactName} has been removed.` 
          : "Reminder has been removed.",
        variant: "destructive",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete reminder",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const addReminder = async (reminderData: Omit<Reminder, 'id'>) => {
    await addReminderMutation.mutateAsync(reminderData);
  };

  const updateReminder = async (updatedReminder: Reminder) => {
    await updateReminderMutation.mutateAsync(updatedReminder);
  };

  const deleteReminder = async (id: string) => {
    await deleteReminderMutation.mutateAsync(id);
  };

  const toggleReminderActive = async (id: string) => {
    const targetReminder = reminders.find(reminder => reminder.id === id);
    if (targetReminder) {
      const newState = !targetReminder.isActive;
      await updateReminderMutation.mutateAsync({
        ...targetReminder,
        isActive: newState
      });
      
      toast({
        title: newState ? "Reminder Activated" : "Reminder Deactivated",
        description: `Reminder for ${targetReminder.contactName} is now ${newState ? "active" : "inactive"}.`,
      });
    }
  };

  // Filter for active reminders
  const activeReminders = reminders.filter(reminder => reminder.isActive);

  // Get upcoming reminders (next 24 hours)
  const upcomingReminders = activeReminders
    .map(reminder => {
      const nextOccurrence = getNextOccurrence(reminder);
      return { reminder, nextOccurrence };
    })
    .filter(({ nextOccurrence }) => {
      if (!nextOccurrence) return false;
      const now = new Date();
      const inNextDay = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      return nextOccurrence <= inNextDay;
    })
    .sort((a, b) => {
      if (!a.nextOccurrence) return 1;
      if (!b.nextOccurrence) return -1;
      return a.nextOccurrence.getTime() - b.nextOccurrence.getTime();
    })
    .map(({ reminder }) => reminder);

  // Add this function to allow bulk setting of reminders (for backup/restore)
  const setReminders = (newReminders: Reminder[]) => {
    // Update cache immediately for a responsive UI
    queryClient.setQueryData(['reminders'], newReminders);
    
    // Then update the database in background
    Promise.all(newReminders.map(reminder => updateReminderInDb(reminder)))
      .then(() => {
        toast({
          title: "Reminders Restored",
          description: `${newReminders.length} reminders have been restored successfully.`,
        });
      })
      .catch((error) => {
        console.error('Error restoring reminders:', error);
        toast({
          title: "Restore Error",
          description: "There was an error restoring some reminders.",
          variant: "destructive",
        });
        
        // Refetch to ensure UI is in sync with database
        queryClient.invalidateQueries({ queryKey: ['reminders'] });
      });
  };

  const value = {
    reminders,
    isLoading,
    error: error as Error | null,
    addReminder,
    updateReminder,
    deleteReminder,
    toggleReminderActive,
    activeReminders,
    upcomingReminders,
    setReminders,
  };

  return (
    <ReminderContext.Provider value={value}>
      {children}
    </ReminderContext.Provider>
  );
};
