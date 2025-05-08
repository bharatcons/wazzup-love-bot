// Add these type declarations at the top of the file
// Type definitions for Google People API
declare global {
  interface Window {
    gapi: {
      load: (
        libraries: string,
        callback: () => void
      ) => void;
      client: {
        init: (config: {
          apiKey: string;
          clientId: string;
          discoveryDocs: string[];
          scope: string;
        }) => Promise<void>;
        people: {
          people: {
            connections: {
              list: (params: {
                resourceName: string;
                personFields: string;
                pageSize: number;
              }) => Promise<{
                result: {
                  connections: Array<{
                    names?: Array<{
                      displayName?: string;
                    }>;
                    phoneNumbers?: Array<{
                      value?: string;
                    }>;
                  }>;
                };
              }>;
            };
          };
        };
      };
      auth2: {
        getAuthInstance: () => {
          isSignedIn: {
            get: () => boolean;
          };
          signIn: () => Promise<void>;
        };
      };
    };
  }
}

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  AlertCircle, 
  Search, 
  Smartphone, 
  RefreshCw, 
  FileText, 
  Info, 
  ChevronDown, 
  Download, 
  Check, 
  Globe
} from "lucide-react";
import { useDebounce } from '@/hooks/useDebounce';
import { formatPhoneNumber } from '@/utils/reminderUtils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { isLikelyIndianNumber, formatIndianNumber } from '@/utils/phoneUtils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

// Interface for the device contact
export interface DeviceContact {
  name: string;
  phoneNumber: string;
  source?: string; // Added source field to track where the contact came from
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
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [contactSource, setContactSource] = useState<'device' | 'google' | 'manual' | 'paste'>('device');
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [isIndianNumber, setIsIndianNumber] = useState(false);
  const [pasteContent, setPasteContent] = useState('');
  const [parsedContacts, setParsedContacts] = useState<DeviceContact[]>([]);

