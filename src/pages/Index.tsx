
import React, { useEffect } from 'react';
import Header from '@/components/Header';
import ReminderList from '@/components/ReminderList';
import { ReminderProvider, useReminders } from '@/contexts/ReminderContext';
import notificationService from '@/services/NotificationService';
import { useToast } from '@/components/ui/use-toast';
import UpcomingReminders from '@/components/UpcomingReminders';
import { getWhatsAppLink } from '@/utils/reminderUtils';

const ReminderNotifications: React.FC = () => {
  const { activeReminders } = useReminders();
  const { toast } = useToast();
  
  useEffect(() => {
    // Initialize notification service
    notificationService.initialize((reminder) => {
      // Callback for when a reminder is due
      toast({
        title: `Time to send a WhatsApp message!`,
        description: (
          <div className="space-y-2">
            <p>Send to <strong>{reminder.contactName}</strong>:</p>
            <div className="whatsapp-bubble">{reminder.message}</div>
          </div>
        ),
        action: (
          <a 
            href={getWhatsAppLink(reminder.phoneNumber)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 shrink-0 items-center justify-center rounded-md bg-whatsapp px-3 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-whatsapp-dark focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            Open WhatsApp
          </a>
        ),
        duration: 60000, // 1 minute
      });
    });
    
    return () => {
      // Cleanup notification service
      notificationService.cleanup();
    };
  }, [toast]);
  
  useEffect(() => {
    // Check for due reminders every 15 seconds
    const checkInterval = setInterval(() => {
      activeReminders.forEach(reminder => {
        notificationService.checkReminder(reminder);
      });
    }, 15000);
    
    return () => clearInterval(checkInterval);
  }, [activeReminders]);
  
  return null;
};

const Index: React.FC = () => {
  return (
    <ReminderProvider>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <ReminderNotifications />
          <UpcomingReminders />
          <ReminderList />
        </main>
        <footer className="mt-12 py-6 border-t text-center text-sm text-muted-foreground">
          <p>WhatsApp Reminder Manager &copy; {new Date().getFullYear()}</p>
        </footer>
      </div>
    </ReminderProvider>
  );
};

export default Index;
