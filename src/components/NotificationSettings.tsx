import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { Bell, Volume2, Smartphone, Check } from 'lucide-react';

interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
}

const NotificationSettings: React.FC = () => {
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    sound: true
  });
  const [notificationPermission, setNotificationPermission] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check notification permission on mount
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    // Load settings from localStorage
    try {
      const savedSettings = localStorage.getItem('wazzup-notification-settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  }, []);

  const updateSettings = (newSettings: Partial<NotificationSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    
    // Save to localStorage
    try {
      localStorage.setItem('wazzup-notification-settings', JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast({
        title: "Notifications not supported",
        description: "Your browser doesn't support notifications",
        variant: "destructive"
      });
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        toast({
          title: "Notifications enabled",
          description: "You will now receive notifications for reminders"
        });
        updateSettings({ enabled: true });
      } else {
        toast({
          title: "Notification permission denied",
          description: "You won't receive notifications for reminders",
          variant: "destructive"
        });
        updateSettings({ enabled: false });
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast({
        title: "Error",
        description: "Failed to request notification permission",
        variant: "destructive"
      });
    }
  };

  const requestContactsPermission = async () => {
    try {
      if ('contacts' in navigator && 'ContactsManager' in window) {
        const props = ['name', 'tel'];
        const opts = { multiple: true };
        
        // Just attempt to select a contact to trigger the permission dialog
        await navigator.contacts!.select(props, opts);
        toast({
          title: "Contact access granted",
          description: "You can now import contacts from your phone"
        });
      } else {
        toast({
          title: "Contacts API not supported",
          description: "Your browser doesn't support the Contact Picker API. Try using Chrome on Android or Safari on iOS.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error requesting contacts permission:", error);
      toast({
        title: "Permission denied",
        description: "Contact access permission was denied",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Notification Settings</CardTitle>
        <CardDescription>
          Configure how you receive reminders
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Enable Notifications</h3>
              <p className="text-sm text-muted-foreground">
                Receive browser notifications for reminders
              </p>
            </div>
            <Switch 
              checked={settings.enabled} 
              onCheckedChange={(checked) => updateSettings({ enabled: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Sound</h3>
              <p className="text-sm text-muted-foreground">
                Play sound when reminders are due
              </p>
            </div>
            <Switch 
              checked={settings.sound} 
              onCheckedChange={(checked) => updateSettings({ sound: checked })}
            />
          </div>
        </div>
        
        <Separator className="my-4" />
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Permissions</h3>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Contacts Access</h4>
                <p className="text-sm text-muted-foreground">
                  Allow access to your device contacts
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={requestContactsPermission}
              >
                <Smartphone className="h-4 w-4 mr-2" />
                Request Access
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Notification Permission</h4>
                <p className="text-sm text-muted-foreground">
                  Allow browser notifications for reminders
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={requestNotificationPermission}
                className={notificationPermission === 'granted' ? 'bg-green-500/10' : ''}
              >
                {notificationPermission === 'granted' ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <Bell className="h-4 w-4 mr-2" />
                )}
                {notificationPermission === 'granted' ? 'Granted' : 'Request Access'}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationSettings; 