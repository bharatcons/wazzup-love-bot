
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

interface ReminderCardProps {
  reminder: Reminder;
}

const ReminderCard: React.FC<ReminderCardProps> = ({ reminder }) => {
  const { toggleReminderActive, deleteReminder } = useReminders();
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  
  const handleOpenWhatsApp = () => {
    window.open(getWhatsAppLink(reminder.phoneNumber), '_blank');
  };

  return (
    <>
      <Card className={`w-full transition-opacity duration-200 ${!reminder.isActive ? 'opacity-70' : ''}`}>
        <CardHeader className="pb-2">
          <div className="flex justify-between">
            <div>
              <CardTitle className="text-lg">{reminder.contactName}</CardTitle>
              <CardDescription className="flex items-center mt-1">
                <Phone className="h-3 w-3 mr-1" />
                {formatPhoneNumber(reminder.phoneNumber)}
              </CardDescription>
            </div>
            <Switch 
              checked={reminder.isActive}
              onCheckedChange={() => toggleReminderActive(reminder.id)}
              aria-label="Toggle reminder"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pb-2">
          <div className="flex items-start space-x-2">
            <MessageCircle className="h-4 w-4 mt-1 text-muted-foreground" />
            <p className="text-sm flex-1">{truncateMessage(reminder.message, 100)}</p>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mr-1.5" />
              <span>{formatReminderTime(reminder.time)}</span>
            </div>
            
            <Badge variant="outline" className="flex items-center">
              <CalendarClock className="h-3 w-3 mr-1" />
              <span className="text-xs">{getFrequencyLabel(reminder)}</span>
            </Badge>
          </div>
        </CardContent>
        
        <Separator />
        
        <CardFooter className="pt-3 flex justify-between">
          <div>
            <p className="text-xs text-muted-foreground">
              <span className={reminder.isActive ? "font-medium text-whatsapp" : ""}>
                {reminder.isActive ? 
                  getTimeUntilNextOccurrence(reminder) : 
                  "Reminder inactive"}
              </span>
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-destructive hover:text-destructive hover:bg-destructive/10" 
              onClick={() => deleteReminder(reminder.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(true)}>
              <PencilIcon className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              className="bg-whatsapp hover:bg-whatsapp-dark" 
              onClick={handleOpenWhatsApp}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Open
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
