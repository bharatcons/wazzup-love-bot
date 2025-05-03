
import { Reminder } from "@/types/reminder";
import { getNextOccurrence, getWhatsAppLink } from "@/utils/reminderUtils";
import { updateReminderInDb } from "@/lib/supabase";

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
    
    // Set up an interval to check for due reminders every 15 seconds for better responsiveness
    this.checkInterval = window.setInterval(() => this.checkReminders(), 15000);
    
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
  
  public async checkReminder(reminder: Reminder): Promise<boolean> {
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
      
      // Update the last triggered time in the database
      try {
        await updateReminderInDb({ 
          ...reminder, 
          lastTriggered: new Date().toISOString() 
        });
      } catch (error) {
        console.error('Failed to update lastTriggered timestamp:', error);
      }
      
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
        this.openWhatsApp(reminder);
        notification.close();
      };
    }
    
    // Play sound
    const audio = new Audio('/notification.mp3');
    audio.play().catch(err => console.error('Failed to play notification sound:', err));
    
    // Automatically open WhatsApp without requiring user interaction
    this.openWhatsApp(reminder);
  }
  
  private openWhatsApp(reminder: Reminder) {
    // Check if we're on mobile or desktop to determine the best way to open WhatsApp
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Format the WhatsApp URL with pre-filled message
    const encodedMessage = encodeURIComponent(reminder.message);
    const whatsappUrl = `${getWhatsAppLink(reminder.phoneNumber)}&text=${encodedMessage}`;
    
    if (isMobile) {
      // On mobile, try to open the WhatsApp app directly
      window.location.href = whatsappUrl;
    } else {
      // On desktop, open in a new tab
      window.open(whatsappUrl, '_blank')?.focus();
    }
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
