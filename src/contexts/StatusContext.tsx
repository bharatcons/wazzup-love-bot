import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import statusService, { Status, StatusInput } from '@/services/StatusService';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';

interface StatusContextType {
  statuses: Status[];
  loading: boolean;
  addStatus: (status: StatusInput) => Promise<Status | null>;
  updateStatus: (status: Status) => Promise<Status | null>;
  deleteStatus: (id: string) => Promise<boolean>;
  markStatusAsUsed: (id: string) => Promise<boolean>;
  toggleFavoriteStatus: (id: string, favorite: boolean) => Promise<boolean>;
}

const StatusContext = createContext<StatusContextType | undefined>(undefined);

export const useStatuses = () => {
  const context = useContext(StatusContext);
  if (context === undefined) {
    throw new Error('useStatuses must be used within a StatusProvider');
  }
  return context;
};

interface StatusProviderProps {
  children: ReactNode;
}

export const StatusProvider: React.FC<StatusProviderProps> = ({ children }) => {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchStatuses = async () => {
      setLoading(true);
      try {
        const data = await statusService.getAll();
        setStatuses(data);
      } catch (error) {
        console.error('Error fetching statuses:', error);
        toast({
          title: 'Error',
          description: 'Failed to load WhatsApp statuses',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStatuses();

    // Set up real-time subscription
    const subscription = supabase
      .channel('status_updates_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'status_updates' 
        }, 
        (payload) => {
          console.log('Status update change received:', payload);
          
          // Refresh data when changes occur
          fetchStatuses();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [toast]);

  const addStatus = async (statusInput: StatusInput): Promise<Status | null> => {
    try {
      const newStatus = await statusService.add(statusInput);
      if (newStatus) {
        // We'll let the real-time subscription handle the update
        toast({
          title: 'Success',
          description: 'WhatsApp status created successfully',
        });
        return newStatus;
      }
      return null;
    } catch (error) {
      console.error('Error adding status:', error);
      toast({
        title: 'Error',
        description: 'Failed to create WhatsApp status',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateStatus = async (status: Status): Promise<Status | null> => {
    try {
      const updatedStatus = await statusService.update(status);
      if (updatedStatus) {
        // We'll let the real-time subscription handle the update
        toast({
          title: 'Success',
          description: 'WhatsApp status updated successfully',
        });
        return updatedStatus;
      }
      return null;
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update WhatsApp status',
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteStatus = async (id: string): Promise<boolean> => {
    try {
      const success = await statusService.delete(id);
      if (success) {
        // We'll let the real-time subscription handle the update
        toast({
          title: 'Success',
          description: 'WhatsApp status deleted successfully',
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting status:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete WhatsApp status',
        variant: 'destructive',
      });
      return false;
    }
  };

  const markStatusAsUsed = async (id: string): Promise<boolean> => {
    try {
      const success = await statusService.markAsUsed(id);
      // No toast needed for this operation
      return success;
    } catch (error) {
      console.error('Error marking status as used:', error);
      return false;
    }
  };

  const toggleFavoriteStatus = async (id: string, favorite: boolean): Promise<boolean> => {
    try {
      const success = await statusService.toggleFavorite(id, favorite);
      if (success) {
        toast({
          title: 'Success',
          description: favorite 
            ? 'Status added to favorites' 
            : 'Status removed from favorites',
          duration: 2000,
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error toggling favorite status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update favorite status',
        variant: 'destructive',
      });
      return false;
    }
  };

  const value = {
    statuses,
    loading,
    addStatus,
    updateStatus,
    deleteStatus,
    markStatusAsUsed,
    toggleFavoriteStatus,
  };

  return (
    <StatusContext.Provider value={value}>
      {children}
    </StatusContext.Provider>
  );
};

export default StatusContext; 