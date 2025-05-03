import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Frequency, Reminder, WeekDay } from "@/types/reminder";
import { useReminders } from "@/contexts/ReminderContext";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, CheckIcon, MessageCircle, Phone, Clock } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";

interface ReminderFormProps {
  initialData?: Reminder;
  onClose?: () => void;
}

const ReminderForm: React.FC<ReminderFormProps> = ({ initialData, onClose }) => {
  const { addReminder, updateReminder } = useReminders();
  const isEditing = !!initialData;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [contactName, setContactName] = useState(initialData?.contactName || "");
  const [phoneNumber, setPhoneNumber] = useState(initialData?.phoneNumber || "");
  const [message, setMessage] = useState(initialData?.message || "");
  const [frequency, setFrequency] = useState<Frequency>(initialData?.frequency || "daily");
  const [hour, setHour] = useState(initialData?.time.hour ?? 12);
  const [minute, setMinute] = useState(initialData?.time.minute ?? 0);
  const [weekDays, setWeekDays] = useState<WeekDay[]>(initialData?.weekDays || ["mon", "tue", "wed", "thu", "fri"]);
  const [monthDay, setMonthDay] = useState<number>(initialData?.monthDay || 1);
  const [date, setDate] = useState<Date | undefined>(
    initialData?.date ? new Date(initialData.date) : undefined
  );
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleWeekDayToggle = (day: WeekDay) => {
    if (weekDays.includes(day)) {
      setWeekDays(weekDays.filter(d => d !== day));
    } else {
      setWeekDays([...weekDays, day]);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!contactName.trim()) {
      newErrors.contactName = "Contact name is required";
    }
    
    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
    } else if (!/^\+?[0-9\s\-()]+$/.test(phoneNumber)) {
      newErrors.phoneNumber = "Please enter a valid phone number";
    }
    
    if (!message.trim()) {
      newErrors.message = "Message is required";
    }
    
    if (frequency === "weekly" && weekDays.length === 0) {
      newErrors.weekDays = "Select at least one day";
    }
    
    if (frequency === "once" && !date) {
      newErrors.date = "Date is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const reminderData: Omit<Reminder, "id"> = {
        contactName,
        phoneNumber,
        message,
        time: { hour, minute },
        frequency,
        isActive: initialData?.isActive ?? true,
        lastTriggered: initialData?.lastTriggered,
      };
      
      // Add frequency-specific fields
      if (frequency === "weekly") {
        reminderData.weekDays = weekDays;
      } else if (frequency === "monthly") {
        reminderData.monthDay = monthDay;
      } else if (frequency === "once" && date) {
        reminderData.date = date.toISOString();
      }
      
      if (isEditing && initialData) {
        await updateReminder({ ...reminderData, id: initialData.id });
      } else {
        await addReminder(reminderData);
      }
      
      if (onClose) onClose();
    } catch (error) {
      console.error("Error submitting reminder:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateHourOptions = () => {
    const options = [];
    for (let i = 0; i < 24; i++) {
      const hour12 = i % 12 || 12;
      const period = i < 12 ? "AM" : "PM";
      options.push(
        <SelectItem key={i} value={i.toString()}>
          {hour12} {period}
        </SelectItem>
      );
    }
    return options;
  };

  const generateMinuteOptions = () => {
    const options = [];
    for (let i = 0; i < 60; i += 5) {
      options.push(
        <SelectItem key={i} value={i.toString()}>
          {i.toString().padStart(2, "0")}
        </SelectItem>
      );
    }
    return options;
  };

  const generateMonthDayOptions = () => {
    const options = [];
    for (let i = 1; i <= 31; i++) {
      options.push(
        <SelectItem key={i} value={i.toString()}>
          {i}
        </SelectItem>
      );
    }
    return options;
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Reminder" : "Create Reminder"}</CardTitle>
        <CardDescription>
          Schedule a WhatsApp reminder to send to your contacts
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contactName">Contact Name</Label>
            <div className="relative">
              <Input
                id="contactName"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Enter contact name"
                className={errors.contactName ? "border-destructive" : ""}
              />
            </div>
            {errors.contactName && (
              <p className="text-destructive text-sm">{errors.contactName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="phoneNumber"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter phone number"
                className={cn("pl-10", errors.phoneNumber ? "border-destructive" : "")}
              />
            </div>
            {errors.phoneNumber && (
              <p className="text-destructive text-sm">{errors.phoneNumber}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <div className="relative">
              <MessageCircle className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your message"
                className={cn("pl-10 min-h-[100px]", errors.message ? "border-destructive" : "")}
              />
            </div>
            {errors.message && (
              <p className="text-destructive text-sm">{errors.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">Time</Label>
            <div className="flex space-x-2 items-center">
              <div className="relative flex-1">
                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Select value={hour.toString()} onValueChange={(value) => setHour(parseInt(value))}>
                  <SelectTrigger className="pl-10">
                    <SelectValue placeholder="Hour" />
                  </SelectTrigger>
                  <SelectContent>{generateHourOptions()}</SelectContent>
                </Select>
              </div>
              <span>:</span>
              <div className="flex-1">
                <Select value={minute.toString()} onValueChange={(value) => setMinute(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Minute" />
                  </SelectTrigger>
                  <SelectContent>{generateMinuteOptions()}</SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label>Frequency</Label>
              <Tabs defaultValue={frequency} onValueChange={(value) => setFrequency(value as Frequency)} className="w-full mt-2">
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="daily">Daily</TabsTrigger>
                  <TabsTrigger value="weekly">Weekly</TabsTrigger>
                  <TabsTrigger value="monthly">Monthly</TabsTrigger>
                  <TabsTrigger value="once">Once</TabsTrigger>
                </TabsList>
                
                <TabsContent value="daily" className="pt-4">
                  <p className="text-sm text-muted-foreground">This reminder will trigger every day at the specified time.</p>
                </TabsContent>
                
                <TabsContent value="weekly" className="pt-4">
                  <div className="space-y-2">
                    <Label>Select Days</Label>
                    <div className="flex flex-wrap gap-2">
                      <Toggle 
                        pressed={weekDays.includes("mon")}
                        onPressedChange={() => handleWeekDayToggle("mon")}
                        className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                      >
                        Mon
                      </Toggle>
                      <Toggle 
                        pressed={weekDays.includes("tue")}
                        onPressedChange={() => handleWeekDayToggle("tue")}
                        className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                      >
                        Tue
                      </Toggle>
                      <Toggle 
                        pressed={weekDays.includes("wed")}
                        onPressedChange={() => handleWeekDayToggle("wed")}
                        className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                      >
                        Wed
                      </Toggle>
                      <Toggle 
                        pressed={weekDays.includes("thu")}
                        onPressedChange={() => handleWeekDayToggle("thu")}
                        className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                      >
                        Thu
                      </Toggle>
                      <Toggle 
                        pressed={weekDays.includes("fri")}
                        onPressedChange={() => handleWeekDayToggle("fri")}
                        className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                      >
                        Fri
                      </Toggle>
                      <Toggle 
                        pressed={weekDays.includes("sat")}
                        onPressedChange={() => handleWeekDayToggle("sat")}
                        className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                      >
                        Sat
                      </Toggle>
                      <Toggle 
                        pressed={weekDays.includes("sun")}
                        onPressedChange={() => handleWeekDayToggle("sun")}
                        className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                      >
                        Sun
                      </Toggle>
                    </div>
                    {errors.weekDays && (
                      <p className="text-destructive text-sm">{errors.weekDays}</p>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="monthly" className="pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="monthDay">Day of the month</Label>
                    <Select value={monthDay.toString()} onValueChange={(value) => setMonthDay(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select day" />
                      </SelectTrigger>
                      <SelectContent>{generateMonthDayOptions()}</SelectContent>
                    </Select>
                  </div>
                </TabsContent>
                
                <TabsContent value="once" className="pt-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full text-left justify-start",
                            !date && "text-muted-foreground",
                            errors.date && "border-destructive"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, "PPP") : "Select a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          initialFocus
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.date && (
                      <p className="text-destructive text-sm">{errors.date}</p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          {onClose && (
            <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
          )}
          <Button 
            type="submit" 
            className="bg-whatsapp hover:bg-whatsapp-dark" 
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : isEditing ? "Update Reminder" : "Create Reminder"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default ReminderForm;
