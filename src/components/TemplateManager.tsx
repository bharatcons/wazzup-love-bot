import React, { useState } from 'react';
import { useTemplates } from '@/contexts/TemplateContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Pencil, Trash2, Copy, X, Save, Tag } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MessageTemplate } from '@/services/TemplateService';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

interface TemplateFormProps {
  template?: MessageTemplate;
  onSubmit: (template: Pick<MessageTemplate, 'title' | 'content' | 'tags'>) => void;
  onCancel: () => void;
}

const TemplateForm: React.FC<TemplateFormProps> = ({ template, onSubmit, onCancel }) => {
  const [title, setTitle] = useState(template?.title || '');
  const [content, setContent] = useState(template?.content || '');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(template?.tags || []);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && content.trim()) {
      onSubmit({ title, content, tags });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Template Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="E.g., Birthday Wishes"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="content">Message Content</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Enter your message template..."
          className="min-h-[150px]"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="tags">Tags (optional)</Label>
        <div className="flex gap-2">
          <Input
            id="tags"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="Add tags..."
          />
          <Button type="button" variant="outline" onClick={handleAddTag}>
            <Tag className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>
        
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map(tag => (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                {tag}
                <X
                  className="h-3 w-3 cursor-pointer text-muted-foreground hover:text-foreground"
                  onClick={() => handleRemoveTag(tag)}
                />
              </Badge>
            ))}
          </div>
        )}
      </div>
      
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          <Save className="h-4 w-4 mr-2" />
          {template ? 'Update Template' : 'Save Template'}
        </Button>
      </DialogFooter>
    </form>
  );
};

const TemplateCard: React.FC<{
  template: MessageTemplate;
  onEdit: () => void;
  onDelete: () => void;
  onUse: () => void;
}> = ({ template, onEdit, onDelete, onUse }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-start">
          <span className="mr-2">{template.title}</span>
          <div className="flex space-x-1">
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          Created {format(new Date(template.createdAt), 'MMM d, yyyy')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">
          {template.content.length > 120
            ? `${template.content.substring(0, 120)}...`
            : template.content}
        </p>
        
        {template.tags && template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {template.tags.map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="secondary" className="w-full" onClick={onUse}>
          <Copy className="h-4 w-4 mr-2" />
          Use Template
        </Button>
      </CardFooter>
    </Card>
  );
};

const TemplateManager: React.FC = () => {
  const { templates, isLoading, addTemplate, updateTemplate, deleteTemplate } = useTemplates();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Get all unique tags
  const allTags = Array.from(new Set(
    templates.flatMap(template => template.tags || [])
  )).sort();

  // Filter templates by selected tag
  const filteredTemplates = selectedTag
    ? templates.filter(t => t.tags?.includes(selectedTag))
    : templates;

  const handleAddTemplate = async (template: Pick<MessageTemplate, 'title' | 'content' | 'tags'>) => {
    await addTemplate(template);
    setIsAddOpen(false);
  };

  const handleUpdateTemplate = async (template: Pick<MessageTemplate, 'title' | 'content' | 'tags'>) => {
    if (editingTemplate) {
      await updateTemplate({
        ...editingTemplate,
        ...template
      });
      setEditingTemplate(null);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      await deleteTemplate(id);
    }
  };

  const handleUseTemplate = (template: MessageTemplate) => {
    // Copy template content to clipboard
    navigator.clipboard.writeText(template.content).then(() => {
      alert('Template copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Message Templates</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Message Templates</h2>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Create New Template</DialogTitle>
              <DialogDescription>
                Create a reusable message template for your WhatsApp reminders.
              </DialogDescription>
            </DialogHeader>
            <TemplateForm
              onSubmit={handleAddTemplate}
              onCancel={() => setIsAddOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {templates.length === 0 ? (
        <Card className="text-center p-6">
          <CardContent className="pt-6">
            <p className="text-muted-foreground mb-4">You don't have any saved templates yet.</p>
            <Button onClick={() => setIsAddOpen(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Create Your First Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="all" className="w-full">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="all" onClick={() => setSelectedTag(null)}>All</TabsTrigger>
              {allTags.map(tag => (
                <TabsTrigger 
                  key={tag} 
                  value={tag}
                  onClick={() => setSelectedTag(tag)}
                >
                  {tag}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          
          <TabsContent value="all" className="m-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map(template => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onEdit={() => setEditingTemplate(template)}
                  onDelete={() => handleDeleteTemplate(template.id)}
                  onUse={() => handleUseTemplate(template)}
                />
              ))}
            </div>
          </TabsContent>
          
          {allTags.map(tag => (
            <TabsContent key={tag} value={tag} className="m-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.map(template => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onEdit={() => setEditingTemplate(template)}
                    onDelete={() => handleDeleteTemplate(template.id)}
                    onUse={() => handleUseTemplate(template)}
                  />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}

      {/* Edit Template Dialog */}
      <Dialog open={editingTemplate !== null} onOpenChange={(open) => !open && setEditingTemplate(null)}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>
              Update your message template.
            </DialogDescription>
          </DialogHeader>
          {editingTemplate && (
            <TemplateForm
              template={editingTemplate}
              onSubmit={handleUpdateTemplate}
              onCancel={() => setEditingTemplate(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TemplateManager; 