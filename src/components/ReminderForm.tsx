import React, { useState, useEffect } from "react";
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
import { CalendarIcon, CheckIcon, MessageCircle, Phone, Clock, AlertCircle, Smartphone, User } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { useTemplates } from '@/contexts/TemplateContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ChevronDown, ListFilter, Sparkles } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useContacts } from '@/contexts/ContactContext';
import { Contact } from '@/services/ContactService';
import { Users, Search } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { formatPhoneNumber } from '@/utils/reminderUtils';
import { isValidIndianNumber, formatIndianNumber, isLikelyIndianNumber } from '@/utils/phoneUtils';
import { toast } from '@/components/ui/use-toast';
import { PhoneContactImporter, DeviceContact } from '@/components/PhoneContactImporter';

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

  const { templates } = useTemplates();
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [templateFilterTag, setTemplateFilterTag] = useState<string | null>(null);
  
  const { contacts, recentContacts, searchContacts, markContactAsUsed, addContact } = useContacts();
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [contactSearchQuery, setContactSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const debouncedContactSearchQuery = useDebounce(contactSearchQuery, 300);
  const [isPhoneContactImportOpen, setIsPhoneContactImportOpen] = useState(false);
  
  // Get all unique tags from templates
  const allTemplateTags = Array.from(new Set(
    templates.flatMap(template => template.tags || [])
  )).sort();
  
  // Filter templates by selected tag
  const filteredTemplates = templateFilterTag
    ? templates.filter(t => t.tags?.includes(templateFilterTag))
    : templates;
  
  // Effect to handle contact search
  useEffect(() => {
    const fetchSearchResults = async () => {
      if (debouncedContactSearchQuery.trim()) {
        const results = await searchContacts(debouncedContactSearchQuery);
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    };
    
    fetchSearchResults();
  }, [debouncedContactSearchQuery, searchContacts]);
  
  // Function to apply selected template
  const applyTemplate = (templateContent: string) => {
    setMessage(templateContent);
    setIsTemplateDialogOpen(false);
  };

  const handleWeekDayToggle = (day: WeekDay) => {
    if (weekDays.includes(day)) {
      setWeekDays(weekDays.filter(d => d !== day));
    } else {
      setWeekDays([...weekDays, day]);
    }
  };

  // Function to apply selected contact
  const applyContact = (contact: Contact) => {
    setContactName(contact.name);
    setPhoneNumber(contact.phoneNumber);
    setIsContactDialogOpen(false);
    
    // Mark the contact as recently used
    markContactAsUsed(contact.id);
  };

  // New function to handle phone contact import
  const handlePhoneContactImport = async (deviceContact: { name: string; phoneNumber: string }) => {
    // First check if this contact already exists in our database
    const results = await searchContacts(deviceContact.phoneNumber);
    
    if (results.length > 0) {
      // If the contact exists, use it
      applyContact(results[0]);
      toast({
        title: "Existing contact used",
        description: `${results[0].name} was found in your contacts and selected`
      });
    } else {
      // If the contact doesn't exist, add it and then use it
      const newContact = await addContact({
        name: deviceContact.name,
        phoneNumber: deviceContact.phoneNumber,
        notes: "Imported from phone contacts",
        tags: ["phone-import"]
      });
      
      if (newContact) {
        applyContact(newContact);
        toast({
          title: "Contact imported and added",
          description: `${deviceContact.name} was imported from your phone and added to your contacts`
        });
      }
    }
    
    setIsPhoneContactImportOpen(false);
  };

  // Add state for phone number validation
  const [phoneHintText, setPhoneHintText] = useState<string | null>(null);
  const [isIndianNumber, setIsIndianNumber] = useState<boolean>(
    initialData ? isLikelyIndianNumber(initialData.phoneNumber) : false
  );

  // Add effect to detect and format Indian phone numbers
  useEffect(() => {
    if (phoneNumber) {
      const isIndian = isLikelyIndianNumber(phoneNumber);
      setIsIndianNumber(isIndian);
      
      // Only show hints if the number is partially entered (at least 4 digits)
      const cleaned = phoneNumber.replace(/\D/g, '');
      if (cleaned.length >= 4 && isIndian) {
        // Check if the number is valid or partially valid
        if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) {
          setPhoneHintText("Valid Indian mobile number");
        } else if (cleaned.length < 10 && /^[6-9]/.test(cleaned)) {
          setPhoneHintText("Continue entering Indian mobile number");
        } else if (cleaned.startsWith('91') && cleaned.length < 12) {
          setPhoneHintText("Continue entering Indian mobile number with country code");
        } else if (cleaned.startsWith('91') && cleaned.length === 12) {
          setPhoneHintText("Valid Indian mobile number with country code");
        } else {
          setPhoneHintText(null);
        }
      } else {
        setPhoneHintText(null);
      }
    } else {
      setPhoneHintText(null);
      setIsIndianNumber(false);
    }
  }, [phoneNumber]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!contactName.trim()) {
      newErrors.contactName = "Contact name is required";
    }
    
    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
    } else if (isIndianNumber && !isValidIndianNumber(phoneNumber)) {
      newErrors.phoneNumber = "Please enter a valid Indian mobile number (10 digits starting with 6-9)";
    } else if (!isIndianNumber && !/^\+?[0-9\s\-()]+$/.test(phoneNumber)) {
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
            <div className="flex justify-between items-center">
              <Label htmlFor="contactName">Contact Name</Label>
              <div className="flex gap-2">
                <Dialog open={isPhoneContactImportOpen} onOpenChange={setIsPhoneContactImportOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="h-8 gap-1 text-xs"
                      type="button"
                    >
                      <Smartphone className="h-3 w-3" />
                      <span className="hidden sm:inline">Phone</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[650px] max-h-[80vh]">
                    <DialogHeader>
                      <DialogTitle>Import from Phone Contacts</DialogTitle>
                      <DialogDescription>
                        Select a contact directly from your phone
                      </DialogDescription>
                    </DialogHeader>
                    <PhoneContactImporter 
                      onContactSelected={handlePhoneContactImport}
                      onClose={() => setIsPhoneContactImportOpen(false)}
                    />
                  </DialogContent>
                </Dialog>
                
                <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="h-8 gap-1 text-xs"
                      type="button"
                    >
                      <Users className="h-3 w-3" />
                      <span className="hidden sm:inline">Contacts</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[650px] max-h-[80vh]">
                    <DialogHeader>
                      <DialogTitle>Choose a Contact</DialogTitle>
                      <DialogDescription>
                        Select a contact for your reminder
                      </DialogDescription>
                    </DialogHeader>
                    
                    {contacts.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No contacts found. Create contacts in the Contacts tab.</p>
                      </div>
                    ) : (
                      <>
                        {/* Search input */}
                        <div className="relative mb-4">
                          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search contacts..."
                            value={contactSearchQuery}
                            onChange={(e) => setContactSearchQuery(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        
                        {/* Recent contacts section if there are any */}
                        {recentContacts.length > 0 && !contactSearchQuery && (
                          <div className="mb-4">
                            <h3 className="text-sm font-medium mb-2">Recent Contacts</h3>
                            <div className="grid gap-2">
                              {recentContacts.map(contact => (
                                <div 
                                  key={contact.id}
                                  className="border rounded-md p-3 hover:bg-muted cursor-pointer transition-colors"
                                  onClick={() => applyContact(contact)}
                                >
                                  <div className="font-medium">{contact.name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {formatPhoneNumber(contact.phoneNumber)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <ScrollArea className="h-[50vh] pr-4">
                          <div className="grid gap-2">
                            {(contactSearchQuery ? searchResults : contacts).map(contact => (
                              <div 
                                key={contact.id}
                                className="border rounded-md p-3 hover:bg-muted cursor-pointer transition-colors"
                                onClick={() => applyContact(contact)}
                              >
                                <div className="font-medium">{contact.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {formatPhoneNumber(contact.phoneNumber)}
                                </div>
                                {contact.tags && contact.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {contact.tags.map(tag => (
                                      <Badge key={tag} variant="outline" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                            
                            {contactSearchQuery && searchResults.length === 0 && (
                              <div className="text-center py-4">
                                <p className="text-muted-foreground">No contacts match your search.</p>
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                      </>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="contactName"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Enter name"
                className={cn("pl-10", errors.contactName ? "border-destructive" : "")}
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
                placeholder="Enter phone number (e.g. 9198765xxxx)"
                className={cn(
                  "pl-10", 
                  errors.phoneNumber ? "border-destructive" : "",
                  isIndianNumber ? "border-whatsapp" : ""
                )}
              />
              {isIndianNumber && !errors.phoneNumber && (
                <div className="absolute right-3 top-2.5">
                  <Badge variant="outline" className="bg-whatsapp/10 text-xs">
                    IN
                  </Badge>
                </div>
              )}
            </div>
            {errors.phoneNumber ? (
              <p className="text-destructive text-sm flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                {errors.phoneNumber}
              </p>
            ) : phoneHintText ? (
              <p className="text-muted-foreground text-xs">{phoneHintText}</p>
            ) : null}
            {isIndianNumber && !errors.phoneNumber && (
              <p className="text-xs text-muted-foreground mt-1">
                Format: {formatIndianNumber(phoneNumber)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="message">Message</Label>
              <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 gap-1 text-xs"
                    type="button"
                  >
                    <Sparkles className="h-3 w-3" />
                    Templates
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[650px] max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle>Choose a Template</DialogTitle>
                    <DialogDescription>
                      Select a template to use for your message
                    </DialogDescription>
                  </DialogHeader>
                  
                  {templates.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No templates found. Create templates in the Templates tab.</p>
                    </div>
                  ) : (
                    <>
                      {/* Filter by tag */}
                      {allTemplateTags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          <Badge 
                            variant={templateFilterTag === null ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => setTemplateFilterTag(null)}
                          >
                            All
                          </Badge>
                          {allTemplateTags.map(tag => (
                            <Badge 
                              key={tag}
                              variant={templateFilterTag === tag ? "default" : "outline"}
                              className="cursor-pointer"
                              onClick={() => setTemplateFilterTag(tag)}
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      <ScrollArea className="h-[50vh] pr-4">
                        <div className="grid gap-3">
                          {filteredTemplates.map(template => (
                            <div 
                              key={template.id}
                              className="border rounded-md p-3 hover:bg-muted cursor-pointer transition-colors"
                              onClick={() => applyTemplate(template.content)}
                            >
                              <div className="font-medium mb-1">{template.title}</div>
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {template.content.length > 120
                                  ? `${template.content.substring(0, 120)}...`
                                  : template.content}
                              </p>
                              
                              {template.tags && template.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {template.tags.map(tag => (
                                    <Badge key={tag} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </>
                  )}
                </DialogContent>
              </Dialog>
            </div>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message"
              className={cn("min-h-[120px]", errors.message ? "border-destructive" : "")}
            />
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
