import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Search } from "lucide-react";
import { useDebounce } from '@/hooks/useDebounce';
import { formatPhoneNumber } from '@/utils/reminderUtils';

// Interface for the device contact
export interface DeviceContact {
  name: string;
  phoneNumber: string;
}

// Component for importing phone contacts
export const PhoneContactImporter: React.FC<{
  onContactSelected: (contact: DeviceContact) => void;
  onClose: () => void;
}> = ({ onContactSelected, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deviceContacts, setDeviceContacts] = useState<DeviceContact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Filter contacts based on search query
  const filteredDeviceContacts = deviceContacts.filter(contact => 
    contact.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) || 
    contact.phoneNumber.includes(debouncedSearchQuery)
  );

  // Attempt to load device contacts when component mounts
  useEffect(() => {
    const loadDeviceContacts = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Check if Contacts API is available
        if ('contacts' in navigator && 'ContactsManager' in window) {
          const props = ['name', 'tel'];
          const opts = { multiple: true };
          
          // @ts-ignore - ContactsManager API is not in TypeScript defs yet
          const contacts = await navigator.contacts.select(props, opts);
          
          // Format the contacts into our DeviceContact format
          const formattedContacts = contacts.map((contact: any) => ({
            name: contact.name[0] || 'Unknown Contact',
            phoneNumber: contact.tel[0] || ''
          }));
          
          setDeviceContacts(formattedContacts);
        } else {
          setError('Your browser does not support accessing phone contacts. Try using Chrome on Android or Safari on iOS.');
        }
      } catch (err) {
        console.error('Error accessing device contacts:', err);
        setError('Failed to access phone contacts. Make sure you\'ve granted permission to access contacts.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDeviceContacts();
  }, []);

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search phone contacts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>
      
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <ScrollArea className="h-[60vh] pr-4">
          {filteredDeviceContacts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {deviceContacts.length === 0 
                  ? 'No phone contacts found or access was denied' 
                  : 'No contacts match your search'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDeviceContacts.map((contact, index) => (
                <div 
                  key={index} 
                  className="border rounded-md p-3 hover:bg-muted cursor-pointer transition-colors"
                  onClick={() => onContactSelected(contact)}
                >
                  <div className="font-medium">{contact.name}</div>
                  <div className="text-sm text-muted-foreground">{formatPhoneNumber(contact.phoneNumber)}</div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      )}
      
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </DialogFooter>
    </div>
  );
}; 