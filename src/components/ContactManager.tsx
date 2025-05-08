import React, { useState, useEffect } from 'react';
import { useContacts } from '@/contexts/ContactContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Pencil, Trash2, Copy, X, Save, Tag, Search, Phone, User, Smartphone, RefreshCw, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Contact } from '@/services/ContactService';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPhoneNumber } from '@/utils/reminderUtils';
import { useDebounce } from '@/hooks/useDebounce';
import { toast } from '@/components/ui/use-toast';
import { PhoneContactImporter, DeviceContact } from '@/components/PhoneContactImporter';

interface ContactFormProps {
  contact?: Contact;
  onSubmit: (contact: Pick<Contact, 'name' | 'phoneNumber' | 'notes' | 'tags'>) => void;
  onCancel: () => void;
}

const ContactForm: React.FC<ContactFormProps> = ({ contact, onSubmit, onCancel }) => {
  const [name, setName] = useState(contact?.name || '');
  const [phoneNumber, setPhoneNumber] = useState(contact?.phoneNumber || '');
  const [notes, setNotes] = useState(contact?.notes || '');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(contact?.tags || []);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && phoneNumber.trim()) {
      onSubmit({ 
        name, 
        phoneNumber: phoneNumber.replace(/\D/g, ''), // Strip non-numeric characters
        notes,
        tags 
      });
    }
  };

  const handleImportContact = (deviceContact: DeviceContact) => {
    setName(deviceContact.name);
    setPhoneNumber(deviceContact.phoneNumber);
    setIsImportOpen(false);
    toast({
      title: "Contact imported",
      description: `${deviceContact.name} was imported from your phone contacts`,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="name">Contact Name</Label>
          <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline"
                size="sm"
                type="button"
                className="h-8 gap-1 text-xs"
              >
                <Smartphone className="h-3 w-3" />
                Import From Phone
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Import Phone Contact</DialogTitle>
                <DialogDescription>
                  Select a contact from your phone's address book
                </DialogDescription>
              </DialogHeader>
              <PhoneContactImporter 
                onContactSelected={handleImportContact}
                onClose={() => setIsImportOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
        <div className="relative">
          <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter contact name"
            className="pl-10"
            required
          />
        </div>
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
            className="pl-10"
            required
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes about this contact..."
          className="min-h-[100px]"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="tags">Tags (optional)</Label>
        <div className="flex gap-2">
          <Input
            id="tags"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="Add tags..."
          />
          <Button type="button" variant="outline" onClick={handleAddTag}>
            <Tag className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>
        
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map(tag => (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                {tag}
                <X
                  className="h-3 w-3 cursor-pointer text-muted-foreground hover:text-foreground"
                  onClick={() => handleRemoveTag(tag)}
                />
              </Badge>
            ))}
          </div>
        )}
      </div>
      
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          <Save className="h-4 w-4 mr-2" />
          {contact ? 'Update Contact' : 'Save Contact'}
        </Button>
      </DialogFooter>
    </form>
  );
};

