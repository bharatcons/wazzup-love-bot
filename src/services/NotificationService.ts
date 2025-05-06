import { Reminder } from "@/types/reminder";
import { getNextOccurrence, getWhatsAppLink } from "@/utils/reminderUtils";
import { updateReminderInDb } from "@/lib/supabase";
import { isLikelyIndianNumber, getIndianWhatsAppLink } from "@/utils/phoneUtils";

class NotificationService {
  private checkInterval: number | null = null;
  private reminders: Reminder[] = [];
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
    
    // Set up an interval to check for due reminders every minute for better accuracy
    this.checkInterval = window.setInterval(() => this.checkReminders(), 60000);
    
    // Also check once immediately
    this.checkReminders();
    
    // Request permission for notifications if needed
    this.requestNotificationPermission();
    
    console.log("Notification service initialized");
  }
  
  private async requestNotificationPermission() {
    if ('Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        await Notification.requestPermission();
      }
    }
  }
  
  setReminders(reminders: Reminder[]) {
    this.reminders = reminders.filter(r => r.isActive);
    console.log(`Notification service tracking ${this.reminders.length} active reminders`);
  }
  
  private checkReminders() {
    console.log("Checking for due reminders...", new Date().toLocaleTimeString());
    
    // Check all active reminders in our local cache
    if (this.reminders.length > 0) {
      this.reminders.forEach(reminder => {
        this.checkReminder(reminder);
      });
    }
  }
  
  public async checkReminder(reminder: Reminder): Promise<boolean> {
    if (!reminder.isActive) return false;
    
    const now = new Date();
    const nextOccurrence = getNextOccurrence(reminder);
    
    if (!nextOccurrence) return false;
    
    // Calculate time difference in minutes
    const diffMs = nextOccurrence.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    // Check if the reminder is due within 1 minute (more precise checking)
    const isDue = diffMins === 0;
    
    if (isDue) {
      console.log(`Reminder due: ${reminder.contactName} - ${reminder.message}`, {
        now: now.toISOString(),
        nextOccurrence: nextOccurrence.toISOString(),
        diffMs,
        diffMins
      });
      
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
    
    // Check if it's an Indian number for specialized handling
    if (isLikelyIndianNumber(reminder.phoneNumber)) {
      // Use our specialized Indian number WhatsApp link generator with message already encoded
      const whatsappUrl = getIndianWhatsAppLink(reminder.phoneNumber, reminder.message);
      
      if (isMobile) {
        window.location.href = whatsappUrl;
      } else {
        window.open(whatsappUrl, '_blank')?.focus();
      }
    } else {
      // Format the WhatsApp URL with pre-filled message for non-Indian numbers
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
  }
  
  cleanup() {
    if (this.checkInterval !== null) {
      window.clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.reminders = [];
    console.log("Notification service cleaned up");
  }
}

// Singleton
export const notificationService = new NotificationService();
export default notificationService;
