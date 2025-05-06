import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useStatuses } from '@/contexts/StatusContext';
import { Status, StatusInput } from '@/services/StatusService';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogClose,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Heart, 
  Pencil, 
  PlusCircle, 
  Send, 
  Star, 
  MoreVertical, 
  Trash2, 
  Clock, 
  Calendar,
  SlidersHorizontal,
  SearchIcon,
  Share2,
  MessageSquare,
  Copy,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const categoryOptions = [
  'Personal',
  'Work',
  'Inspirational',
  'Funny',
  'Holiday',
  'Birthday',
  'Travel',
  'Food',
  'Other'
];

const emojiOptions = [
  '😊', '❤️', '👍', '🎉', '🌟', '🔥', '💯', '🙏', 
  '✨', '🌈', '🎁', '🏝️', '🍕', '🎵', '📚', '🎮',
  '⚡', '🚀', '💪', '😎'
];

interface StatusFormProps {
  onSubmit: (status: StatusInput) => void;
  initialData?: Status;
  onCancel: () => void;
}

const StatusForm: React.FC<StatusFormProps> = ({ onSubmit, initialData, onCancel }) => {
  const [content, setContent] = useState(initialData?.content || '');
  const [category, setCategory] = useState(initialData?.category || 'Personal');
  const [emoji, setEmoji] = useState(initialData?.emoji || '');
  const [favorite, setFavorite] = useState(initialData?.favorite || false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!content.trim()) {
      newErrors.content = "Status content is required";
    } else if (content.length > 700) {
      newErrors.content = "Status content must be less than 700 characters";
    }
    
    if (!category) {
      newErrors.category = "Category is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    onSubmit({
      content,
      category,
      emoji: emoji || undefined,
      favorite
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="emoji">Emoji (Optional)</Label>
          <div className="flex items-center">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={`h-8 w-8 p-0 rounded-full ${favorite ? 'text-yellow-500' : ''}`}
              onClick={() => setFavorite(!favorite)}
            >
              <Star className="h-4 w-4" fill={favorite ? 'currentColor' : 'none'} />
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-1 bg-muted p-1 rounded-md">
          <div className="flex items-center justify-center h-8 w-8 bg-background rounded-md mb-1">
            {emoji || '😀'}
          </div>
          {emojiOptions.map((e) => (
            <button
              key={e}
              type="button"
              className={`h-8 w-8 flex items-center justify-center rounded-md hover:bg-background ${emoji === e ? 'bg-background' : ''}`}
              onClick={() => setEmoji(e)}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger id="category" className={errors.category ? "border-destructive" : ""}>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categoryOptions.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category && (
          <p className="text-destructive text-sm flex items-center">
            <AlertCircle className="h-3 w-3 mr-1" />
            {errors.category}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Status Content</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Enter your WhatsApp status text here..."
          className={errors.content ? "border-destructive" : ""}
          rows={6}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{content.length} / 700 characters</span>
          {errors.content && (
            <p className="text-destructive text-sm flex items-center">
              <AlertCircle className="h-3 w-3 mr-1" />
              {errors.content}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-whatsapp hover:bg-whatsapp-dark">
          {initialData ? 'Update' : 'Create'} Status
        </Button>
      </div>
    </form>
  );
};

interface StatusCardProps {
  status: Status;
  onDelete: (id: string) => void;
  onEdit: (status: Status) => void;
  onUse: (status: Status) => void;
  onToggleFavorite: (id: string, favorite: boolean) => void;
}

const StatusCard: React.FC<StatusCardProps> = ({ 
  status, 
  onDelete, 
  onEdit, 
  onUse, 
  onToggleFavorite 
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(status.content);
  };
  
  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              <span className="text-xl mr-2">{status.emoji || '📝'}</span>
              <Badge variant="outline">{status.category}</Badge>
            </div>
            <div className="flex items-center">
              {status.favorite && (
                <Star className="h-4 w-4 text-yellow-500 mr-1" fill="currentColor" />
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(status)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onUse(status)}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Use on WhatsApp
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={copyToClipboard}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy to Clipboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onToggleFavorite(status.id, !status.favorite)}>
                    <Star className="h-4 w-4 mr-2" fill={status.favorite ? "currentColor" : "none"} />
                    {status.favorite ? 'Remove from Favorites' : 'Add to Favorites'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-2 flex-grow">
          <p className="text-sm whitespace-pre-wrap line-clamp-4">{status.content}</p>
        </CardContent>
        <CardFooter className="pt-0 mt-auto flex justify-between">
          <div className="flex items-center text-muted-foreground text-xs">
            <Clock className="h-3 w-3 mr-1" />
            {status.lastUsed 
              ? `Last used: ${format(new Date(status.lastUsed), 'MMM d')}` 
              : 'Not used yet'}
          </div>
          <Button 
            size="sm" 
            className="h-8 bg-whatsapp hover:bg-whatsapp-dark"
            onClick={() => onUse(status)}
          >
            <Share2 className="h-3.5 w-3.5 mr-1.5" />
            Use
          </Button>
        </CardFooter>
      </Card>
      
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this status. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => onDelete(status.id)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

const StatusManager: React.FC = () => {
  const { 
    statuses, 
    loading, 
    addStatus, 
    updateStatus, 
    deleteStatus, 
    markStatusAsUsed,
    toggleFavoriteStatus 
  } = useStatuses();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<Status | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTab, setCurrentTab] = useState('all');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  
  const handleAdd = async (statusInput: StatusInput) => {
    await addStatus(statusInput);
    setIsAddDialogOpen(false);
  };
  
  const handleEdit = (status: Status) => {
    setCurrentStatus(status);
    setIsEditDialogOpen(true);
  };
  
  const handleUpdate = async (statusInput: StatusInput) => {
    if (currentStatus) {
      await updateStatus({
        ...currentStatus,
        content: statusInput.content,
        category: statusInput.category,
        emoji: statusInput.emoji,
        favorite: statusInput.favorite || false
      });
      setIsEditDialogOpen(false);
      setCurrentStatus(null);
    }
  };
  
  const handleDelete = async (id: string) => {
    await deleteStatus(id);
  };
  
  const handleUse = async (status: Status) => {
    // Mark as used
    await markStatusAsUsed(status.id);
    
    // Open WhatsApp web with the status as the status update
    window.open(`https://web.whatsapp.com/status`, '_blank');
    
    // We can't directly set the status, but we can copy it to clipboard
    await navigator.clipboard.writeText(status.content);
    
    // Alert user
    alert('Status copied to clipboard. Paste it into the WhatsApp status field that just opened.');
  };
  
  const handleToggleFavorite = async (id: string, favorite: boolean) => {
    await toggleFavoriteStatus(id, favorite);
  };
  
  // Filter statuses based on search term, tab and category
  const filteredStatuses = statuses.filter(status => {
    const matchesSearch = status.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          status.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = 
      (currentTab === 'all') ||
      (currentTab === 'favorites' && status.favorite) ||
      (currentTab === 'recent' && status.lastUsed);
    
    const matchesCategory = !filterCategory || status.category === filterCategory;
    
    return matchesSearch && matchesTab && matchesCategory;
  });
  
  // Sort statuses
  const sortedStatuses = [...filteredStatuses].sort((a, b) => {
    if (currentTab === 'favorites') {
      // For favorites tab, show favorites first then sort by most recent
      if (a.favorite && !b.favorite) return -1;
      if (!a.favorite && b.favorite) return 1;
    }
    
    if (currentTab === 'recent') {
      // For recent tab, sort by most recently used
      const dateA = a.lastUsed ? new Date(a.lastUsed).getTime() : 0;
      const dateB = b.lastUsed ? new Date(b.lastUsed).getTime() : 0;
      return dateB - dateA;
    }
    
    // Default: sort by creation date (newest first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  
  // Get unique categories
  const uniqueCategories = Array.from(new Set(statuses.map(status => status.category)));
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between gap-2 mb-4">
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full md:w-auto bg-whatsapp hover:bg-whatsapp-dark">
              <PlusCircle className="h-4 w-4 mr-2" />
              New Status
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New WhatsApp Status</DialogTitle>
              <DialogDescription>
                Create a new status that you can easily share on WhatsApp
              </DialogDescription>
            </DialogHeader>
            <StatusForm 
              onSubmit={handleAdd} 
              onCancel={() => setIsAddDialogOpen(false)} 
            />
          </DialogContent>
        </Dialog>
        
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative w-full">
            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search statuses..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setFilterCategory(null)}>
                All Categories
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {uniqueCategories.map(cat => (
                <DropdownMenuItem 
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={filterCategory === cat ? "bg-muted" : ""}
                >
                  {cat}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">
            <MessageSquare className="h-4 w-4 mr-2" />
            All
          </TabsTrigger>
          <TabsTrigger value="favorites">
            <Star className="h-4 w-4 mr-2" />
            Favorites
          </TabsTrigger>
          <TabsTrigger value="recent">
            <Clock className="h-4 w-4 mr-2" />
            Recent
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-0">
          {filterCategory && (
            <div className="mb-4 flex items-center justify-between bg-muted p-2 rounded-md">
              <div className="flex items-center">
                <span className="text-sm font-medium mr-2">Category:</span>
                <Badge>{filterCategory}</Badge>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setFilterCategory(null)}
              >
                Clear
              </Button>
            </div>
          )}
          
          {loading ? (
            <div className="py-12 flex items-center justify-center">
              <p>Loading statuses...</p>
            </div>
          ) : sortedStatuses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedStatuses.map(status => (
                <StatusCard
                  key={status.id}
                  status={status}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  onUse={handleUse}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                {searchTerm 
                  ? "No statuses match your search" 
                  : filterCategory 
                    ? `No ${filterCategory} statuses found` 
                    : "No statuses yet"}
              </p>
              <Button 
                onClick={() => setIsAddDialogOpen(true)}
                className="bg-whatsapp hover:bg-whatsapp-dark"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Your First Status
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="favorites" className="mt-0">
          {sortedStatuses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedStatuses.map(status => (
                <StatusCard
                  key={status.id}
                  status={status}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  onUse={handleUse}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                No favorite statuses yet
              </p>
              <Button 
                onClick={() => setCurrentTab('all')}
                variant="outline"
              >
                View All Statuses
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="recent" className="mt-0">
          {sortedStatuses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedStatuses.map(status => (
                <StatusCard
                  key={status.id}
                  status={status}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  onUse={handleUse}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                No recently used statuses
              </p>
              <Button 
                onClick={() => setCurrentTab('all')}
                variant="outline"
              >
                View All Statuses
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit WhatsApp Status</DialogTitle>
            <DialogDescription>
              Update your saved WhatsApp status
            </DialogDescription>
          </DialogHeader>
          {currentStatus && (
            <StatusForm 
              onSubmit={handleUpdate} 
              initialData={currentStatus}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setCurrentStatus(null);
              }} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StatusManager; 