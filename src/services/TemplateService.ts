import { supabase } from '@/lib/supabase';

export interface MessageTemplate {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  tags?: string[];
}

class TemplateService {
  async getTemplates(): Promise<MessageTemplate[]> {
    const { data, error } = await supabase
      .from('message_templates')
      .select('*')
      .order('createdAt', { ascending: false });
    
    if (error) {
      console.error('Error fetching templates:', error);
      return [];
    }
    
    return data as MessageTemplate[];
  }
  
  async getTemplateById(id: string): Promise<MessageTemplate | null> {
    const { data, error } = await supabase
      .from('message_templates')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching template:', error);
      return null;
    }
    
    return data as MessageTemplate;
  }
  
  async createTemplate(template: Omit<MessageTemplate, 'id' | 'createdAt'>): Promise<MessageTemplate | null> {
    const newTemplate = {
      ...template,
      createdAt: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('message_templates')
      .insert([newTemplate])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating template:', error);
      return null;
    }
    
    return data as MessageTemplate;
  }
  
  async updateTemplate(template: MessageTemplate): Promise<MessageTemplate | null> {
    const { data, error } = await supabase
      .from('message_templates')
      .update(template)
      .eq('id', template.id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating template:', error);
      return null;
    }
    
    return data as MessageTemplate;
  }
  
  async deleteTemplate(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('message_templates')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting template:', error);
      return false;
    }
    
    return true;
  }
}

export const templateService = new TemplateService();
export default templateService; 