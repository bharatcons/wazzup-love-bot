
import React from "react";
import { useReminders } from "@/contexts/ReminderContext";
import ReminderCard from "./ReminderCard";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import ReminderForm from "./ReminderForm";
import { PlusIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ReminderList: React.FC = () => {
  const { reminders } = useReminders();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  
  const activeReminders = reminders.filter(r => r.isActive);
  const inactiveReminders = reminders.filter(r => !r.isActive);
  
  // Filter reminders based on search query
  const filteredActive = activeReminders.filter(reminder =>
    reminder.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    reminder.phoneNumber.includes(searchQuery) ||
    reminder.message.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredInactive = inactiveReminders.filter(reminder =>
    reminder.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    reminder.phoneNumber.includes(searchQuery) ||
    reminder.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold">Your Reminders</h2>
        <div className="flex space-x-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Input
              placeholder="Search reminders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-8"
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-whatsapp hover:bg-whatsapp-dark whitespace-nowrap">
                <PlusIcon className="h-4 w-4 mr-2" />
                New Reminder
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <ReminderForm onClose={() => setIsDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {reminders.length === 0 ? (
        <div className="text-center py-12 bg-muted/50 rounded-lg">
          <h3 className="text-xl font-medium mb-2">No reminders yet</h3>
          <p className="text-muted-foreground mb-6">
            Create your first reminder to get started
          </p>
          <Button 
            className="bg-whatsapp hover:bg-whatsapp-dark" 
            onClick={() => setIsDialogOpen(true)}
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Reminder
          </Button>
        </div>
      ) : (
        <Tabs defaultValue="active">
          <TabsList className="mb-4">
            <TabsTrigger value="active">
              Active ({filteredActive.length})
            </TabsTrigger>
            <TabsTrigger value="inactive">
              Inactive ({filteredInactive.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="active">
            {filteredActive.length === 0 ? (
              <div className="text-center py-8 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground">
                  {searchQuery ? "No active reminders match your search" : "No active reminders"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredActive.map(reminder => (
                  <ReminderCard key={reminder.id} reminder={reminder} />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="inactive">
            {filteredInactive.length === 0 ? (
              <div className="text-center py-8 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground">
                  {searchQuery ? "No inactive reminders match your search" : "No inactive reminders"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredInactive.map(reminder => (
                  <ReminderCard key={reminder.id} reminder={reminder} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default ReminderList;
