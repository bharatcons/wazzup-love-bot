import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import ReminderList from '@/components/ReminderList';
import { ReminderProvider, useReminders } from '@/contexts/ReminderContext';
import notificationService from '@/services/NotificationService';
import { useToast } from '@/components/ui/use-toast';
import UpcomingReminders from '@/components/UpcomingReminders';
import { getWhatsAppLink } from '@/utils/reminderUtils';
import { isLikelyIndianNumber, getIndianWhatsAppLink } from '@/utils/phoneUtils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TemplateManager from '@/components/TemplateManager';
import { TemplateProvider } from '@/contexts/TemplateContext';
import ContactManager from '@/components/ContactManager';
import { ContactProvider } from '@/contexts/ContactContext';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import SettingsForm from '@/components/SettingsForm';
import CalendarView from '@/components/CalendarView';
import QuickSend from '@/components/QuickSend';
import StatusManager from '@/components/StatusManager';
import StickerCreator from '@/components/StickerCreator';
import { StatusProvider } from '@/contexts/StatusContext';
import { StickerProvider } from '@/contexts/StickerContext';
import { CalendarClock, Users, BookText, BarChart3, Settings, List, CalendarDays, Menu, Send, MessageSquare, Image, Bell, Volume, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useRouter } from 'next/router';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import ReminderStats from '@/components/ReminderStats';
import NotificationSettings from '@/components/NotificationSettings';
import { FilterControls } from '@/components/FilterControls';

const ReminderNotifications: React.FC = () => {
  const { activeReminders } = useReminders();
  const { toast } = useToast();
  const [soundPlaying, setSoundPlaying] = useState(false);

  useEffect(() => {
    // Initialize notification service
    notificationService.initialize((reminder) => {
      // This callback will be called when a reminder is due
      const phoneNumber = reminder.phoneNumber;
      
      let whatsappLink;
      if (isLikelyIndianNumber(phoneNumber)) {
        whatsappLink = getIndianWhatsAppLink(phoneNumber, reminder.message);
      } else {
        const baseUrl = `https://wa.me/${phoneNumber.replace(/\D/g, '')}`;
        whatsappLink = `${baseUrl}?text=${encodeURIComponent(reminder.message)}`;
      }
      
      // Show toast notification with action
      toast({
        title: `Reminder for ${reminder.contactName}`,
        description: reminder.message,
        action: (
          <Button variant="outline" size="sm" onClick={() => window.open(whatsappLink, "_blank")}>
            Open WhatsApp
          </Button>
        ),
        duration: 60000, // 60 seconds
      });
    });
    
    // Check for playing sound every second
    const soundCheckInterval = setInterval(() => {
      setSoundPlaying(notificationService.isSoundActive());
    }, 1000);
    
    // Clean up
    return () => {
      notificationService.cleanup();
      clearInterval(soundCheckInterval);
    };
  }, [toast]);
  
  // Update the active reminders in the notification service whenever they change
  useEffect(() => {
    notificationService.setReminders(activeReminders);
  }, [activeReminders]);
  
  // Stop Sound button
  const handleStopSound = () => {
    notificationService.silenceReminder();
    setSoundPlaying(false);
    toast({
      title: "Sound stopped",
      description: "Reminder sound has been silenced"
    });
  };
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      {soundPlaying && (
        <Button 
          onClick={handleStopSound}
          variant="destructive"
          className="rounded-full p-3 shadow-lg animate-pulse flex items-center space-x-2"
        >
          <VolumeX className="h-5 w-5" />
          <span>Stop Sound</span>
        </Button>
      )}
    </div>
  );
};

