import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import templateService, { MessageTemplate } from '@/services/TemplateService';
import { useToast } from '@/components/ui/use-toast';

interface TemplateContextType {
  templates: MessageTemplate[];
  isLoading: boolean;
  fetchTemplates: () => Promise<void>;
  addTemplate: (template: Omit<MessageTemplate, 'id' | 'createdAt'>) => Promise<MessageTemplate | null>;
  updateTemplate: (template: MessageTemplate) => Promise<MessageTemplate | null>;
  deleteTemplate: (id: string) => Promise<boolean>;
  getTemplateById: (id: string) => MessageTemplate | undefined;
}

const TemplateContext = createContext<TemplateContextType | undefined>(undefined);

export const useTemplates = (): TemplateContextType => {
  const context = useContext(TemplateContext);
  if (!context) {
    throw new Error('useTemplates must be used within a TemplateProvider');
  }
  return context;
};

interface TemplateProviderProps {
  children: ReactNode;
}

export const TemplateProvider: React.FC<TemplateProviderProps> = ({ children }) => {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const fetchedTemplates = await templateService.getTemplates();
      setTemplates(fetchedTemplates);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Failed to load templates",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addTemplate = async (template: Omit<MessageTemplate, 'id' | 'createdAt'>) => {
    try {
      const newTemplate = await templateService.createTemplate(template);
      if (newTemplate) {
        setTemplates(prev => [newTemplate, ...prev]);
        toast({
          title: "Template created",
          description: "Your message template has been saved",
        });
        return newTemplate;
      }
      return null;
    } catch (error) {
      console.error('Error adding template:', error);
      toast({
        title: "Failed to create template",
        description: "Please try again",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateTemplate = async (template: MessageTemplate) => {
    try {
      const updatedTemplate = await templateService.updateTemplate(template);
      if (updatedTemplate) {
        setTemplates(prev => 
          prev.map(t => t.id === template.id ? updatedTemplate : t)
        );
        toast({
          title: "Template updated",
          description: "Your changes have been saved",
        });
        return updatedTemplate;
      }
      return null;
    } catch (error) {
      console.error('Error updating template:', error);
      toast({
        title: "Failed to update template",
        description: "Please try again",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      const success = await templateService.deleteTemplate(id);
      if (success) {
        setTemplates(prev => prev.filter(t => t.id !== id));
        toast({
          title: "Template deleted",
          description: "The template has been removed",
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Failed to delete template",
        description: "Please try again",
        variant: "destructive",
      });
      return false;
    }
  };

  const getTemplateById = (id: string) => {
    return templates.find(t => t.id === id);
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const value = {
    templates,
    isLoading,
    fetchTemplates,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    getTemplateById,
  };

  return (
    <TemplateContext.Provider value={value}>
      {children}
    </TemplateContext.Provider>
  );
};

export default TemplateProvider; 