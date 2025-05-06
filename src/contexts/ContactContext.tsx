import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import contactService, { Contact } from '@/services/ContactService';
import { useToast } from '@/components/ui/use-toast';

interface ContactContextType {
  contacts: Contact[];
  recentContacts: Contact[];
  isLoading: boolean;
  fetchContacts: () => Promise<void>;
  searchContacts: (query: string) => Promise<Contact[]>;
  addContact: (contact: Omit<Contact, 'id' | 'createdAt'>) => Promise<Contact | null>;
  updateContact: (contact: Contact) => Promise<Contact | null>;
  deleteContact: (id: string) => Promise<boolean>;
  markContactAsUsed: (id: string) => Promise<void>;
  getContactById: (id: string) => Contact | undefined;
}

const ContactContext = createContext<ContactContextType | undefined>(undefined);

export const useContacts = (): ContactContextType => {
  const context = useContext(ContactContext);
  if (!context) {
    throw new Error('useContacts must be used within a ContactProvider');
  }
  return context;
};

interface ContactProviderProps {
  children: ReactNode;
}

export const ContactProvider: React.FC<ContactProviderProps> = ({ children }) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();

  const fetchContacts = async () => {
    setIsLoading(true);
    try {
      const fetchedContacts = await contactService.getContacts();
      setContacts(fetchedContacts);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast({
        title: "Failed to load contacts",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const searchContacts = async (query: string): Promise<Contact[]> => {
    if (!query.trim()) return [];
    try {
      return await contactService.searchContacts(query);
    } catch (error) {
      console.error('Error searching contacts:', error);
      return [];
    }
  };

  const addContact = async (contact: Omit<Contact, 'id' | 'createdAt'>) => {
    try {
      const newContact = await contactService.createContact(contact);
      if (newContact) {
        setContacts(prev => [...prev, newContact].sort((a, b) => a.name.localeCompare(b.name)));
        toast({
          title: "Contact created",
          description: `${contact.name} has been added to your contacts`,
        });
        return newContact;
      }
      return null;
    } catch (error) {
      console.error('Error adding contact:', error);
      toast({
        title: "Failed to create contact",
        description: "Please try again",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateContact = async (contact: Contact) => {
    try {
      const updatedContact = await contactService.updateContact(contact);
      if (updatedContact) {
        setContacts(prev => {
          const newContacts = prev.map(c => c.id === contact.id ? updatedContact : c);
          return newContacts.sort((a, b) => a.name.localeCompare(b.name));
        });
        toast({
          title: "Contact updated",
          description: `${contact.name} has been updated`,
        });
        return updatedContact;
      }
      return null;
    } catch (error) {
      console.error('Error updating contact:', error);
      toast({
        title: "Failed to update contact",
        description: "Please try again",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteContact = async (id: string) => {
    try {
      const success = await contactService.deleteContact(id);
      if (success) {
        const contactToDelete = contacts.find(c => c.id === id);
        setContacts(prev => prev.filter(c => c.id !== id));
        toast({
          title: "Contact deleted",
          description: contactToDelete ? `${contactToDelete.name} has been removed` : "Contact has been removed",
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast({
        title: "Failed to delete contact",
        description: "Please try again",
        variant: "destructive",
      });
      return false;
    }
  };

  const markContactAsUsed = async (id: string) => {
    try {
      await contactService.updateLastUsed(id);
      // We don't need to refetch the whole list, just update the lastUsed timestamp locally
      setContacts(prev => prev.map(c => 
        c.id === id ? { ...c, lastUsed: new Date().toISOString() } : c
      ));
    } catch (error) {
      console.error('Error marking contact as used:', error);
    }
  };

  const getContactById = (id: string) => {
    return contacts.find(c => c.id === id);
  };

  // Compute recent contacts - those used in the last 7 days
  const recentContacts = contacts
    .filter(contact => {
      if (!contact.lastUsed) return false;
      const lastUsedDate = new Date(contact.lastUsed);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return lastUsedDate >= sevenDaysAgo;
    })
    .sort((a, b) => {
      // Sort by lastUsed, most recent first
      const dateA = a.lastUsed ? new Date(a.lastUsed).getTime() : 0;
      const dateB = b.lastUsed ? new Date(b.lastUsed).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 5); // Limit to 5 recent contacts

  useEffect(() => {
    fetchContacts();
  }, []);

  const value = {
    contacts,
    recentContacts,
    isLoading,
    fetchContacts,
    searchContacts,
    addContact,
    updateContact,
    deleteContact,
    markContactAsUsed,
    getContactById,
  };

  return (
    <ContactContext.Provider value={value}>
      {children}
    </ContactContext.Provider>
  );
};

export default ContactProvider; 