// Helper component for responsive tablist design
const ResponsiveTabsList: React.FC<{
  activeTab: string;
  setActiveTab: (tab: string) => void;
}> = ({ activeTab, setActiveTab }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // List of all main tabs with their icons
  const tabs = [
    { id: 'reminders', label: 'Reminders', icon: <CalendarClock className="h-4 w-4 mr-2" /> },
    { id: 'quicksend', label: 'Quick Send', icon: <Send className="h-4 w-4 mr-2" /> },
    { id: 'statuses', label: 'Statuses', icon: <MessageSquare className="h-4 w-4 mr-2" /> },
    { id: 'stickers', label: 'Stickers', icon: <Image className="h-4 w-4 mr-2" /> },
    { id: 'contacts', label: 'Contacts', icon: <Users className="h-4 w-4 mr-2" /> },
    { id: 'templates', label: 'Templates', icon: <BookText className="h-4 w-4 mr-2" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="h-4 w-4 mr-2" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4 mr-2" /> }
  ];
  
  return (
    <>
      {/* Desktop TabsList */}
      <TabsList className="mb-6 hidden md:flex">
        {tabs.map(tab => (
          <TabsTrigger key={tab.id} value={tab.id}>
            {tab.icon}
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      
      {/* Mobile TabsList (Shows active tab + menu) */}
      <div className="flex items-center justify-between mb-4 md:hidden">
        <h2 className="text-lg font-semibold flex items-center">
          {tabs.find(tab => tab.id === activeTab)?.icon}
          {tabs.find(tab => tab.id === activeTab)?.label}
        </h2>
        
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[80%] sm:w-[300px]">
            <nav className="grid gap-2 mt-6">
              {tabs.map(tab => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "default" : "ghost"}
                  className="justify-start"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsOpen(false);
                  }}
                >
                  {tab.icon}
                  {tab.label}
                </Button>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};

// Helper component for the reminders tabs (list/calendar)
const RemindersTabs: React.FC = () => {
  const [viewType, setViewType] = useState("list");
  
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium md:hidden">View Type</h3>
        <div className="flex border rounded-md overflow-hidden">
          <Button 
            variant={viewType === "list" ? "default" : "ghost"}
            size="sm"
            className="rounded-none px-3 h-9"
            onClick={() => setViewType("list")}
          >
            <List className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">List</span>
          </Button>
          <Button 
            variant={viewType === "calendar" ? "default" : "ghost"}
            size="sm"
            className="rounded-none px-3 h-9"
            onClick={() => setViewType("calendar")}
          >
            <CalendarDays className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Calendar</span>
          </Button>
        </div>
      </div>
      
      {viewType === "list" ? (
        <div className="space-y-6">
          <UpcomingReminders />
          <ReminderList />
        </div>
      ) : (
        <CalendarView />
      )}
    </>
  );
};

const Index: React.FC = () => {
  const { setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("reminders");
  const [search, setSearch] = useState("");
  const { reminders, loading } = useReminders();
  const router = useRouter();
  
  // Set dark mode initially
  useEffect(() => {
    setTheme('dark');
  }, [setTheme]);
  
  // Navigate to the reminder form
  const goToReminderForm = () => {
    router.push('/reminder');
  };
  
  return (
    <ContactProvider>
      <TemplateProvider>
        <ReminderProvider>
          <StatusProvider>
            <StickerProvider>
              <div className="min-h-screen bg-background flex flex-col">
                <Header />
                <main className="container py-4 md:py-8 px-3 md:px-6 flex-grow">
                  <ReminderNotifications />
                  
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <ResponsiveTabsList activeTab={activeTab} setActiveTab={setActiveTab} />
                    
                    <TabsContent value="reminders" className="space-y-4">
                      <RemindersTabs />
                    </TabsContent>
                    
                    <TabsContent value="quicksend">
                      <QuickSend />
                    </TabsContent>
                    
                    <TabsContent value="statuses">
                      <StatusManager />
                    </TabsContent>
                    
                    <TabsContent value="stickers">
                      <StickerCreator />
                    </TabsContent>
                    
                    <TabsContent value="contacts">
                      <ContactManager />
                    </TabsContent>
                    
                    <TabsContent value="templates">
                      <TemplateManager />
                    </TabsContent>
                    
                    <TabsContent value="analytics">
                      <AnalyticsDashboard />
                    </TabsContent>
                    
                    <TabsContent value="settings">
                      <SettingsForm />
                    </TabsContent>
                  </Tabs>
                </main>
                <footer className="py-3 md:py-6 border-t text-center text-xs md:text-sm text-muted-foreground">
                  <p>WhatsApp Reminder Manager &copy; {new Date().getFullYear()}</p>
                </footer>
              </div>
            </StickerProvider>
          </StatusProvider>
        </ReminderProvider>
      </TemplateProvider>
    </ContactProvider>
  );
};

export default Index;