  // Filter contacts based on search query
  const filteredDeviceContacts = deviceContacts.filter(contact => 
    contact.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) || 
    contact.phoneNumber.includes(debouncedSearchQuery)
  );

  // Check if phone number is an Indian number
  useEffect(() => {
    if (manualPhone) {
      setIsIndianNumber(isLikelyIndianNumber(manualPhone));
    } else {
      setIsIndianNumber(false);
    }
  }, [manualPhone]);

  // Handle manual contact add
  const handleAddManualContact = () => {
    if (manualName.trim() && manualPhone.trim()) {
      const newContact: DeviceContact = {
        name: manualName.trim(),
        phoneNumber: manualPhone.trim(),
        source: 'manual'
      };
      onContactSelected(newContact);
    }
  };

  // Google sign-in and contacts API implementation
  const handleGoogleContacts = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Check if Google People API script is loaded
      if (!window.gapi) {
        // Load Google API script
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = () => initGoogleApi();
        document.body.appendChild(script);
      } else {
        initGoogleApi();
      }
    } catch (err) {
      console.error('Error setting up Google contacts:', err);
      setError('Failed to access Google contacts. Please try device contacts instead.');
      setIsLoading(false);
    }
  };

  const initGoogleApi = () => {
    window.gapi.load('client:auth2', async () => {
      try {
        await window.gapi.client.init({
          apiKey: 'YOUR_API_KEY', // Replace with your Google API key
          clientId: 'YOUR_CLIENT_ID', // Replace with your Google Client ID
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/people/v1/rest'],
          scope: 'https://www.googleapis.com/auth/contacts.readonly'
        });

        // Sign in the user
        if (!window.gapi.auth2.getAuthInstance().isSignedIn.get()) {
          await window.gapi.auth2.getAuthInstance().signIn();
        }
        
        // Fetch contacts
        fetchGoogleContacts();
      } catch (err) {
        console.error('Error initializing Google API:', err);
        setError('Failed to initialize Google Contacts API. Please try device contacts instead.');
        setIsLoading(false);
      }
    });
  };

  const fetchGoogleContacts = async () => {
    try {
      const response = await window.gapi.client.people.people.connections.list({
        resourceName: 'people/me',
        personFields: 'names,phoneNumbers',
        pageSize: 100
      });
      
      const connections = response.result.connections || [];
      const formattedContacts: DeviceContact[] = connections
        .filter(person => person.phoneNumbers && person.phoneNumbers.length > 0)
        .map(person => ({
          name: person.names && person.names.length > 0 
            ? person.names[0].displayName || 'Unknown' 
            : 'Unknown',
          phoneNumber: person.phoneNumbers[0].value || '',
          source: 'google'
        }));
      
      setDeviceContacts(formattedContacts);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching Google contacts:', err);
      setError('Failed to fetch Google contacts. Please try again or use device contacts.');
      setIsLoading(false);
    }
  };

  // Parse contacts from pasted text
  const handlePasteAnalysis = () => {
    if (!pasteContent.trim()) return;
    
    // Reset previous parsed contacts
    setParsedContacts([]);
    
    // Simple pattern to extract name and phone number
    // Looking for patterns like "Name: John Doe, Phone: 1234567890" or variations
    
    // Split by lines first
    const lines = pasteContent.split('\n');
    const extractedContacts: DeviceContact[] = [];
    
    lines.forEach(line => {
      // Try to extract phone numbers - looking for sequences of digits
      const phoneMatches = line.match(/(\+?[\d\s\-()]{7,})/g);
      
      if (phoneMatches && phoneMatches.length > 0) {
        // If we found a phone number, try to extract a name
        // We'll consider text before the phone number as the potential name
        const phoneIndex = line.indexOf(phoneMatches[0]);
        let name = line.substring(0, phoneIndex).trim();
        
        // Clean up the name - remove common prefixes, punctuation
        name = name.replace(/^name[:\s]*/i, '')
                  .replace(/^contact[:\s]*/i, '')
                  .replace(/[,.:;]$/, '')
                  .trim();
        
        // If we couldn't extract a sensible name, use "Unknown"
        if (!name || name.length < 2) {
          name = "Unknown Contact";
        }
        
        extractedContacts.push({
          name,
          phoneNumber: phoneMatches[0].replace(/\s/g, ''),
          source: 'paste'
        });
      }
    });
    
    if (extractedContacts.length > 0) {
      setParsedContacts(extractedContacts);
    }
  };

  // Attempt to load device contacts using the Contacts API
  const loadDeviceContacts = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Check if Contacts API is available
      if ('contacts' in navigator && 'ContactsManager' in window) {
        // Request permission first
        try {
          const props = ['name', 'tel'];
          const opts = { multiple: true };
          
          // Use the Contacts API with proper typing
          const contacts = await navigator.contacts!.select(props, opts);
          setHasPermission(true);
          
          // Format the contacts into our DeviceContact format
          const formattedContacts = contacts.map((contact) => ({
            name: contact.name?.[0] || 'Unknown Contact',
            phoneNumber: contact.tel?.[0] || '',
            source: 'device'
          }));
          
          setDeviceContacts(formattedContacts);
        } catch (permissionErr) {
          console.error('Permission denied or error:', permissionErr);
          setHasPermission(false);
          setError('Permission to access contacts was denied. You can try again or add contacts manually.');
        }
      } else {
        // Fallback for browsers that don't support the Contacts API
        setError('Your browser does not support accessing phone contacts. Try using Chrome on Android or Safari on iOS, or add contacts manually.');
      }
    } catch (err) {
      console.error('Error accessing device contacts:', err);
      setError('Failed to access phone contacts. Make sure you\'ve granted permission to access contacts, or try adding manually.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load contacts when the component mounts
  useEffect(() => {
    if (contactSource === 'device') {
      loadDeviceContacts();
    }
  }, [contactSource]);

  return (
    <div className="space-y-4">
      <Tabs defaultValue="device" onValueChange={(value) => setContactSource(value as any)}>
        <TabsList className="grid grid-cols-4 mb-2">
          <TabsTrigger value="device">
            <Smartphone className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Device</span>
          </TabsTrigger>
          <TabsTrigger value="google">
            <Globe className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Google</span>
          </TabsTrigger>
          <TabsTrigger value="manual">
            <FileText className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Manual</span>
          </TabsTrigger>
          <TabsTrigger value="paste">
            <Download className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Paste</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Device Contacts Tab */}
        <TabsContent value="device" className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {hasPermission === false && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Permission Required</AlertTitle>
              <AlertDescription>
                <p>Please grant permission to access your contacts.</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={loadDeviceContacts}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Try Again
                </Button>
              </AlertDescription>
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
            <ScrollArea className="h-[40vh] pr-4">
              {filteredDeviceContacts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    {deviceContacts.length === 0 
                      ? 'No phone contacts found or access was denied' 
                      : 'No contacts match your search'}
                  </p>
                  {deviceContacts.length === 0 && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-4"
                      onClick={loadDeviceContacts}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Refresh Contacts
                    </Button>
                  )}
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
        </TabsContent>
        
        {/* Google Contacts Tab */}
        <TabsContent value="google" className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Google Contacts</AlertTitle>
            <AlertDescription>
              Import contacts directly from your Google account. You'll need to authorize access.
            </AlertDescription>
          </Alert>
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {!isLoading && deviceContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Button onClick={handleGoogleContacts} className="mb-3">
                <Globe className="h-4 w-4 mr-2" />
                Connect to Google Contacts
              </Button>
              <p className="text-sm text-muted-foreground text-center max-w-xs">
                Connect to your Google account to import contacts from Google Contacts
              </p>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search Google contacts..."
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
                <ScrollArea className="h-[40vh] pr-4">
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
                </ScrollArea>
              )}
            </>
          )}
        </TabsContent>
        
        {/* Manual Entry Tab */}
        <TabsContent value="manual" className="space-y-4">
          <div className="space-y-3">
            <div className="space-y-1">
              <label htmlFor="manual-name" className="text-sm font-medium">
                Contact Name
              </label>
              <Input 
                id="manual-name"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                placeholder="Enter contact name"
              />
            </div>
            
            <div className="space-y-1">
              <label htmlFor="manual-phone" className="text-sm font-medium">
                Phone Number
              </label>
              <Input 
                id="manual-phone"
                value={manualPhone}
                onChange={(e) => setManualPhone(e.target.value)}
                placeholder="Enter phone number"
                className={isIndianNumber ? "border-whatsapp" : ""}
              />
              {isIndianNumber && (
                <div className="flex items-center mt-1">
                  <Badge variant="outline" className="bg-whatsapp/10 text-xs mr-2">IN</Badge>
                  <span className="text-xs text-muted-foreground">
                    Format: {formatIndianNumber(manualPhone)}
                  </span>
                </div>
              )}
            </div>
            
            <Button 
              onClick={handleAddManualContact}
              disabled={!manualName.trim() || !manualPhone.trim()}
              className="w-full"
            >
              <Check className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          </div>
        </TabsContent>
        
        {/* Paste Tab for bulk import */}
        <TabsContent value="paste" className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Paste Contacts</AlertTitle>
            <AlertDescription>
              Paste contact information from any source. The system will try to detect names and phone numbers.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-3">
            <Textarea
              placeholder="Paste contacts here... 
Example formats:
John Doe: +1 555-123-4567
Jane 9876543210
Contact: Sam Smith, Phone: 555-987-6543"
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value)}
              className="min-h-[150px] text-sm"
            />
            
            <Button 
              onClick={handlePasteAnalysis}
              disabled={!pasteContent.trim()}
              className="w-full"
            >
              <Search className="h-4 w-4 mr-2" />
              Analyze Text
            </Button>
          </div>
          
          {parsedContacts.length > 0 && (
            <>
              <div className="text-sm font-medium">
                Found {parsedContacts.length} contacts:
              </div>
              <ScrollArea className="h-[30vh] pr-4 border rounded-md p-2">
                <div className="space-y-2">
                  {parsedContacts.map((contact, index) => (
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
              </ScrollArea>
            </>
          )}
        </TabsContent>
      </Tabs>
      
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </DialogFooter>
    </div>
  );
}; 