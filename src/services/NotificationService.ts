import { Reminder } from "@/types/reminder";
import { getNextOccurrence, getWhatsAppLink } from "@/utils/reminderUtils";
import { updateReminderInDb } from "@/lib/supabase";
import { isLikelyIndianNumber, getIndianWhatsAppLink } from "@/utils/phoneUtils";

class NotificationService {
  private checkInterval: number | null = null;
  private reminders: Reminder[] = [];
  private audio: HTMLAudioElement | null = null;
  private autoTriggerEnabled = true; // Default to auto-trigger
  private isSoundPlaying: boolean = false; // Track sound playing state
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
    
    // Set up an interval to check for due reminders every 15 seconds for better accuracy
    this.checkInterval = window.setInterval(() => this.checkReminders(), 15000);
    
    // Also check once immediately
    this.checkReminders();
    
    // Initialize audio
    this.initializeAudio();
    
    // Request permission for notifications if needed
    this.requestNotificationPermission();
    
    // Load settings from localStorage
    this.loadSettings();
    
    console.log("Notification service initialized with auto-trigger:", this.autoTriggerEnabled);
  }
  
  private initializeAudio() {
    // Use the specific iPhone ringtone file
    this.audio = new Audio('/original-iphone-ring-24302.mp3');
    
    // Configure audio
    if (this.audio) {
      // Loop the sound
      this.audio.loop = true;
      
      // Preload the audio for faster playback
      this.audio.preload = 'auto';
      
      // Add event listeners to update status
      this.audio.onplay = () => {
        this.isSoundPlaying = true;
      };
      
      this.audio.onpause = () => {
        this.isSoundPlaying = false;
      };
      
      this.audio.onended = () => {
        this.isSoundPlaying = false;
      };
      
      // Handle errors
      this.audio.onerror = (e) => {
        console.error('Error loading notification sound:', e);
        // Fallback to the default notification sound
        this.audio = new Audio('/notification.mp3');
      };
    }
  }
  
  private loadSettings() {
    try {
      const settingsString = localStorage.getItem('wazzup-settings');
      if (settingsString) {
        const settings = JSON.parse(settingsString);
        // Check if sound is enabled in settings
        if (settings.notifications && typeof settings.notifications.sound === 'boolean') {
          // We'll still initialize audio, but respect the setting when playing
        }
        
        // Check if auto-trigger (auto-open) is enabled in settings
        if (settings.whatsapp && typeof settings.whatsapp.autoOpen === 'boolean') {
          this.autoTriggerEnabled = settings.whatsapp.autoOpen;
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
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
  
  setAutoTrigger(enabled: boolean) {
    this.autoTriggerEnabled = enabled;
    console.log(`Auto-trigger ${enabled ? 'enabled' : 'disabled'}`);
  }
  
  // Public method to check if sound is currently playing
  public isSoundActive(): boolean {
    return this.isSoundPlaying;
  }
  
  // Public method to stop the sound
  public silenceReminder(): void {
    this.stopSound(false); // Skip the fade effect for manual stops
  }
  
  private checkReminders() {
    const now = new Date();
    console.log("Checking for due reminders...", now.toLocaleTimeString());
    
    // Check all active reminders in our local cache
    if (this.reminders.length > 0) {
      let hasDueReminders = false;
      
      this.reminders.forEach(reminder => {
        const isDue = this.checkReminder(reminder);
        if (isDue) {
          hasDueReminders = true;
        }
      });
      
      if (!hasDueReminders && this.audio && !this.audio.paused) {
        // Stop sound if no reminders are due anymore
        this.stopSound(true);
      }
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
    const diffSecs = Math.floor(diffMs / 1000);
    
    // Check if the reminder is due within 30 seconds (more precise checking)
    const isDue = diffSecs >= -30 && diffSecs <= 30;
    
    if (isDue) {
      // Only trigger if it hasn't been triggered in the last 5 minutes (to prevent duplicate triggers)
      const lastTriggered = reminder.lastTriggered ? new Date(reminder.lastTriggered) : null;
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      
      if (!lastTriggered || lastTriggered < fiveMinutesAgo) {
        console.log(`Reminder due: ${reminder.contactName} - ${reminder.message}`, {
          now: now.toISOString(),
          nextOccurrence: nextOccurrence.toISOString(),
          diffMs,
          diffSecs
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
    }
    
    return false;
  }
  
  private triggerNotification(reminder: Reminder) {
    // Play the ringtone sound first
    this.playSound();
    
    // Show browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('WhatsApp Reminder', {
        body: `Time to send a message to ${reminder.contactName}: "${reminder.message.substring(0, 50)}${reminder.message.length > 50 ? '...' : ''}"`,
        icon: '/whatsapp-icon.png',
        requireInteraction: true, // Keep notification visible until user interacts with it
      });
      
      notification.onclick = () => {
        this.openWhatsApp(reminder);
        this.stopSound(true); // Stop sound when notification is clicked
        notification.close();
      };
    }
    
    // Automatically open WhatsApp if auto-trigger is enabled
    if (this.autoTriggerEnabled) {
      this.openWhatsApp(reminder);
    }
  }
  
  private playSound() {
    // Check settings first
    try {
      const settingsString = localStorage.getItem('wazzup-settings');
      if (settingsString) {
        const settings = JSON.parse(settingsString);
        if (settings.notifications && settings.notifications.sound === false) {
          console.log('Sound disabled in settings');
          return;
        }
      }
    } catch (error) {
      console.error('Error checking sound settings:', error);
    }
    
    // Play sound
    if (this.audio) {
      // Ensure volume is set appropriately
      this.audio.volume = 0.7; // 70% volume
      
      // Check if audio is already playing
      if (this.audio.paused) {
        this.audio.currentTime = 0; // Start from beginning
        
        // Play with error handling
        this.audio.play().catch(err => {
          console.error('Failed to play reminder sound:', err);
          
          // Fallback to the default notification sound if the iPhone ringtone fails
          const fallbackAudio = new Audio('/notification.mp3');
          fallbackAudio.play().catch(fallbackErr => {
            console.error('Failed to play fallback notification sound:', fallbackErr);
          });
        });
      }
    }
  }
  
  private stopSound(useFadeEffect: boolean = true) {
    if (this.audio && !this.audio.paused) {
      if (useFadeEffect) {
        // Fade out the sound gracefully
        const fadeInterval = setInterval(() => {
          if (this.audio && this.audio.volume > 0.1) {
            this.audio.volume -= 0.1;
          } else {
            clearInterval(fadeInterval);
            if (this.audio) {
              this.audio.pause();
              this.audio.currentTime = 0;
              this.audio.volume = 0.7; // Reset volume for next time
              this.isSoundPlaying = false;
            }
          }
        }, 100);
      } else {
        // Immediately stop the sound
        this.audio.pause();
        this.audio.currentTime = 0;
        this.audio.volume = 0.7; // Reset volume for next time
        this.isSoundPlaying = false;
      }
    }
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
        // Stop sound when WhatsApp opens
        this.stopSound();
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
        // Stop sound when WhatsApp opens
        this.stopSound();
      }
    }
  }
  
  cleanup() {
    if (this.checkInterval !== null) {
      window.clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    // Stop sound if playing
    this.stopSound(false);
    
    // Clean up audio
    this.audio = null;
    
    this.reminders = [];
    console.log("Notification service cleaned up");
  }
}

// Singleton
export const notificationService = new NotificationService();
export default notificationService;
