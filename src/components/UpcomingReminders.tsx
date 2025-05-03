
import React, { useState, useEffect } from "react";
import { useReminders } from "@/contexts/ReminderContext";
import { formatReminderTime, getNextOccurrence, getWhatsAppLink } from "@/utils/reminderUtils";
import { Reminder } from "@/types/reminder";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, MessageCircle, ExternalLink } from "lucide-react";

const UpcomingReminders: React.FC = () => {
  const { reminders } = useReminders();
  const [sortedReminders, setSortedReminders] = useState<Array<Reminder & { nextTime?: Date }>>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Update current time every minute
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Sort reminders by next occurrence
    const activeReminders = reminders
      .filter(r => r.isActive)
      .map(reminder => {
        const nextTime = getNextOccurrence(reminder);
        return { ...reminder, nextTime };
      })
      .filter((r): r is Reminder & { nextTime: Date } => !!r.nextTime)
      .sort((a, b) => a.nextTime.getTime() - b.nextTime.getTime());
      
    // Only show reminders in the next 24 hours
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    setSortedReminders(
      activeReminders.filter(r => r.nextTime && r.nextTime <= tomorrow).slice(0, 3)
    );
  }, [reminders, currentTime]);

  const getTimeRemaining = (date: Date) => {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.max(0, Math.floor(diffMs / 60000));
    
    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? 's' : ''}`;
    }
    
    const diffHours = Math.floor(diffMins / 60);
    const remainingMins = diffMins % 60;
    
    if (diffHours < 24) {
      return `${diffHours}h ${remainingMins}m`;
    }
    
    return "Soon";
  };

  if (sortedReminders.length === 0) {
    return null;
  }

  return (
    <Card className="mb-4 md:mb-8">
      <CardHeader className="pb-2 md:pb-3">
        <CardTitle className="text-sm md:text-md font-medium">Upcoming Reminders</CardTitle>
      </CardHeader>
      <CardContent className="p-2 md:p-4">
        <div className="space-y-2 md:space-y-3">
          {sortedReminders.map(reminder => (
            <div 
              key={reminder.id}
              className="flex justify-between items-center p-2 md:p-3 rounded-md bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex items-center space-x-2 md:space-x-3">
                <div className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-whatsapp-light/10 ${
                  reminder.nextTime && reminder.nextTime.getTime() - new Date().getTime() < 3600000 
                    ? 'animate-pulse-subtle'
                    : ''
                }`}>
                  <Clock className="h-4 w-4 md:h-5 md:w-5 text-whatsapp" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm md:text-base truncate">{reminder.contactName}</p>
                  <div className="flex items-center text-xs md:text-sm text-muted-foreground">
                    <MessageCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span className="truncate">{reminder.message.length > 20 
                      ? `${reminder.message.substring(0, 20)}...` 
                      : reminder.message}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                <div className="text-right mr-1 md:mr-2">
                  <p className="text-xs md:text-sm font-medium">{reminder.nextTime && formatReminderTime({
                    hour: reminder.nextTime.getHours(),
                    minute: reminder.nextTime.getMinutes()
                  })}</p>
                  <p className="text-xs text-whatsapp font-medium">
                    {reminder.nextTime && getTimeRemaining(reminder.nextTime)}
                  </p>
                </div>
                <Button 
                  size="sm" 
                  className="bg-whatsapp hover:bg-whatsapp-dark h-7 w-7 md:h-8 md:w-8 p-0"
                  onClick={() => {
                    const whatsappUrl = getWhatsAppLink(reminder.phoneNumber);
                    const encodedMessage = encodeURIComponent(reminder.message);
                    window.open(`${whatsappUrl}&text=${encodedMessage}`, '_blank');
                  }}
                >
                  <ExternalLink className="h-3 w-3 md:h-4 md:w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default UpcomingReminders;
