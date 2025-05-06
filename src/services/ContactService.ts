import { supabase } from '@/lib/supabase';

export interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
  notes?: string;
  createdAt: string;
  lastUsed?: string;
  tags?: string[];
}

class ContactService {
  async getContacts(): Promise<Contact[]> {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Error fetching contacts:', error);
      return [];
    }
    
    return data as Contact[];
  }
  
  async getContactById(id: string): Promise<Contact | null> {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching contact:', error);
      return null;
    }
    
    return data as Contact;
  }
  
  async createContact(contact: Omit<Contact, 'id' | 'createdAt'>): Promise<Contact | null> {
    const newContact = {
      ...contact,
      createdAt: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('contacts')
      .insert([newContact])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating contact:', error);
      return null;
    }
    
    return data as Contact;
  }
  
  async updateContact(contact: Contact): Promise<Contact | null> {
    const { data, error } = await supabase
      .from('contacts')
      .update(contact)
      .eq('id', contact.id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating contact:', error);
      return null;
    }
    
    return data as Contact;
  }
  
  async deleteContact(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting contact:', error);
      return false;
    }
    
    return true;
  }
  
  async updateLastUsed(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('contacts')
      .update({ lastUsed: new Date().toISOString() })
      .eq('id', id);
    
    if (error) {
      console.error('Error updating last used timestamp:', error);
      return false;
    }
    
    return true;
  }
  
  async searchContacts(query: string): Promise<Contact[]> {
    if (!query) return [];
    
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .or(`name.ilike.%${query}%,phoneNumber.ilike.%${query}%`)
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Error searching contacts:', error);
      return [];
    }
    
    return data as Contact[];
  }
}

export const contactService = new ContactService();
export default contactService; 