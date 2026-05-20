import { apiFetch } from '@/shared/lib/api-client';

interface PresignedUrlRequest {
  fileName: string;
  mimeType: string;
  containerName?: string;
  expiresInMinutes?: number;
}

interface PresignedUrlResponse {
  sasUrl: string;
  publicUrl: string;
  blobName: string;
  expiresAt: string;
}

/**
 * Requests a SAS URL from the backend and uploads the file binary directly to Azure.
 * Returns the permanent publicUrl to persist in the database.
 */
export async function uploadToAzure(
  file: File,
  containerName?: string,
): Promise<string> {
  const { sasUrl, publicUrl } = await apiFetch<PresignedUrlResponse>(
    '/api/blob-storage/presigned-url',
    {
      method: 'POST',
      body: {
        fileName: file.name,
        mimeType: file.type,
        ...(containerName ? { containerName } : {}),
      } satisfies PresignedUrlRequest,
    },
  );

  // Upload binary directly to Azure — no auth header, no JSON, BlockBlob required
  const uploadResponse = await fetch(sasUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type,
      'x-ms-blob-type': 'BlockBlob',
    },
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error(`Error al subir el archivo: ${uploadResponse.status}`);
  }

  return publicUrl;
}
