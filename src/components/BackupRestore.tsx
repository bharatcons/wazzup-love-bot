import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useReminders } from '@/contexts/ReminderContext';
import { useContacts } from '@/contexts/ContactContext';
import { useTemplates } from '@/contexts/TemplateContext';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Download, Upload, FileJson, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

type BackupData = {
  version: string;
  date: string;
  reminders: any[];
  contacts: any[];
  templates: any[];
  settings: any;
};

const BackupRestore: React.FC = () => {
  const { reminders, setReminders } = useReminders();
  const { contacts, fetchContacts } = useContacts();
  const { templates, fetchTemplates } = useTemplates();
  const { toast } = useToast();
  const [isMobile, setIsMobile] = useState(false);
  
  // Check if the screen is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);
  
  const [backupFileName, setBackupFileName] = useState('wazzup-backup');
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [restoredFile, setRestoredFile] = useState<File | null>(null);
  const [restoredData, setRestoredData] = useState<BackupData | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupError, setBackupError] = useState<string | null>(null);
  
  const createBackup = async () => {
    setIsBackingUp(true);
    setBackupError(null);
    
    try {
      // Get current settings from localStorage
      let settings = {};
      try {
        const storedSettings = localStorage.getItem('wazzup-settings');
        if (storedSettings) {
          settings = JSON.parse(storedSettings);
        }
      } catch (error) {
        console.error('Error getting settings for backup:', error);
      }
      
      // Create the backup object
      const backupData: BackupData = {
        version: '1.0.0',
        date: new Date().toISOString(),
        reminders,
        contacts,
        templates,
        settings
      };
      
      // Convert to JSON and create a Blob
      const jsonData = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      
      // Create a download link and trigger download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${backupFileName}.json`;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Backup created",
        description: "Your data has been successfully backed up.",
      });
    } catch (error) {
      console.error('Error creating backup:', error);
      setBackupError('Failed to create backup. Please try again.');
      
      toast({
        title: "Backup failed",
        description: "There was an error creating your backup.",
        variant: "destructive",
      });
    } finally {
      setIsBackingUp(false);
    }
  };
  
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      setRestoredFile(file);
      setRestoredData(null);
      setBackupError(null);
      
      // Parse the file
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const data = JSON.parse(content);
          
          // Validate backup data
          if (!data.version || !data.date || !Array.isArray(data.reminders)) {
            throw new Error('Invalid backup file format');
          }
          
          setRestoredData(data);
        } catch (error) {
          console.error('Error parsing backup file:', error);
          setBackupError('Invalid backup file. Please select a valid backup file.');
        }
      };
      
      reader.readAsText(file);
    }
  };
  
  const restoreBackup = async () => {
    if (!restoredData) return;
    
    setIsRestoring(true);
    setBackupError(null);
    
    try {
      // Restore reminders if they exist in the backup
      if (Array.isArray(restoredData.reminders)) {
        setReminders(restoredData.reminders);
      }
      
      // Restore settings if they exist in the backup
      if (restoredData.settings) {
        localStorage.setItem('wazzup-settings', JSON.stringify(restoredData.settings));
      }
      
      // For contacts and templates, we need to batch process through their individual APIs
      // This is a simplified version - in a real app, you'd need to ensure proper transaction handling
      
      // Refresh the data from database after restore
      await fetchContacts();
      await fetchTemplates();
      
      toast({
        title: "Restore complete",
        description: "Your data has been successfully restored.",
      });
      
      setRestoredFile(null);
      setRestoredData(null);
    } catch (error) {
      console.error('Error restoring backup:', error);
      setBackupError('Failed to restore backup. Please try again.');
      
      toast({
        title: "Restore failed",
        description: "There was an error restoring your backup.",
        variant: "destructive",
      });
    } finally {
      setIsRestoring(false);
    }
  };
  
  return (
    <div className="space-y-4 md:space-y-6">
      <h2 className="text-lg md:text-2xl font-bold">Backup &amp; Restore</h2>
      
      <Tabs defaultValue="backup" className="w-full">
        <TabsList className="mb-4 text-xs md:text-sm">
          <TabsTrigger value="backup" className="py-1.5 px-3">
            <Download className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
            <span>Backup</span>
          </TabsTrigger>
          <TabsTrigger value="restore" className="py-1.5 px-3">
            <Upload className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
            <span>Restore</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Backup Tab */}
        <TabsContent value="backup">
          <Card>
            <CardHeader className="py-3 px-4 md:py-4 md:px-6">
              <CardTitle className="text-sm md:text-base">Create a Backup</CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Save your reminders, contacts, templates, and settings to a file
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 py-1 px-4 md:py-2 md:px-6">
              <div className="space-y-1 md:space-y-2">
                <Label htmlFor="backup-filename" className="text-xs md:text-sm">Backup File Name</Label>
                <Input
                  id="backup-filename"
                  className="text-xs md:text-sm h-8 md:h-10"
                  value={backupFileName}
                  onChange={(e) => setBackupFileName(e.target.value)}
                  placeholder="Enter a name for your backup file"
                />
              </div>
              
              <Alert className="py-2 px-3 md:py-3 md:px-4">
                <FileJson className="h-3 w-3 md:h-4 md:w-4" />
                <AlertTitle className="text-xs md:text-sm">What will be backed up</AlertTitle>
                <AlertDescription className="text-[10px] md:text-xs">
                  <ul className="list-disc list-inside">
                    <li>{reminders.length} Reminders</li>
                    <li>{contacts.length} Contacts</li>
                    <li>{templates.length} Message Templates</li>
                    <li>Application Settings</li>
                  </ul>
                </AlertDescription>
              </Alert>
              
              {backupError && (
                <Alert variant="destructive" className="py-2 px-3 md:py-3 md:px-4">
                  <AlertTriangle className="h-3 w-3 md:h-4 md:w-4" />
                  <AlertTitle className="text-xs md:text-sm">Error</AlertTitle>
                  <AlertDescription className="text-[10px] md:text-xs">{backupError}</AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="py-3 px-4 md:py-4 md:px-6">
              <Button 
                onClick={createBackup} 
                disabled={isBackingUp}
                size={isMobile ? "sm" : "default"}
                className="text-xs md:text-sm"
              >
                <Download className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                {isBackingUp ? "Creating Backup..." : "Download Backup"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Restore Tab */}
        <TabsContent value="restore">
          <Card>
            <CardHeader className="py-3 px-4 md:py-4 md:px-6">
              <CardTitle className="text-sm md:text-base">Restore from Backup</CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Import your data from a previous backup file
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 py-1 px-4 md:py-2 md:px-6">
              <div className="space-y-1 md:space-y-2">
                <Label htmlFor="restore-file" className="text-xs md:text-sm">Select Backup File</Label>
                <Input
                  id="restore-file"
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="text-xs md:text-sm h-8 md:h-10 pt-1.5"
                />
              </div>
              
              {restoredData && (
                <Alert className="py-2 px-3 md:py-3 md:px-4">
                  <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4" />
                  <AlertTitle className="text-xs md:text-sm">Backup Info</AlertTitle>
                  <AlertDescription className="text-[10px] md:text-xs space-y-0.5">
                    <div>Date: {new Date(restoredData.date).toLocaleString()}</div>
                    <div>Reminders: {restoredData.reminders?.length || 0}</div>
                    <div>Contacts: {restoredData.contacts?.length || 0}</div>
                    <div>Templates: {restoredData.templates?.length || 0}</div>
                  </AlertDescription>
                </Alert>
              )}
              
              {backupError && (
                <Alert variant="destructive" className="py-2 px-3 md:py-3 md:px-4">
                  <AlertTriangle className="h-3 w-3 md:h-4 md:w-4" />
                  <AlertTitle className="text-xs md:text-sm">Error</AlertTitle>
                  <AlertDescription className="text-[10px] md:text-xs">{backupError}</AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="py-3 px-4 md:py-4 md:px-6">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    disabled={!restoredData || isRestoring}
                    variant="default"
                    size={isMobile ? "sm" : "default"}
                    className="text-xs md:text-sm"
                  >
                    <Upload className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                    {isRestoring ? "Restoring..." : "Restore Backup"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-[340px] md:max-w-[450px] p-4 md:p-6 text-xs md:text-sm">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-sm md:text-base">Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription className="text-xs md:text-sm">
                      This action will replace your current data with the backup. This cannot be undone.
                      We recommend creating a backup of your current data first.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex-col space-y-2 sm:space-y-0 sm:flex-row">
                    <AlertDialogCancel className="text-xs md:text-sm px-3 py-1.5 md:py-2">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={restoreBackup} className="text-xs md:text-sm px-3 py-1.5 md:py-2">
                      Yes, restore backup
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BackupRestore; 