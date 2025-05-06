import { supabase } from '@/lib/supabase';

export interface Sticker {
  id: string;
  name: string;
  imageUrl: string;
  category: string;
  created_at: string;
  lastUsed?: string;
  favorite: boolean;
}

export interface StickerInput {
  name: string;
  imageUrl: string;
  category: string;
  favorite?: boolean;
}

class StickerService {
  private readonly TABLE_NAME = 'stickers';
  
  async getAll(): Promise<Sticker[]> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching stickers:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getAll:', error);
      return [];
    }
  }
  
  async add(sticker: StickerInput): Promise<Sticker | null> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .insert({
          name: sticker.name,
          imageUrl: sticker.imageUrl,
          category: sticker.category,
          favorite: sticker.favorite || false,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error adding sticker:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error in add:', error);
      return null;
    }
  }
  
  async update(sticker: Sticker): Promise<Sticker | null> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .update({
          name: sticker.name,
          imageUrl: sticker.imageUrl,
          category: sticker.category,
          favorite: sticker.favorite,
        })
        .eq('id', sticker.id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating sticker:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error in update:', error);
      return null;
    }
  }
  
  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(this.TABLE_NAME)
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting sticker:', error);
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Error in delete:', error);
      return false;
    }
  }
  
  async markAsUsed(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(this.TABLE_NAME)
        .update({
          lastUsed: new Date().toISOString()
        })
        .eq('id', id);
      
      if (error) {
        console.error('Error marking sticker as used:', error);
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Error in markAsUsed:', error);
      return false;
    }
  }
  
  async toggleFavorite(id: string, favorite: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(this.TABLE_NAME)
        .update({
          favorite
        })
        .eq('id', id);
      
      if (error) {
        console.error('Error toggling favorite sticker:', error);
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Error in toggleFavorite:', error);
      return false;
    }
  }
  
  async uploadStickerImage(file: File): Promise<string | null> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `stickers/${fileName}`;
      
      const { data, error } = await supabase.storage
        .from('sticker-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) {
        console.error('Error uploading sticker image:', error);
        throw error;
      }
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('sticker-images')
        .getPublicUrl(filePath);
      
      return publicUrl;
    } catch (error) {
      console.error('Error in uploadStickerImage:', error);
      return null;
    }
  }
}

export const stickerService = new StickerService();
export default stickerService; 