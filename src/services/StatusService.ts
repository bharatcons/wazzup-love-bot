import { supabase } from '@/lib/supabase';

export interface Status {
  id: string;
  content: string;
  category: string;
  emoji?: string;
  created_at: string;
  lastUsed?: string;
  favorite: boolean;
}

export interface StatusInput {
  content: string;
  category: string;
  emoji?: string;
  favorite?: boolean;
}

class StatusService {
  private readonly TABLE_NAME = 'status_updates';
  
  async getAll(): Promise<Status[]> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('*')
        .order('lastUsed', { ascending: false, nullsFirst: false });
      
      if (error) {
        console.error('Error fetching status updates:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getAll:', error);
      return [];
    }
  }
  
  async add(status: StatusInput): Promise<Status | null> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .insert({
          content: status.content,
          category: status.category,
          emoji: status.emoji,
          favorite: status.favorite || false,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error adding status:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error in add:', error);
      return null;
    }
  }
  
  async update(status: Status): Promise<Status | null> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .update({
          content: status.content,
          category: status.category,
          emoji: status.emoji,
          favorite: status.favorite,
        })
        .eq('id', status.id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating status:', error);
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
        console.error('Error deleting status:', error);
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
        console.error('Error marking status as used:', error);
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
        console.error('Error toggling favorite status:', error);
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Error in toggleFavorite:', error);
      return false;
    }
  }
}

export const statusService = new StatusService();
export default statusService; 