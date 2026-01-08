import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Plus, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { LazyImage } from '@/components/LazyImage';
import { compressImage, generateGalleryAltText } from '@/lib/imageUtils';
interface GalleryUploadProps {
  userId: string;
  images: string[];
  onImagesChange: (images: string[]) => void;
  isEditing: boolean;
  maxImages?: number;
  businessName?: string;
}

export const GalleryUpload = ({ 
  userId, 
  images, 
  onImagesChange, 
  isEditing,
  maxImages = 10,
  businessName,
}: GalleryUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > maxImages) {
      toast({
        title: 'Limită depășită',
        description: `Poți adăuga maxim ${maxImages} imagini în galerie.`,
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    const newImages: string[] = [];

    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          toast({
            title: 'Fișier invalid',
            description: 'Poți încărca doar imagini.',
            variant: 'destructive',
          });
          continue;
        }

        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: 'Fișier prea mare',
            description: 'Imaginile trebuie să fie sub 10MB.',
            variant: 'destructive',
          });
          continue;
        }

        // Compress image before upload
        const compressedFile = await compressImage(file, {
          maxWidth: 1920,
          maxHeight: 1080,
          quality: 0.85,
        });

        const fileExt = compressedFile.type === 'image/jpeg' ? 'jpg' : file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('garage-gallery')
          .upload(filePath, compressedFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('garage-gallery')
          .getPublicUrl(filePath);

        newImages.push(publicUrl);
      }

      if (newImages.length > 0) {
        onImagesChange([...images, ...newImages]);
        toast({
          title: 'Succes',
          description: `${newImages.length} ${newImages.length === 1 ? 'imagine încărcată' : 'imagini încărcate'}.`,
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Eroare',
        description: 'Nu am putut încărca imaginea.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (index: number) => {
    const imageUrl = images[index];
    setDeletingIndex(index);

    try {
      // Extract file path from URL
      const urlParts = imageUrl.split('/garage-gallery/');
      if (urlParts.length > 1) {
        const filePath = decodeURIComponent(urlParts[1]);
        await supabase.storage.from('garage-gallery').remove([filePath]);
      }

      const newImages = images.filter((_, i) => i !== index);
      onImagesChange(newImages);

      toast({
        title: 'Imaginea a fost ștearsă',
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Eroare',
        description: 'Nu am putut șterge imaginea.',
        variant: 'destructive',
      });
    } finally {
      setDeletingIndex(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Galerie Foto
        </h3>
        <span className="text-sm text-muted-foreground">
          {images.length}/{maxImages} imagini
        </span>
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {images.map((url, index) => (
          <div 
            key={index} 
            className="relative aspect-square rounded-lg overflow-hidden border border-border group"
          >
            <LazyImage
              src={url}
              alt={generateGalleryAltText(index, businessName)}
              className="w-full h-full object-cover"
              containerClassName="w-full h-full"
            />
            {isEditing && (
              <button
                type="button"
                onClick={() => handleDelete(index)}
                disabled={deletingIndex === index}
                className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
              >
                {deletingIndex === index ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
        ))}

        {/* Upload Button */}
        {isEditing && images.length < maxImages && (
          <label className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 flex flex-col items-center justify-center cursor-pointer transition-colors bg-muted/30 hover:bg-muted/50">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleUpload}
              className="hidden"
              disabled={uploading}
            />
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : (
              <>
                <Plus className="h-8 w-8 text-muted-foreground mb-1" />
                <span className="text-xs text-muted-foreground">Adaugă</span>
              </>
            )}
          </label>
        )}
      </div>

      {images.length === 0 && !isEditing && (
        <p className="text-center text-muted-foreground py-8">
          Nu există imagini în galerie.
        </p>
      )}
    </div>
  );
};
