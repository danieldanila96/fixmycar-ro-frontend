import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  bucket: 'job-images' | 'avatars';
  folder: string;
  onUpload: (url: string) => void;
  currentImage?: string | null;
  className?: string;
  maxSizeMB?: number;
  accept?: string;
  variant?: 'avatar' | 'gallery';
}

export const ImageUpload = ({
  bucket,
  folder,
  onUpload,
  currentImage,
  className,
  maxSizeMB = 5,
  accept = 'image/*',
  variant = 'gallery',
}: ImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast({
        title: 'Fișier prea mare',
        description: `Dimensiunea maximă este ${maxSizeMB}MB`,
        variant: 'destructive',
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Tip de fișier invalid',
        description: 'Doar imagini sunt permise',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      setPreview(publicUrl);
      onUpload(publicUrl);

      toast({
        title: 'Imagine încărcată',
        description: 'Imaginea a fost încărcată cu succes.',
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Eroare la încărcare',
        description: 'Nu am putut încărca imaginea. Încearcă din nou.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onUpload('');
  };

  if (variant === 'avatar') {
    return (
      <div className={cn('flex flex-col items-center gap-3', className)}>
        <div className="relative">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-muted border-2 border-border">
            {preview ? (
              <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
          </div>
          {preview && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-1 -right-1 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/90"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Se încarcă...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              {preview ? 'Schimbă poza' : 'Încarcă poza'}
            </>
          )}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {preview ? (
        <div className="relative inline-block">
          <img
            src={preview}
            alt="Previzualizare"
            className="max-w-full h-auto max-h-48 rounded-lg border"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 w-8 h-8 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/90 shadow-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={cn(
            'border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/50',
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
              <Upload className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Click pentru a încărca o imagine
              </p>
              <p className="text-xs text-muted-foreground">
                Max {maxSizeMB}MB • JPG, PNG, GIF
              </p>
            </div>
          )}
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};
