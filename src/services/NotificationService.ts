
import { Reminder } from "@/types/reminder";
import { getNextOccurrence, getWhatsAppLink } from "@/utils/reminderUtils";

class NotificationService {
  private checkInterval: number | null = null;
  private callbacks: {
    onReminderDue: (reminder: Reminder) => void;
  } = {
    onReminderDue: () => {}
  };

  initialize(onReminderDue: (reminder: Reminder) => void) {
    this.callbacks.onReminderDue = onReminderDue;
    
    // Clear any existing interval
    if (this.checkInterval !== null) {
      window.clearInterval(this.checkInterval);
    }
    
    // Set up an interval to check for due reminders (every minute)
    this.checkInterval = window.setInterval(() => this.checkReminders(), 60000);
    
    // Also check once immediately
    this.checkReminders();
    
    // Request permission for notifications if needed
    this.requestNotificationPermission();
  }
  
  private async requestNotificationPermission() {
    if ('Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        await Notification.requestPermission();
      }
    }
  }
  
  private checkReminders() {
    // This would be called by the external context that has the reminder data
    console.log("Checking for due reminders...");
  }
  
  public checkReminder(reminder: Reminder): boolean {
    if (!reminder.isActive) return false;
    
    const now = new Date();
    const nextOccurrence = getNextOccurrence(reminder);
    
    if (!nextOccurrence) return false;
    
    // Check if the reminder is due within the next minute
    const diffMs = nextOccurrence.getTime() - now.getTime();
    const isDue = diffMs >= 0 && diffMs <= 60000;
    
    if (isDue) {
      console.log(`Reminder due: ${reminder.contactName} - ${reminder.message}`);
      this.triggerNotification(reminder);
      this.callbacks.onReminderDue(reminder);
      return true;
    }
    
    return false;
  }
  
  private triggerNotification(reminder: Reminder) {
    // Show browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('WhatsApp Reminder', {
        body: `Time to send a message to ${reminder.contactName}: "${reminder.message.substring(0, 50)}${reminder.message.length > 50 ? '...' : ''}"`,
        icon: '/whatsapp-icon.png',
      });
      
      notification.onclick = () => {
        window.open(getWhatsAppLink(reminder.phoneNumber), '_blank');
        notification.close();
      };
    }
    
    // Play sound
    const audio = new Audio('/notification.mp3');
    audio.play().catch(err => console.error('Failed to play notification sound:', err));
  }
  
  cleanup() {
    if (this.checkInterval !== null) {
      window.clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

// Singleton
export const notificationService = new NotificationService();
export default notificationService;
