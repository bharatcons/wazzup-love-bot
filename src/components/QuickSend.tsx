import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Contact } from '@/services/ContactService';
import { useContacts } from '@/contexts/ContactContext';
import { useTemplates } from '@/contexts/TemplateContext';
import { AlertCircle, MessageCircle, Phone, Send, Users, Sparkles, Smartphone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from "@/lib/utils";
import { isValidIndianNumber, formatIndianNumber, isLikelyIndianNumber, getIndianWhatsAppLink } from '@/utils/phoneUtils';
import { getWhatsAppLink } from '@/utils/reminderUtils';
import { useToast } from '@/components/ui/use-toast';
import { PhoneContactImporter, DeviceContact } from '@/components/PhoneContactImporter';

const QuickSend: React.FC = () => {
  const [contactName, setContactName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isIndianNumber, setIsIndianNumber] = useState<boolean>(false);
  const [phoneHintText, setPhoneHintText] = useState<string | null>(null);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isPhoneContactImportOpen, setIsPhoneContactImportOpen] = useState(false);
  
  const { toast } = useToast();
  const { contacts, markContactAsUsed, addContact, searchContacts } = useContacts();
  const { templates } = useTemplates();
  
  // Sort contacts by recently used
  const sortedContacts = [...contacts].sort((a, b) => {
    const dateA = a.lastUsed ? new Date(a.lastUsed).getTime() : 0;
    const dateB = b.lastUsed ? new Date(b.lastUsed).getTime() : 0;
    return dateB - dateA;
  });
  
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
  
  // Function to apply selected contact
  const applyContact = (contact: Contact) => {
    setContactName(contact.name);
    setPhoneNumber(contact.phoneNumber);
    setIsContactDialogOpen(false);
    
    // Mark the contact as recently used
    markContactAsUsed(contact.id);
  };
  
  // Function to apply selected template
  const applyTemplate = (templateContent: string) => {
    setMessage(templateContent);
    setIsTemplateDialogOpen(false);
  };
  
  const handlePhoneContactImport = async (deviceContact: DeviceContact) => {
    // Check if this contact already exists in the database
    const results = await searchContacts(deviceContact.phoneNumber);
    
    if (results.length > 0) {
      // If contact exists, use it
      applyContact(results[0]);
      toast({
        title: "Existing contact used",
        description: `${results[0].name} was found in your contacts and selected`
      });
    } else {
      // If contact doesn't exist, add it and then use it
      const newContact = await addContact({
        name: deviceContact.name,
        phoneNumber: deviceContact.phoneNumber,
        notes: "Imported from " + (deviceContact.source || "phone contacts"),
        tags: ["phone-import", deviceContact.source || "device"]
      });
      
      if (newContact) {
        applyContact(newContact);
        toast({
          title: "Contact imported and added",
          description: `${deviceContact.name} was imported and added to your contacts`
        });
      }
    }
    
    setIsPhoneContactImportOpen(false);
  };
  
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
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Generate WhatsApp link
      const whatsappUrl = isLikelyIndianNumber(phoneNumber)
        ? getIndianWhatsAppLink(phoneNumber, message)
        : `${getWhatsAppLink(phoneNumber)}&text=${encodeURIComponent(message)}`;
      
      // Open WhatsApp
      window.open(whatsappUrl, '_blank');
      
      // Show success toast
      toast({
        title: 'WhatsApp opened',
        description: `Ready to send message to ${contactName}`,
        duration: 3000,
      });
      
      // Record this as a recent contact if it's not already in contacts
      const existingContact = contacts.find(c => 
        c.phoneNumber.replace(/\D/g, '') === phoneNumber.replace(/\D/g, '')
      );
      
      if (existingContact) {
        markContactAsUsed(existingContact.id);
      }
      
      // Clear form except contact name to allow quick follow-up messages
      setMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: 'Error',
        description: 'Failed to open WhatsApp',
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const clearForm = () => {
    setContactName('');
    setPhoneNumber('');
    setMessage('');
    setErrors({});
  };
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Quick Send</h2>
      
      <Card>
        <CardHeader>
          <CardTitle>Send WhatsApp Message</CardTitle>
          <CardDescription>
            Send a message without creating a reminder
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSend}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="contactName">Contact</Label>
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
                          Select a contact to use for your message
                        </DialogDescription>
                      </DialogHeader>
                      
                      <ScrollArea className="max-h-[60vh]">
                        {sortedContacts.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {sortedContacts.map(contact => (
                              <Card 
                                key={contact.id} 
                                className="cursor-pointer hover:border-primary overflow-hidden"
                                onClick={() => applyContact(contact)}
                              >
                                <CardHeader className="p-3">
                                  <CardTitle className="text-sm truncate">{contact.name}</CardTitle>
                                  <CardDescription className="text-xs truncate">
                                    {contact.phoneNumber}
                                  </CardDescription>
                                </CardHeader>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center text-muted-foreground p-4">
                            No contacts found. Add some contacts first.
                          </p>
                        )}
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <Input
                id="contactName"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Enter contact name"
                className={errors.contactName ? "border-destructive" : ""}
              />
              {errors.contactName && (
                <p className="text-destructive text-sm flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errors.contactName}
                </p>
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
                    
                    <ScrollArea className="max-h-[60vh]">
                      {templates.length > 0 ? (
                        <div className="grid grid-cols-1 gap-2">
                          {templates.map(template => (
                            <Card 
                              key={template.id} 
                              className="cursor-pointer hover:border-primary overflow-hidden"
                              onClick={() => applyTemplate(template.content)}
                            >
                              <CardHeader className="p-3">
                                <CardTitle className="text-sm">{template.title}</CardTitle>
                              </CardHeader>
                              <CardContent className="p-3 pt-0">
                                <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-3">
                                  {template.content}
                                </p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground p-4">
                          No templates found. Add some templates first.
                        </p>
                      )}
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              </div>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here"
                className={errors.message ? "border-destructive" : ""}
                rows={4}
              />
              {errors.message && (
                <p className="text-destructive text-sm flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {errors.message}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              className="w-full sm:w-auto"
              onClick={clearForm}
            >
              Clear
            </Button>
            <Button 
              type="submit" 
              variant="default" 
              className="w-full sm:w-auto bg-whatsapp hover:bg-whatsapp-dark"
              onClick={handleSend}
              disabled={isSubmitting}
            >
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Opening WhatsApp...' : 'Send WhatsApp'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default QuickSend; 