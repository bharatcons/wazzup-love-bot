import React, { useState, useMemo, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useReminders } from '@/contexts/ReminderContext';
import { Reminder } from '@/types/reminder';
import { getNextOccurrence, formatReminderTime, getFrequencyLabel } from '@/utils/reminderUtils';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay } from 'date-fns';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_MOBILE = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const CalendarView: React.FC = () => {
  const { reminders } = useReminders();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedReminders, setSelectedReminders] = useState<Reminder[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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

  // Get days in the current month
  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    return eachDayOfInterval({ start: monthStart, end: monthEnd });
  }, [currentMonth]);

  // Get reminders for the entire month
  const monthReminders = useMemo(() => {
    const result = new Map<string, Reminder[]>();
    
    // Initialize all days of the month with empty arrays
    days.forEach(day => {
      result.set(format(day, 'yyyy-MM-dd'), []);
    });
    
    // Only include active reminders
    const activeReminders = reminders.filter(r => r.isActive);
    
    // Check for each day of the month if there's a reminder
    days.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayReminders: Reminder[] = [];
      
      activeReminders.forEach(reminder => {
        // Get the next occurrence date for this reminder
        const nextOccurrence = getNextOccurrence(reminder);
        
        // If there's no next occurrence, skip this reminder
        if (!nextOccurrence) return;
        
        // If the reminder occurs on this day, add it to the day's reminders
        if (isSameDay(nextOccurrence, day)) {
          dayReminders.push(reminder);
        }
        
        // For recurring reminders, check additional occurrences within the month
        if (reminder.frequency !== 'once') {
          // Clone the reminder to modify the lastTriggered date
          const tempReminder = { ...reminder };
          // Set the lastTriggered date to the first occurrence to find subsequent ones
          if (nextOccurrence) {
            tempReminder.lastTriggered = nextOccurrence.toISOString();
            
            // Check for a second occurrence in the same month
            const secondOccurrence = getNextOccurrence(tempReminder);
            if (secondOccurrence && isSameDay(secondOccurrence, day)) {
              // Don't add the same reminder twice
              if (!dayReminders.includes(reminder)) {
                dayReminders.push(reminder);
              }
            }
          }
        }
      });
      
      if (dayReminders.length > 0) {
        result.set(dateStr, dayReminders);
      }
    });
    
    return result;
  }, [reminders, days]);

  // Calculate calendar grid, including padding days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const firstDayOfMonth = getDay(monthStart); // 0-6, Sunday-Saturday
    
    // Create an array for the entire grid
    const totalDaysInGrid = days.length + firstDayOfMonth;
    const gridDays: (Date | null)[] = Array(totalDaysInGrid).fill(null);
    
    // Fill in the actual days
    days.forEach((day, index) => {
      gridDays[index + firstDayOfMonth] = day;
    });
    
    return gridDays;
  }, [currentMonth, days]);

  const navigateMonth = (direction: 'next' | 'prev') => {
    setCurrentMonth(prev => direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1));
  };

  const handleDateClick = (date: Date | null) => {
    if (!date) return;
    
    const dateStr = format(date, 'yyyy-MM-dd');
    const remindersForDay = monthReminders.get(dateStr) || [];
    
    setSelectedDate(date);
    setSelectedReminders(remindersForDay);
    setIsDialogOpen(remindersForDay.length > 0);
  };

  const getRemindersCount = (date: Date | null): number => {
    if (!date) return 0;
    const dateStr = format(date, 'yyyy-MM-dd');
    return (monthReminders.get(dateStr) || []).length;
  };

  return (
    <div className="space-y-3 md:space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg md:text-2xl font-bold">Calendar View</h2>
        <div className="flex items-center space-x-1 md:space-x-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 md:h-9 md:w-9"
            onClick={() => navigateMonth('prev')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-sm md:text-lg font-semibold min-w-[110px] md:min-w-[140px] text-center">
            {format(currentMonth, isMobile ? 'MMM yyyy' : 'MMMM yyyy')}
          </h3>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 md:h-9 md:w-9"
            onClick={() => navigateMonth('next')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="py-2 px-3 md:py-4 md:px-6">
          <CardTitle className="flex justify-between items-center text-sm md:text-base">
            <span>Reminders Calendar</span>
            <CalendarIcon className="h-4 w-4 md:h-5 md:w-5" />
          </CardTitle>
        </CardHeader>
        <CardContent className="p-1 md:p-3 lg:p-6">
          {/* Calendar Header - Days of Week */}
          <div className="grid grid-cols-7 mb-1 md:mb-2">
            {(isMobile ? DAYS_MOBILE : DAYS).map(day => (
              <div 
                key={day} 
                className="text-center font-medium text-xs md:text-sm text-muted-foreground p-1 md:p-2"
              >
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-[2px] md:gap-1">
            {calendarDays.map((date, i) => {
              const remindersCount = getRemindersCount(date);
              
              return (
                <div
                  key={i}
                  className={`
                    min-h-[50px] md:min-h-[80px] p-1 md:p-2 border rounded-sm md:rounded-md text-xs md:text-sm
                    ${date ? 'cursor-pointer hover:bg-muted' : 'bg-muted/20 opacity-50'}
                    ${date && isSameDay(date, new Date()) ? 'border-primary' : 'border-border'}
                  `}
                  onClick={() => date && handleDateClick(date)}
                >
                  {date && (
                    <>
                      <div className="flex justify-between items-start">
                        <span className={`font-medium ${isSameDay(date, new Date()) ? 'text-primary' : ''}`}>
                          {format(date, 'd')}
                        </span>
                        {remindersCount > 0 && (
                          <Badge variant="secondary" className="text-[10px] md:text-xs px-1 md:px-1.5 py-0 md:py-0.5 h-4 md:h-5 min-w-[16px] md:min-w-[20px] text-center">
                            {remindersCount}
                          </Badge>
                        )}
                      </div>
                      
                      {remindersCount > 0 && !isMobile && (
                        <div className="mt-1 space-y-1">
                          {(monthReminders.get(format(date, 'yyyy-MM-dd')) || [])
                            .slice(0, 2) // Show max 2 reminders
                            .map((reminder, index) => (
                              <div 
                                key={`${reminder.id}-${index}`} 
                                className="text-[10px] md:text-xs truncate px-1 py-0.5 rounded bg-primary/10 text-primary-foreground"
                                title={`${reminder.contactName}: ${reminder.message}`}
                              >
                                {formatReminderTime(reminder.time)} - {reminder.contactName}
                              </div>
                            ))}
                          {remindersCount > 2 && (
                            <div className="text-[9px] md:text-xs text-muted-foreground text-center">
                              + {remindersCount - 2} more
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      {/* Reminders Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[350px] md:max-w-[450px] p-4 md:p-6">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">
              {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : 'Reminders'}
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[50vh] md:max-h-[60vh]">
            <div className="space-y-3 md:space-y-4 p-1">
              {selectedReminders.map(reminder => (
                <Card key={reminder.id}>
                  <CardContent className="p-3 md:p-4">
                    <div className="space-y-1 md:space-y-2">
                      <div className="flex justify-between">
                        <div className="font-medium text-sm md:text-base">{reminder.contactName}</div>
                        <Badge variant="outline" className="text-[10px] md:text-xs">
                          {formatReminderTime(reminder.time)}
                        </Badge>
                      </div>
                      
                      <p className="text-xs md:text-sm text-muted-foreground whitespace-pre-wrap">
                        {reminder.message.length > (isMobile ? 80 : 100)
                          ? `${reminder.message.substring(0, isMobile ? 80 : 100)}...`
                          : reminder.message}
                      </p>
                      
                      <div className="text-[10px] md:text-xs text-muted-foreground">
                        {getFrequencyLabel(reminder)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {selectedReminders.length === 0 && (
                <p className="text-center text-muted-foreground py-4 text-sm">
                  No reminders for this date
                </p>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CalendarView; 