import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Volume2, Moon, Sun, Save, RotateCcw, Smartphone, Globe, MessageSquare, Database } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import BackupRestore from '@/components/BackupRestore';
import { Separator } from '@/components/ui/separator';

interface Settings {
  notifications: {
    sound: boolean;
    browser: boolean;
    previewMessages: boolean;
    reminderLeadTime: number; // minutes before reminder is due
  };
  appearance: {
    theme: 'light' | 'dark' | 'system';
    fontSize: 'small' | 'medium' | 'large';
    compactMode: boolean;
  };
  whatsapp: {
    defaultCountryCode: string;
    defaultMessage: string;
    openMethod: 'app' | 'web';
    autoOpen: boolean;
    autoFormatIndian?: boolean;
    addIndianCountryCode?: boolean;
  };
}

const defaultSettings: Settings = {
  notifications: {
    sound: true,
    browser: true,
    previewMessages: true,
    reminderLeadTime: 1, // 1 minute
  },
  appearance: {
    theme: 'system',
    fontSize: 'medium',
    compactMode: false,
  },
  whatsapp: {
    defaultCountryCode: '1', // US
    defaultMessage: '',
    openMethod: 'web',
    autoOpen: true,
  }
};

const SettingsForm: React.FC = () => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { toast } = useToast();

  // Check if the screen is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Load settings from localStorage on component mount
  useEffect(() => {
    const storedSettings = localStorage.getItem('wazzup-settings');
    if (storedSettings) {
      try {
        setSettings(JSON.parse(storedSettings));
      } catch (error) {
        console.error('Error parsing stored settings:', error);
      }
    }
  }, []);

  const saveSettings = () => {
    setIsLoading(true);
    
    // Simulate a delay to show loading state
    setTimeout(() => {
      // Save to localStorage
      localStorage.setItem('wazzup-settings', JSON.stringify(settings));
      
      // Show success toast
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated.",
      });
      
      setIsLoading(false);
    }, 600);
  };

  const resetSettings = () => {
    if (confirm('Reset all settings to default values?')) {
      setSettings(defaultSettings);
      toast({
        title: "Settings reset",
        description: "All settings have been reset to default values.",
      });
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-0">
        <h2 className="text-xl md:text-2xl font-bold">Settings</h2>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={resetSettings} disabled={isLoading} size={isMobile ? "sm" : "default"} className="text-xs md:text-sm">
            <RotateCcw className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
            Reset
          </Button>
          <Button onClick={saveSettings} disabled={isLoading} size={isMobile ? "sm" : "default"} className="text-xs md:text-sm">
            <Save className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
            {isLoading ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="notifications" className="w-full">
        <TabsList className="flex overflow-x-auto no-scrollbar md:flex-wrap mb-4 md:mb-6 px-1 h-auto py-1">
          <TabsTrigger className="text-xs md:text-sm py-1.5 px-2 md:px-3" value="notifications">
            <Bell className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
            <span className="whitespace-nowrap">Notifications</span>
          </TabsTrigger>
          <TabsTrigger className="text-xs md:text-sm py-1.5 px-2 md:px-3" value="appearance">
            <Moon className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
            <span className="whitespace-nowrap">Appearance</span>
          </TabsTrigger>
          <TabsTrigger className="text-xs md:text-sm py-1.5 px-2 md:px-3" value="whatsapp">
            <Smartphone className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
            <span className="whitespace-nowrap">WhatsApp</span>
          </TabsTrigger>
          <TabsTrigger className="text-xs md:text-sm py-1.5 px-2 md:px-3" value="backup">
            <Database className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
            <span className="whitespace-nowrap">Backup & Restore</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Notifications Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader className="py-3 px-4 md:py-4 md:px-6">
              <CardTitle className="text-sm md:text-base">Notification Preferences</CardTitle>
              <CardDescription className="text-xs md:text-sm">Configure how you want to be notified about reminders</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6 py-3 px-4 md:py-4 md:px-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="sound" className="text-xs md:text-sm">Notification Sound</Label>
                  <p className="text-[10px] md:text-xs text-muted-foreground">Play a sound when a reminder is due</p>
                </div>
                <Switch 
                  id="sound" 
                  checked={settings.notifications.sound}
                  onCheckedChange={(checked) => 
                    setSettings({
                      ...settings,
                      notifications: {
                        ...settings.notifications,
                        sound: checked
                      }
                    })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="browser" className="text-xs md:text-sm">Browser Notifications</Label>
                  <p className="text-[10px] md:text-xs text-muted-foreground">Show browser notifications for reminders</p>
                </div>
                <Switch 
                  id="browser" 
                  checked={settings.notifications.browser}
                  onCheckedChange={(checked) => 
                    setSettings({
                      ...settings,
                      notifications: {
                        ...settings.notifications,
                        browser: checked
                      }
                    })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="preview" className="text-xs md:text-sm">Message Previews</Label>
                  <p className="text-[10px] md:text-xs text-muted-foreground">Show message content in notifications</p>
                </div>
                <Switch 
                  id="preview" 
                  checked={settings.notifications.previewMessages}
                  onCheckedChange={(checked) => 
                    setSettings({
                      ...settings,
                      notifications: {
                        ...settings.notifications,
                        previewMessages: checked
                      }
                    })
                  }
                />
              </div>
              
              <div className="space-y-1 md:space-y-2">
                <Label htmlFor="lead-time" className="text-xs md:text-sm">Reminder Lead Time</Label>
                <p className="text-[10px] md:text-xs text-muted-foreground">How many minutes before a reminder is due to notify you</p>
                <Select
                  value={settings.notifications.reminderLeadTime.toString()}
                  onValueChange={(value) => 
                    setSettings({
                      ...settings,
                      notifications: {
                        ...settings.notifications,
                        reminderLeadTime: parseInt(value)
                      }
                    })
                  }
                >
                  <SelectTrigger id="lead-time" className="text-xs md:text-sm h-8 md:h-10">
                    <SelectValue placeholder="Select lead time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0" className="text-xs md:text-sm">Right on time</SelectItem>
                    <SelectItem value="1" className="text-xs md:text-sm">1 minute before</SelectItem>
                    <SelectItem value="5" className="text-xs md:text-sm">5 minutes before</SelectItem>
                    <SelectItem value="10" className="text-xs md:text-sm">10 minutes before</SelectItem>
                    <SelectItem value="15" className="text-xs md:text-sm">15 minutes before</SelectItem>
                    <SelectItem value="30" className="text-xs md:text-sm">30 minutes before</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Appearance Settings */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader className="py-3 px-4 md:py-4 md:px-6">
              <CardTitle className="text-sm md:text-base">Appearance</CardTitle>
              <CardDescription className="text-xs md:text-sm">Customize how the application looks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6 py-3 px-4 md:py-4 md:px-6">
              <div className="space-y-1 md:space-y-2">
                <Label htmlFor="theme" className="text-xs md:text-sm">Theme</Label>
                <Select
                  value={settings.appearance.theme}
                  onValueChange={(value: 'light' | 'dark' | 'system') => 
                    setSettings({
                      ...settings,
                      appearance: {
                        ...settings.appearance,
                        theme: value
                      }
                    })
                  }
                >
                  <SelectTrigger id="theme" className="text-xs md:text-sm h-8 md:h-10">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light" className="text-xs md:text-sm">
                      <div className="flex items-center">
                        <Sun className="mr-2 h-3 w-3 md:h-4 md:w-4" />
                        Light
                      </div>
                    </SelectItem>
                    <SelectItem value="dark" className="text-xs md:text-sm">
                      <div className="flex items-center">
                        <Moon className="mr-2 h-3 w-3 md:h-4 md:w-4" />
                        Dark
                      </div>
                    </SelectItem>
                    <SelectItem value="system" className="text-xs md:text-sm">
                      <div className="flex items-center">
                        <Globe className="mr-2 h-3 w-3 md:h-4 md:w-4" />
                        System
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1 md:space-y-2">
                <Label htmlFor="font-size" className="text-xs md:text-sm">Font Size</Label>
                <Select
                  value={settings.appearance.fontSize}
                  onValueChange={(value: 'small' | 'medium' | 'large') => 
                    setSettings({
                      ...settings,
                      appearance: {
                        ...settings.appearance,
                        fontSize: value
                      }
                    })
                  }
                >
                  <SelectTrigger id="font-size" className="text-xs md:text-sm h-8 md:h-10">
                    <SelectValue placeholder="Select font size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small" className="text-xs md:text-sm">Small</SelectItem>
                    <SelectItem value="medium" className="text-xs md:text-sm">Medium</SelectItem>
                    <SelectItem value="large" className="text-xs md:text-sm">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="compact" className="text-xs md:text-sm">Compact Mode</Label>
                  <p className="text-[10px] md:text-xs text-muted-foreground">Reduce spacing to fit more content on screen</p>
                </div>
                <Switch 
                  id="compact" 
                  checked={settings.appearance.compactMode}
                  onCheckedChange={(checked) => 
                    setSettings({
                      ...settings,
                      appearance: {
                        ...settings.appearance,
                        compactMode: checked
                      }
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* WhatsApp Settings */}
        <TabsContent value="whatsapp">
          <Card>
            <CardHeader className="py-3 px-4 md:py-4 md:px-6">
              <CardTitle className="text-sm md:text-base">WhatsApp Settings</CardTitle>
              <CardDescription className="text-xs md:text-sm">Configure how WhatsApp reminders work</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6 py-3 px-4 md:py-4 md:px-6">
              <div className="space-y-1 md:space-y-2">
                <Label htmlFor="country-code" className="text-xs md:text-sm">Default Country Code</Label>
                <Input
                  id="country-code"
                  className="text-xs md:text-sm h-8 md:h-10"
                  placeholder="e.g., 1 for US, 44 for UK"
                  value={settings.whatsapp.defaultCountryCode}
                  onChange={(e) => 
                    setSettings({
                      ...settings,
                      whatsapp: {
                        ...settings.whatsapp,
                        defaultCountryCode: e.target.value.replace(/\D/g, '')
                      }
                    })
                  }
                />
                <p className="text-[10px] md:text-xs text-muted-foreground">
                  The country code to prepend when no international code is provided
                </p>
              </div>
              
              <div className="space-y-1 md:space-y-2">
                <Label htmlFor="default-message" className="text-xs md:text-sm">Default Message Template</Label>
                <Textarea
                  id="default-message"
                  className="text-xs md:text-sm min-h-[80px] md:min-h-[100px]"
                  placeholder="Enter a default message to use when creating reminders"
                  value={settings.whatsapp.defaultMessage}
                  onChange={(e) => 
                    setSettings({
                      ...settings,
                      whatsapp: {
                        ...settings.whatsapp,
                        defaultMessage: e.target.value
                      }
                    })
                  }
                />
                <p className="text-[10px] md:text-xs text-muted-foreground">
                  This will be pre-filled when creating new reminders (can be overridden)
                </p>
              </div>
              
              <div className="space-y-1 md:space-y-2">
                <Label htmlFor="open-method" className="text-xs md:text-sm">Open Method</Label>
                <Select
                  value={settings.whatsapp.openMethod}
                  onValueChange={(value: 'app' | 'web') => 
                    setSettings({
                      ...settings,
                      whatsapp: {
                        ...settings.whatsapp,
                        openMethod: value
                      }
                    })
                  }
                >
                  <SelectTrigger id="open-method" className="text-xs md:text-sm h-8 md:h-10">
                    <SelectValue placeholder="Select how to open WhatsApp" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="app" className="text-xs md:text-sm">WhatsApp App (if installed)</SelectItem>
                    <SelectItem value="web" className="text-xs md:text-sm">WhatsApp Web</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-open" className="text-xs md:text-sm">Auto-open WhatsApp</Label>
                  <p className="text-[10px] md:text-xs text-muted-foreground">Automatically open WhatsApp when a reminder is due</p>
                </div>
                <Switch 
                  id="auto-open" 
                  checked={settings.whatsapp.autoOpen}
                  onCheckedChange={(checked) => 
                    setSettings({
                      ...settings,
                      whatsapp: {
                        ...settings.whatsapp,
                        autoOpen: checked
                      }
                    })
                  }
                />
              </div>
              
              <Separator className="my-3" />
              
              <h3 className="text-sm font-medium mb-2">Indian Phone Number Settings</h3>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-format-indian" className="text-xs md:text-sm">Auto-format Indian Numbers</Label>
                  <p className="text-[10px] md:text-xs text-muted-foreground">Automatically detect and format Indian phone numbers</p>
                </div>
                <Switch 
                  id="auto-format-indian" 
                  checked={settings.whatsapp.autoFormatIndian ?? true}
                  onCheckedChange={(checked) => 
                    setSettings({
                      ...settings,
                      whatsapp: {
                        ...settings.whatsapp,
                        autoFormatIndian: checked
                      }
                    })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="add-country-code" className="text-xs md:text-sm">Add Country Code (+91)</Label>
                  <p className="text-[10px] md:text-xs text-muted-foreground">Automatically add +91 to 10-digit Indian numbers</p>
                </div>
                <Switch 
                  id="add-country-code" 
                  checked={settings.whatsapp.addIndianCountryCode ?? true}
                  onCheckedChange={(checked) => 
                    setSettings({
                      ...settings,
                      whatsapp: {
                        ...settings.whatsapp,
                        addIndianCountryCode: checked
                      }
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Backup & Restore Tab */}
        <TabsContent value="backup">
          <BackupRestore />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsForm; 