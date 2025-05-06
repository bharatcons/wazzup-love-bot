import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
  formatReminderTime, 
  formatPhoneNumber, 
  getWhatsAppLink,
  truncateMessage,
  getTimeUntilNextOccurrence,
  getFrequencyLabel
} from "@/utils/reminderUtils";
import { Reminder } from "@/types/reminder";
import { 
  Clock, 
  MessageCircle, 
  Phone, 
  Trash2, 
  CalendarClock,
  ExternalLink,
  PencilIcon
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useReminders } from "@/contexts/ReminderContext";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import ReminderForm from "./ReminderForm";
import { useIsMobile } from "@/hooks/use-mobile";
import { getIndianWhatsAppLink, isLikelyIndianNumber, formatIndianNumber } from "@/utils/phoneUtils";

interface ReminderCardProps {
  reminder: Reminder;
}

const ReminderCard: React.FC<ReminderCardProps> = ({ reminder }) => {
  const { toggleReminderActive, deleteReminder } = useReminders();
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const isMobile = useIsMobile();
  
  const handleOpenWhatsApp = () => {
    // Check if it's an Indian number
    if (isLikelyIndianNumber(reminder.phoneNumber)) {
      // Use our specialized Indian number WhatsApp link generator
      const whatsappUrl = getIndianWhatsAppLink(reminder.phoneNumber, reminder.message);
      
      if (isMobile) {
        // On mobile, try to open the WhatsApp app directly
        window.location.href = whatsappUrl;
      } else {
        // On desktop, open in a new tab
        window.open(whatsappUrl, '_blank')?.focus();
      }
    } else {
      // Use the standard WhatsApp link for other numbers
      const whatsappUrl = getWhatsAppLink(reminder.phoneNumber);
      const encodedMessage = encodeURIComponent(reminder.message);
      
      if (isMobile) {
        window.location.href = `${whatsappUrl}&text=${encodedMessage}`;
      } else {
        window.open(`${whatsappUrl}&text=${encodedMessage}`, '_blank')?.focus();
      }
    }
  };

  // Format phone number with special handling for Indian numbers
  const formattedPhoneNumber = isLikelyIndianNumber(reminder.phoneNumber)
    ? formatIndianNumber(reminder.phoneNumber)
    : formatPhoneNumber(reminder.phoneNumber);

  return (
    <>
      <Card className={`w-full transition-opacity duration-200 ${!reminder.isActive ? 'opacity-70' : ''}`}>
        <CardHeader className="pb-1 md:pb-2 px-3 md:px-6 pt-3 md:pt-4">
          <div className="flex justify-between">
            <div className="min-w-0 flex-1 mr-2">
              <CardTitle className="text-base md:text-lg truncate">{reminder.contactName}</CardTitle>
              <CardDescription className="flex items-center mt-0.5 md:mt-1 text-xs md:text-sm">
                <Phone className="h-3 w-3 mr-1 flex-shrink-0" />
                <span className="truncate">{formattedPhoneNumber}</span>
                {isLikelyIndianNumber(reminder.phoneNumber) && (
                  <Badge variant="outline" className="ml-1 bg-whatsapp/10 text-xs">IN</Badge>
                )}
              </CardDescription>
            </div>
            <Switch 
              checked={reminder.isActive}
              onCheckedChange={() => toggleReminderActive(reminder.id)}
              aria-label="Toggle reminder"
              className="data-[state=checked]:bg-whatsapp"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-2 md:space-y-3 pb-1 md:pb-2 px-3 md:px-6">
          <div className="flex items-start space-x-2">
            <MessageCircle className="h-3.5 w-3.5 md:h-4 md:w-4 mt-0.5 md:mt-1 text-muted-foreground flex-shrink-0" />
            <p className="text-xs md:text-sm flex-1">{truncateMessage(reminder.message, isMobile ? 60 : 100)}</p>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center text-xs md:text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 flex-shrink-0" />
              <span>{formatReminderTime(reminder.time)}</span>
            </div>
            
            <Badge variant="outline" className="flex items-center text-[10px] md:text-xs h-5 md:h-6">
              <CalendarClock className="h-2.5 w-2.5 md:h-3 md:w-3 mr-0.5 md:mr-1" />
              <span className="truncate">{getFrequencyLabel(reminder)}</span>
            </Badge>
          </div>
        </CardContent>
        
        <Separator />
        
        <CardFooter className="pt-1.5 md:pt-3 pb-2 md:pb-3 px-3 md:px-6 flex justify-between">
          <div>
            <p className="text-[10px] md:text-xs text-muted-foreground">
              <span className={reminder.isActive ? "font-medium text-whatsapp" : ""}>
                {reminder.isActive ? 
                  getTimeUntilNextOccurrence(reminder) : 
                  "Reminder inactive"}
              </span>
            </p>
          </div>
          <div className="flex gap-1.5 md:gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 md:h-8 px-1.5 md:px-3" 
              onClick={() => deleteReminder(reminder.id)}
            >
              <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 md:h-8 px-1.5 md:px-3"
              onClick={() => setIsEditDialogOpen(true)}
            >
              <PencilIcon className="h-3.5 w-3.5 md:h-4 md:w-4" />
            </Button>
            <Button 
              size="sm" 
              className="bg-whatsapp hover:bg-whatsapp-dark h-7 md:h-8 px-2 md:px-3"
              onClick={handleOpenWhatsApp}
            >
              <ExternalLink className="h-3.5 w-3.5 md:h-4 md:w-4 mr-0 md:mr-1" />
              <span className="hidden md:inline">Open</span>
            </Button>
          </div>
        </CardFooter>
      </Card>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <ReminderForm 
            initialData={reminder} 
            onClose={() => setIsEditDialogOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReminderCard;
