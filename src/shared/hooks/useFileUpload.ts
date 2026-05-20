'use client';

import { useState, useCallback } from 'react';
import { uploadToAzure } from '@/shared/services/blob-storage.service';

interface UseFileUploadOptions {
  containerName?: string;
  maxSizeBytes?: number;
  allowedTypes?: string[];
}

interface UseFileUploadReturn {
  isUploading: boolean;
  uploadError: string | null;
  uploadFile: (file: File) => Promise<string | null>;
  clearError: () => void;
}

export function useFileUpload(options: UseFileUploadOptions = {}): UseFileUploadReturn {
  const {
    containerName,
    maxSizeBytes = 5 * 1024 * 1024, // 5 MB default
    allowedTypes,
  } = options;

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const uploadFile = useCallback(
    async (file: File): Promise<string | null> => {
      setUploadError(null);

      if (file.size > maxSizeBytes) {
        const mb = (maxSizeBytes / (1024 * 1024)).toFixed(0);
        setUploadError(`El archivo no debe superar ${mb} MB`);
        return null;
      }

      if (allowedTypes && !allowedTypes.includes(file.type)) {
        setUploadError('Tipo de archivo no permitido');
        return null;
      }

      setIsUploading(true);
      try {
        const publicUrl = await uploadToAzure(file, containerName);
        return publicUrl;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Error al subir el archivo';
        setUploadError(message);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [containerName, maxSizeBytes, allowedTypes],
  );

  const clearError = useCallback(() => setUploadError(null), []);

  return { isUploading, uploadError, uploadFile, clearError };
}
