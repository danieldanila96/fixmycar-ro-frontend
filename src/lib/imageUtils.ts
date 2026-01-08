/**
 * Image utilities for compression and optimization
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: 'image/jpeg' | 'image/webp' | 'image/png';
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.85,
  mimeType: 'image/jpeg',
};

/**
 * Compresses an image file before upload
 * @param file - The original image file
 * @param options - Compression options
 * @returns A promise that resolves to the compressed file
 */
export const compressImage = (
  file: File,
  options: CompressionOptions = {}
): Promise<File> => {
  const { maxWidth, maxHeight, quality, mimeType } = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  return new Promise((resolve, reject) => {
    // Skip compression for small files (< 500KB) or non-image files
    if (file.size < 500 * 1024 || !file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    // Skip compression for GIFs (to preserve animation)
    if (file.type === 'image/gif') {
      resolve(file);
      return;
    }

    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = () => {
      URL.revokeObjectURL(img.src);

      let { width, height } = img;

      // Calculate new dimensions while maintaining aspect ratio
      if (width > maxWidth! || height > maxHeight!) {
        const ratio = Math.min(maxWidth! / width, maxHeight! / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;

      // Draw image with white background (for transparent PNGs converted to JPEG)
      if (mimeType === 'image/jpeg') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Compression failed'));
            return;
          }

          // If compressed file is larger than original, return original
          if (blob.size >= file.size) {
            resolve(file);
            return;
          }

          const compressedFile = new File([blob], file.name, {
            type: mimeType,
            lastModified: Date.now(),
          });

          resolve(compressedFile);
        },
        mimeType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
};

/**
 * Compresses multiple images in parallel
 */
export const compressImages = async (
  files: File[],
  options: CompressionOptions = {}
): Promise<File[]> => {
  return Promise.all(files.map((file) => compressImage(file, options)));
};

/**
 * Generates a descriptive alt text for gallery images
 */
export const generateGalleryAltText = (
  index: number,
  businessName?: string
): string => {
  const base = businessName
    ? `Imagine galerie ${businessName}`
    : 'Imagine galerie service auto';
  return `${base} - fotografie ${index + 1}`;
};

/**
 * Generates alt text for job/work images
 */
export const generateJobImageAltText = (
  index: number,
  carInfo?: string
): string => {
  const base = carInfo
    ? `Imagine lucrare ${carInfo}`
    : 'Imagine lucrare service';
  return `${base} - fotografie ${index + 1}`;
};
