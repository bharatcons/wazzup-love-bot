import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useReminders } from '@/contexts/ReminderContext';
import { useContacts } from '@/contexts/ContactContext';
import { Reminder } from '@/types/reminder';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { CalendarClock, MessageSquare, Users, Clock, CalendarDays } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A259FF'];

const AnalyticsDashboard: React.FC = () => {
  const { reminders } = useReminders();
  const { contacts } = useContacts();

  // Calculate active vs inactive reminders
  const activeReminders = reminders.filter(r => r.isActive);
  const inactiveReminders = reminders.filter(r => !r.isActive);
  
  // Calculate reminders by frequency type
  const remindersByFrequency = useMemo(() => {
    const frequencies: Record<string, number> = {
      'Daily': 0,
      'Weekly': 0,
      'Monthly': 0,
      'One-time': 0
    };
    
    reminders.forEach(reminder => {
      switch (reminder.frequency) {
        case 'daily':
          frequencies['Daily']++;
          break;
        case 'weekly':
          frequencies['Weekly']++;
          break;
        case 'monthly':
          frequencies['Monthly']++;
          break;
        case 'once':
          frequencies['One-time']++;
          break;
      }
    });
    
    return Object.entries(frequencies).map(([name, value]) => ({ name, value }));
  }, [reminders]);
  
  // Calculate reminders by time of day
  const remindersByTimeOfDay = useMemo(() => {
    const timeSlots: Record<string, number> = {
      'Morning (5-11)': 0,
      'Afternoon (12-16)': 0,
      'Evening (17-20)': 0,
      'Night (21-4)': 0
    };
    
    reminders.forEach(reminder => {
      const hour = reminder.time.hour;
      
      if (hour >= 5 && hour <= 11) {
        timeSlots['Morning (5-11)']++;
      } else if (hour >= 12 && hour <= 16) {
        timeSlots['Afternoon (12-16)']++;
      } else if (hour >= 17 && hour <= 20) {
        timeSlots['Evening (17-20)']++;
      } else {
        timeSlots['Night (21-4)']++;
      }
    });
    
    return Object.entries(timeSlots).map(([name, value]) => ({ name, value }));
  }, [reminders]);
  
  // Calculate most active days for weekly reminders
  const remindersByDay = useMemo(() => {
    const days: Record<string, number> = {
      'Mon': 0,
      'Tue': 0,
      'Wed': 0,
      'Thu': 0,
      'Fri': 0,
      'Sat': 0,
      'Sun': 0
    };
    
    const dayMap: Record<string, string> = {
      'mon': 'Mon',
      'tue': 'Tue',
      'wed': 'Wed',
      'thu': 'Thu',
      'fri': 'Fri',
      'sat': 'Sat',
      'sun': 'Sun'
    };
    
    reminders.forEach(reminder => {
      if (reminder.frequency === 'weekly' && reminder.weekDays) {
        reminder.weekDays.forEach(day => {
          days[dayMap[day]]++;
        });
      }
    });
    
    return Object.entries(days).map(([name, value]) => ({ name, value }));
  }, [reminders]);
  
  // Get the most recent reminders (triggered in the last 7 days)
  const recentlyTriggeredReminders = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    return reminders.filter(reminder => {
      if (!reminder.lastTriggered) return false;
      const lastTriggeredDate = new Date(reminder.lastTriggered);
      return lastTriggeredDate >= sevenDaysAgo;
    });
  }, [reminders]);
  
  // Calculate average message length
  const avgMessageLength = useMemo(() => {
    if (reminders.length === 0) return 0;
    const totalLength = reminders.reduce((sum, reminder) => sum + reminder.message.length, 0);
    return Math.round(totalLength / reminders.length);
  }, [reminders]);
  
  // Format numbers with commas
  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Mobile-optimized pie chart label formatting
  const renderPieLabel = ({ name, percent }: { name: string; percent: number }) => {
    // On small screens only show percentages, on larger screens show name and percentage 
    return window.innerWidth < 768 
      ? `${(percent * 100).toFixed(0)}%`
      : `${name}: ${(percent * 100).toFixed(0)}%`;
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <h2 className="text-xl md:text-2xl font-bold">Analytics Dashboard</h2>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2 px-3 md:pb-2 md:px-6">
            <CardTitle className="text-xs md:text-sm font-medium">Reminders</CardTitle>
            <CalendarClock className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="py-2 px-3 md:px-6">
            <div className="text-lg md:text-2xl font-bold">{formatNumber(reminders.length)}</div>
            <p className="text-[10px] md:text-xs text-muted-foreground">
              {formatNumber(activeReminders.length)} active
            </p>
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2 px-3 md:pb-2 md:px-6">
            <CardTitle className="text-xs md:text-sm font-medium">Contacts</CardTitle>
            <Users className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="py-2 px-3 md:px-6">
            <div className="text-lg md:text-2xl font-bold">{formatNumber(contacts.length)}</div>
            <p className="text-[10px] md:text-xs text-muted-foreground">
              Total contacts
            </p>
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2 px-3 md:pb-2 md:px-6">
            <CardTitle className="text-xs md:text-sm font-medium">Recent</CardTitle>
            <Clock className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="py-2 px-3 md:px-6">
            <div className="text-lg md:text-2xl font-bold">{formatNumber(recentlyTriggeredReminders.length)}</div>
            <p className="text-[10px] md:text-xs text-muted-foreground">
              Last 7 days
            </p>
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2 px-3 md:pb-2 md:px-6">
            <CardTitle className="text-xs md:text-sm font-medium">Avg Msg</CardTitle>
            <MessageSquare className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="py-2 px-3 md:px-6">
            <div className="text-lg md:text-2xl font-bold">{formatNumber(avgMessageLength)}</div>
            <p className="text-[10px] md:text-xs text-muted-foreground">
              Characters
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Frequency Distribution */}
        <Card className="col-span-1">
          <CardHeader className="py-3 px-4 md:px-6">
            <CardTitle className="text-sm md:text-base">Reminder Types</CardTitle>
            <CardDescription className="text-xs">Distribution by frequency</CardDescription>
          </CardHeader>
          <CardContent className="h-60 md:h-80 p-0 md:p-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <Pie
                  data={remindersByFrequency}
                  cx="50%"
                  cy="50%"
                  innerRadius={window.innerWidth < 768 ? 40 : 60}
                  outerRadius={window.innerWidth < 768 ? 60 : 80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={renderPieLabel}
                  labelLine={window.innerWidth >= 768}
                >
                  {remindersByFrequency.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend 
                  layout={window.innerWidth < 768 ? "horizontal" : "vertical"}
                  verticalAlign={window.innerWidth < 768 ? "bottom" : "middle"} 
                  align={window.innerWidth < 768 ? "center" : "right"}
                  wrapperStyle={window.innerWidth < 768 ? { fontSize: '10px' } : { fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Time of Day Distribution */}
        <Card className="col-span-1">
          <CardHeader className="py-3 px-4 md:px-6">
            <CardTitle className="text-sm md:text-base">Time of Day</CardTitle>
            <CardDescription className="text-xs">When reminders are scheduled</CardDescription>
          </CardHeader>
          <CardContent className="h-60 md:h-80 p-0 md:p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={remindersByTimeOfDay}
                layout="vertical"
                margin={{ top: 5, right: 10, left: window.innerWidth < 768 ? 60 : 80, bottom: 5 }}
              >
                <XAxis 
                  type="number" 
                  tick={{ fontSize: window.innerWidth < 768 ? 10 : 12 }}
                />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  tick={{ fontSize: window.innerWidth < 768 ? 10 : 12 }}
                  width={window.innerWidth < 768 ? 80 : 100}
                />
                <Tooltip 
                  contentStyle={window.innerWidth < 768 ? { fontSize: '10px' } : undefined} 
                />
                <Bar dataKey="value" fill="#8884d8">
                  {remindersByTimeOfDay.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      {/* Weekly Distribution */}
      <Card>
        <CardHeader className="py-3 px-4 md:px-6">
          <CardTitle className="text-sm md:text-base">Weekly Distribution</CardTitle>
          <CardDescription className="text-xs">Most popular days for reminders</CardDescription>
        </CardHeader>
        <CardContent className="h-60 md:h-80 p-0 md:p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={remindersByDay}
              margin={{ 
                top: 10, 
                right: 10, 
                left: 0, 
                bottom: window.innerWidth < 768 ? 0 : 5 
              }}
            >
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: window.innerWidth < 768 ? 10 : 12 }}
              />
              <YAxis 
                tick={{ fontSize: window.innerWidth < 768 ? 10 : 12 }}
              />
              <Tooltip 
                contentStyle={window.innerWidth < 768 ? { fontSize: '10px' } : undefined}
              />
              <Bar dataKey="value" fill="#8884d8">
                {remindersByDay.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard; 