const ContactCard: React.FC<{
  contact: Contact;
  onEdit: () => void;
  onDelete: () => void;
  onSelect: () => void;
  onOpenPhoneContacts: () => void;
}> = ({ contact, onEdit, onDelete, onSelect, onOpenPhoneContacts }) => {
  // Function to open the default phone app with the contact's number
  const openInPhoneApp = (event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent the card's click handler
    window.open(`tel:${contact.phoneNumber}`, '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-start">
          <span className="mr-2">{contact.name}</span>
          <div className="flex space-x-1">
            <Button variant="ghost" size="icon" onClick={openInPhoneApp} title="Call contact">
              <Phone className="h-4 w-4" />
              <span className="sr-only">Call</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          {formatPhoneNumber(contact.phoneNumber)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {contact.notes && (
          <p className="text-sm text-muted-foreground mb-2">
            {contact.notes.length > 120
              ? `${contact.notes.substring(0, 120)}...`
              : contact.notes}
          </p>
        )}
        
        {contact.tags && contact.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {contact.tags.map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <div className="w-full flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={onOpenPhoneContacts}>
            <Smartphone className="h-4 w-4 mr-2" />
            Match
          </Button>
          <Button variant="secondary" size="sm" className="flex-1" onClick={onSelect}>
            <Copy className="h-4 w-4 mr-2" />
            Use
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

const ContactManager: React.FC = () => {
  const { contacts, isLoading, addContact, updateContact, deleteContact, markContactAsUsed } = useContacts();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [isPhoneContactsOpen, setIsPhoneContactsOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  // Get all unique tags
  const allTags = Array.from(new Set(
    contacts.flatMap(contact => contact.tags || [])
  )).sort();

  // Filter contacts by selected tag and search query
  const filteredContacts = contacts.filter(contact => {
    // Filter by tag if one is selected
    const matchesTag = selectedTag ? contact.tags?.includes(selectedTag) : true;
    
    // Filter by search query if one is provided
    const matchesSearch = debouncedSearchQuery
      ? contact.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        contact.phoneNumber.includes(debouncedSearchQuery)
      : true;
    
    return matchesTag && matchesSearch;
  });

  const handleAddContact = async (contact: Pick<Contact, 'name' | 'phoneNumber' | 'notes' | 'tags'>) => {
    await addContact(contact);
    setIsAddOpen(false);
  };

  const handleUpdateContact = async (contact: Pick<Contact, 'name' | 'phoneNumber' | 'notes' | 'tags'>) => {
    if (editingContact) {
      await updateContact({
        ...editingContact,
        ...contact
      });
      setEditingContact(null);
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (confirm('Are you sure you want to delete this contact?')) {
      await deleteContact(id);
    }
  };

  const handleSelectContact = async (contact: Contact) => {
    // Mark contact as recently used
    await markContactAsUsed(contact.id);
    
    // Let the user know the contact was selected
    toast({
      title: "Contact selected",
      description: `${contact.name} selected for use in a reminder`,
    });
  };

  const handleOpenPhoneContacts = (contact: Contact) => {
    setSelectedContact(contact);
    setIsPhoneContactsOpen(true);
  };

  const handlePhoneContactMatch = async (deviceContact: DeviceContact) => {
    if (selectedContact) {
      try {
        const updatedContact = await updateContact({
          ...selectedContact,
          name: deviceContact.name,
          phoneNumber: deviceContact.phoneNumber
        });
        
        if (updatedContact) {
          toast({
            title: "Contact updated",
            description: `${selectedContact.name} was updated with information from ${deviceContact.name}`,
          });
        } else {
          toast({
            title: "Update failed",
            description: "Could not update the contact. Please try again.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Error updating contact:", error);
        toast({
          title: "Update error",
          description: "An error occurred while updating the contact",
          variant: "destructive"
        });
      }
      
      setIsPhoneContactsOpen(false);
      setSelectedContact(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Contacts</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Contacts</h2>
        <div className="flex gap-2">
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                New Contact
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Add New Contact</DialogTitle>
                <DialogDescription>
                  Add a new contact to your WhatsApp contacts.
                </DialogDescription>
              </DialogHeader>
              <ContactForm
                onSubmit={handleAddContact}
                onCancel={() => setIsAddOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Badge 
              variant={selectedTag === null ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedTag(null)}
            >
              All
            </Badge>
            {allTags.map(tag => (
              <Badge 
                key={tag}
                variant={selectedTag === tag ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedTag(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {contacts.length === 0 ? (
        <Card className="text-center p-6">
          <CardContent className="pt-6">
            <p className="text-muted-foreground mb-4">You don't have any saved contacts yet.</p>
            <Button onClick={() => setIsAddOpen(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Your First Contact
            </Button>
          </CardContent>
        </Card>
      ) : filteredContacts.length === 0 ? (
        <Card className="text-center p-6">
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No contacts match your search criteria.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContacts.map(contact => (
            <ContactCard
              key={contact.id}
              contact={contact}
              onEdit={() => setEditingContact(contact)}
              onDelete={() => handleDeleteContact(contact.id)}
              onSelect={() => handleSelectContact(contact)}
              onOpenPhoneContacts={() => handleOpenPhoneContacts(contact)}
            />
          ))}
        </div>
      )}

      {/* Edit Contact Dialog */}
      <Dialog open={editingContact !== null} onOpenChange={(open) => !open && setEditingContact(null)}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
            <DialogDescription>
              Update contact information.
            </DialogDescription>
          </DialogHeader>
          {editingContact && (
            <ContactForm
              contact={editingContact}
              onSubmit={handleUpdateContact}
              onCancel={() => setEditingContact(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Phone Contacts Dialog */}
      <Dialog open={isPhoneContactsOpen} onOpenChange={setIsPhoneContactsOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Match With Phone Contact</DialogTitle>
            <DialogDescription>
              {selectedContact ? `Update ${selectedContact.name} with information from your phone contacts` : 'Select a contact from your phone'}
            </DialogDescription>
          </DialogHeader>
          <PhoneContactImporter 
            onContactSelected={handlePhoneContactMatch}
            onClose={() => setIsPhoneContactsOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContactManager; 