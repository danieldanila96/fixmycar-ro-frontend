import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MultiImageUploadProps {
  bucket: string;
  folder: string;
  onUpload: (urls: string[]) => void;
  currentImages?: string[];
  maxImages?: number;
  maxSizeMB?: number;
  className?: string;
}

export const MultiImageUpload = ({
  bucket,
  folder,
  onUpload,
  currentImages = [],
  maxImages = 5,
  maxSizeMB = 5,
  className,
}: MultiImageUploadProps) => {
  const [images, setImages] = useState<string[]>(currentImages);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = maxImages - images.length;
    if (files.length > remainingSlots) {
      toast({
        title: 'Prea multe imagini',
        description: `Poți încărca maximum ${maxImages} imagini. Mai ai ${remainingSlots} locuri disponibile.`,
        variant: 'destructive',
      });
      return;
    }

    // Validate all files
    for (const file of files) {
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast({
          title: 'Fișier prea mare',
          description: `${file.name} depășește ${maxSizeMB}MB`,
          variant: 'destructive',
        });
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Tip invalid',
          description: `${file.name} nu este o imagine validă`,
          variant: 'destructive',
        });
        return;
      }
    }

    setIsUploading(true);

    try {
      const uploadedUrls: string[] = [];

      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(fileName, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      }

      const newImages = [...images, ...uploadedUrls];
      setImages(newImages);
      onUpload(newImages);

      toast({
        title: 'Imagini încărcate',
        description: `${uploadedUrls.length} ${uploadedUrls.length === 1 ? 'imagine încărcată' : 'imagini încărcate'} cu succes.`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Eroare la încărcare',
        description: 'Nu am putut încărca imaginile. Încearcă din nou.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    onUpload(newImages);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {images.map((url, index) => (
            <div key={index} className="relative group aspect-video">
              <img
                src={url}
                alt={`Upload ${index + 1}`}
                className="w-full h-full object-cover rounded-lg border"
              />
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute top-2 right-2 w-7 h-7 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      {images.length < maxImages && (
        <div
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={cn(
            'border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/50',
            isUploading && 'pointer-events-none opacity-50'
          )}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Se încarcă...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Click pentru a adăuga imagini ({images.length}/{maxImages})
              </p>
              <p className="text-xs text-muted-foreground">
                Max {maxSizeMB}MB per imagine
              </p>
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};
