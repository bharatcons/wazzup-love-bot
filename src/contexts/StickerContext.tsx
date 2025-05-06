import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import stickerService, { Sticker, StickerInput } from '@/services/StickerService';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';

interface StickerContextType {
  stickers: Sticker[];
  loading: boolean;
  addSticker: (sticker: StickerInput) => Promise<Sticker | null>;
  updateSticker: (sticker: Sticker) => Promise<Sticker | null>;
  deleteSticker: (id: string) => Promise<boolean>;
  markStickerAsUsed: (id: string) => Promise<boolean>;
  toggleFavoriteSticker: (id: string, favorite: boolean) => Promise<boolean>;
  uploadStickerImage: (file: File) => Promise<string | null>;
}

const StickerContext = createContext<StickerContextType | undefined>(undefined);

export const useStickers = () => {
  const context = useContext(StickerContext);
  if (context === undefined) {
    throw new Error('useStickers must be used within a StickerProvider');
  }
  return context;
};

interface StickerProviderProps {
  children: ReactNode;
}

export const StickerProvider: React.FC<StickerProviderProps> = ({ children }) => {
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchStickers = async () => {
      setLoading(true);
      try {
        const data = await stickerService.getAll();
        setStickers(data);
      } catch (error) {
        console.error('Error fetching stickers:', error);
        toast({
          title: 'Error',
          description: 'Failed to load WhatsApp stickers',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStickers();

    // Set up real-time subscription
    const subscription = supabase
      .channel('stickers_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'stickers' 
        }, 
        (payload) => {
          console.log('Sticker change received:', payload);
          
          // Refresh data when changes occur
          fetchStickers();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [toast]);

  const addSticker = async (stickerInput: StickerInput): Promise<Sticker | null> => {
    try {
      const newSticker = await stickerService.add(stickerInput);
      if (newSticker) {
        // We'll let the real-time subscription handle the update
        toast({
          title: 'Success',
          description: 'WhatsApp sticker created successfully',
        });
        return newSticker;
      }
      return null;
    } catch (error) {
      console.error('Error adding sticker:', error);
      toast({
        title: 'Error',
        description: 'Failed to create WhatsApp sticker',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateSticker = async (sticker: Sticker): Promise<Sticker | null> => {
    try {
      const updatedSticker = await stickerService.update(sticker);
      if (updatedSticker) {
        // We'll let the real-time subscription handle the update
        toast({
          title: 'Success',
          description: 'WhatsApp sticker updated successfully',
        });
        return updatedSticker;
      }
      return null;
    } catch (error) {
      console.error('Error updating sticker:', error);
      toast({
        title: 'Error',
        description: 'Failed to update WhatsApp sticker',
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteSticker = async (id: string): Promise<boolean> => {
    try {
      const success = await stickerService.delete(id);
      if (success) {
        // We'll let the real-time subscription handle the update
        toast({
          title: 'Success',
          description: 'WhatsApp sticker deleted successfully',
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting sticker:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete WhatsApp sticker',
        variant: 'destructive',
      });
      return false;
    }
  };

  const markStickerAsUsed = async (id: string): Promise<boolean> => {
    try {
      const success = await stickerService.markAsUsed(id);
      // No toast needed for this operation
      return success;
    } catch (error) {
      console.error('Error marking sticker as used:', error);
      return false;
    }
  };

  const toggleFavoriteSticker = async (id: string, favorite: boolean): Promise<boolean> => {
    try {
      const success = await stickerService.toggleFavorite(id, favorite);
      if (success) {
        toast({
          title: 'Success',
          description: favorite 
            ? 'Sticker added to favorites' 
            : 'Sticker removed from favorites',
          duration: 2000,
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error toggling favorite sticker:', error);
      toast({
        title: 'Error',
        description: 'Failed to update favorite status',
        variant: 'destructive',
      });
      return false;
    }
  };
  
  const uploadStickerImage = async (file: File): Promise<string | null> => {
    try {
      const url = await stickerService.uploadStickerImage(file);
      if (url) {
        toast({
          title: 'Success',
          description: 'Image uploaded successfully',
          duration: 2000,
        });
        return url;
      }
      return null;
    } catch (error) {
      console.error('Error uploading sticker image:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload sticker image',
        variant: 'destructive',
      });
      return null;
    }
  };

  const value = {
    stickers,
    loading,
    addSticker,
    updateSticker,
    deleteSticker,
    markStickerAsUsed,
    toggleFavoriteSticker,
    uploadStickerImage,
  };

  return (
    <StickerContext.Provider value={value}>
      {children}
    </StickerContext.Provider>
  );
};

export default StickerContext; 