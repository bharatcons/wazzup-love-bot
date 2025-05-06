import React, { useState, useRef, useEffect } from 'react';
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
import { useStickers } from '@/contexts/StickerContext';
import { Sticker, StickerInput } from '@/services/StickerService';
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
  ImageIcon,
  Star, 
  Pencil, 
  PlusCircle, 
  MoreVertical, 
  Trash2, 
  Clock, 
  SlidersHorizontal,
  SearchIcon,
  Download,
  Share2,
  Sticker as StickerIcon,
  AlertCircle,
  Upload,
  Crop,
  Palette,
  Type,
  Image
} from 'lucide-react';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';

const categoryOptions = [
  'Personal',
  'Memes',
  'Emoji',
  'Funny',
  'Quotes',
  'Custom',
  'Friends',
  'Family',
  'Love',
  'Other'
];

interface StickerEditorProps {
  onSave: (sticker: StickerInput) => void;
  initialData?: Sticker;
  onCancel: () => void;
}

const StickerEditor: React.FC<StickerEditorProps> = ({ onSave, initialData, onCancel }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [category, setCategory] = useState(initialData?.category || 'Personal');
  const [favorite, setFavorite] = useState(initialData?.favorite || false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Image handling state
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.imageUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  
  const { uploadStickerImage } = useStickers();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    const file = e.target.files[0];
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "File too large",
        description: "The image must be smaller than 5MB",
        variant: "destructive"
      });
      return;
    }
    
    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive"
      });
      return;
    }
    
    setUploadedImage(file);
    
    // Create a preview
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) {
      newErrors.name = "Sticker name is required";
    }
    
    if (!category) {
      newErrors.category = "Category is required";
    }
    
    if (!imagePreview && !uploadedImage) {
      newErrors.image = "An image is required for the sticker";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsUploading(true);
    
    try {
      let imageUrl = initialData?.imageUrl || '';
      
      // If there's a new image, upload it
      if (uploadedImage) {
        const uploadedUrl = await uploadStickerImage(uploadedImage);
        if (!uploadedUrl) {
          throw new Error("Failed to upload image");
        }
        imageUrl = uploadedUrl;
      }
      
      // Save the sticker
      onSave({
        name,
        category,
        imageUrl,
        favorite
      });
      
    } catch (error) {
      console.error("Error saving sticker:", error);
      toast({
        title: "Error",
        description: "Failed to save sticker. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="name">Sticker Name</Label>
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
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter a name for your sticker"
          className={errors.name ? "border-destructive" : ""}
        />
        {errors.name && (
          <p className="text-destructive text-sm flex items-center">
            <AlertCircle className="h-3 w-3 mr-1" />
            {errors.name}
          </p>
        )}
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
        <Label>Sticker Image</Label>
        <div className="border rounded-md p-4 flex flex-col items-center justify-center space-y-4">
          {imagePreview ? (
            <div className="relative">
              <img 
                src={imagePreview} 
                alt="Sticker Preview" 
                className="rounded-md max-h-60 max-w-full object-contain"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setImagePreview(null);
                  setUploadedImage(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="absolute top-2 right-2 h-7 w-7 p-0 rounded-full"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <>
              <div 
                className="border-2 border-dashed border-muted-foreground/25 rounded-md p-10 flex flex-col items-center cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground text-center">
                  Click to upload a sticker image<br />
                  <span className="text-xs">PNG, JPG, GIF, SVG (max 5MB)</span>
                </p>
              </div>
              <input 
                type="file" 
                ref={fileInputRef}
                style={{ display: 'none' }} 
                accept="image/*"
                onChange={handleImageUpload}
                aria-label="Upload sticker image"
              />
            </>
          )}
          
          {errors.image && (
            <p className="text-destructive text-sm flex items-center">
              <AlertCircle className="h-3 w-3 mr-1" />
              {errors.image}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isUploading}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          className="bg-whatsapp hover:bg-whatsapp-dark"
          disabled={isUploading}
        >
          {isUploading ? 'Uploading...' : initialData ? 'Update Sticker' : 'Create Sticker'}
        </Button>
      </div>
    </form>
  );
};

interface StickerCardProps {
  sticker: Sticker;
  onDelete: (id: string) => void;
  onEdit: (sticker: Sticker) => void;
  onUse: (sticker: Sticker) => void;
  onToggleFavorite: (id: string, favorite: boolean) => void;
}

const StickerCard: React.FC<StickerCardProps> = ({ 
  sticker, 
  onDelete, 
  onEdit, 
  onUse, 
  onToggleFavorite 
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{sticker.category}</Badge>
              {sticker.favorite && (
                <Star className="h-4 w-4 text-yellow-500" fill="currentColor" />
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(sticker)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onUse(sticker)}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Send via WhatsApp
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggleFavorite(sticker.id, !sticker.favorite)}>
                  <Star className="h-4 w-4 mr-2" fill={sticker.favorite ? "currentColor" : "none"} />
                  {sticker.favorite ? 'Remove from Favorites' : 'Add to Favorites'}
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
        </CardHeader>
        <CardContent className="pb-2 flex-grow flex flex-col items-center">
          <div className="relative w-full h-32 flex items-center justify-center mb-2">
            <img 
              src={sticker.imageUrl} 
              alt={sticker.name}
              className="max-w-full max-h-full object-contain rounded-md"
            />
          </div>
          <h3 className="font-medium text-sm text-center">{sticker.name}</h3>
        </CardContent>
        <CardFooter className="pt-0 mt-auto flex justify-between">
          <div className="flex items-center text-muted-foreground text-xs">
            <Clock className="h-3 w-3 mr-1" />
            {sticker.lastUsed 
              ? `Last used: ${format(new Date(sticker.lastUsed), 'MMM d')}` 
              : 'Not used yet'}
          </div>
          <Button 
            size="sm" 
            className="h-8 bg-whatsapp hover:bg-whatsapp-dark"
            onClick={() => onUse(sticker)}
          >
            <Share2 className="h-3.5 w-3.5 mr-1.5" />
            Send
          </Button>
        </CardFooter>
      </Card>
      
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this sticker. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => onDelete(sticker.id)}
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

const StickerCreator: React.FC = () => {
  const { 
    stickers, 
    loading, 
    addSticker, 
    updateSticker, 
    deleteSticker, 
    markStickerAsUsed,
    toggleFavoriteSticker 
  } = useStickers();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentSticker, setCurrentSticker] = useState<Sticker | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTab, setCurrentTab] = useState('all');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  
  const handleAdd = async (stickerInput: StickerInput) => {
    await addSticker(stickerInput);
    setIsAddDialogOpen(false);
  };
  
  const handleEdit = (sticker: Sticker) => {
    setCurrentSticker(sticker);
    setIsEditDialogOpen(true);
  };
  
  const handleUpdate = async (stickerInput: StickerInput) => {
    if (currentSticker) {
      await updateSticker({
        ...currentSticker,
        name: stickerInput.name,
        category: stickerInput.category,
        imageUrl: stickerInput.imageUrl,
        favorite: stickerInput.favorite || false
      });
      setIsEditDialogOpen(false);
      setCurrentSticker(null);
    }
  };
  
  const handleDelete = async (id: string) => {
    await deleteSticker(id);
  };
  
  const handleUse = async (sticker: Sticker) => {
    // Mark as used
    await markStickerAsUsed(sticker.id);
    
    // Open WhatsApp with sticker image
    // This is a placeholder since WhatsApp Web doesn't directly support sticker sharing via URL
    // But we can open a share dialog or just inform the user the sticker is ready to use
    window.open(`https://web.whatsapp.com/`, '_blank');
    alert('WhatsApp web has been opened. You can now use your sticker from your sticker collection.');
  };
  
  const handleToggleFavorite = async (id: string, favorite: boolean) => {
    await toggleFavoriteSticker(id, favorite);
  };
  
  // Filter stickers based on search term, tab and category
  const filteredStickers = stickers.filter(sticker => {
    const matchesSearch = sticker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          sticker.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = 
      (currentTab === 'all') ||
      (currentTab === 'favorites' && sticker.favorite) ||
      (currentTab === 'recent' && sticker.lastUsed);
    
    const matchesCategory = !filterCategory || sticker.category === filterCategory;
    
    return matchesSearch && matchesTab && matchesCategory;
  });
  
  // Sort stickers
  const sortedStickers = [...filteredStickers].sort((a, b) => {
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
  const uniqueCategories = Array.from(new Set(stickers.map(sticker => sticker.category)));
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between gap-2 mb-4">
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full md:w-auto bg-whatsapp hover:bg-whatsapp-dark">
              <PlusCircle className="h-4 w-4 mr-2" />
              Create Sticker
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New WhatsApp Sticker</DialogTitle>
              <DialogDescription>
                Create a custom sticker for WhatsApp
              </DialogDescription>
            </DialogHeader>
            <StickerEditor 
              onSave={handleAdd} 
              onCancel={() => setIsAddDialogOpen(false)} 
            />
          </DialogContent>
        </Dialog>
        
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative w-full">
            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search stickers..."
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
            <StickerIcon className="h-4 w-4 mr-2" />
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
              <p>Loading stickers...</p>
            </div>
          ) : sortedStickers.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {sortedStickers.map(sticker => (
                <StickerCard
                  key={sticker.id}
                  sticker={sticker}
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
                  ? "No stickers match your search" 
                  : filterCategory 
                    ? `No ${filterCategory} stickers found` 
                    : "No stickers yet"}
              </p>
              <Button 
                onClick={() => setIsAddDialogOpen(true)}
                className="bg-whatsapp hover:bg-whatsapp-dark"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Your First Sticker
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="favorites" className="mt-0">
          {sortedStickers.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {sortedStickers.map(sticker => (
                <StickerCard
                  key={sticker.id}
                  sticker={sticker}
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
                No favorite stickers yet
              </p>
              <Button 
                onClick={() => setCurrentTab('all')}
                variant="outline"
              >
                View All Stickers
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="recent" className="mt-0">
          {sortedStickers.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {sortedStickers.map(sticker => (
                <StickerCard
                  key={sticker.id}
                  sticker={sticker}
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
                No recently used stickers
              </p>
              <Button 
                onClick={() => setCurrentTab('all')}
                variant="outline"
              >
                View All Stickers
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit WhatsApp Sticker</DialogTitle>
            <DialogDescription>
              Update your saved sticker
            </DialogDescription>
          </DialogHeader>
          {currentSticker && (
            <StickerEditor 
              onSave={handleUpdate} 
              initialData={currentSticker}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setCurrentSticker(null);
              }} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StickerCreator; 