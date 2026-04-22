import { getApiBase } from '../api/client';

export interface PresignResponse {
  uploadUrl: string;
  publicUrl: string;
  key: string;
}
export async function uploadFileToR2(file: File, folder: string = 'uploads'): Promise<string> {
  const apiBase = getApiBase() || 'http://localhost:5000';
  
  // Clean the filename and create a unique key
  const safeFilename = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
  const key = `${folder}/${Date.now()}-${safeFilename}`;

  // 1. Get the presigned URL from our backend
  const presignResponse = await fetch(`${apiBase}/api/storage/presign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      key,
      contentType: file.type || 'application/octet-stream',
      expiresIn: 900 // 15 minutes
    }),
  });

  if (!presignResponse.ok) {
    const errText = await presignResponse.text();
    throw new Error(`Failed to get presigned URL: ${errText}`);
  }

  const { uploadUrl, publicUrl } = await presignResponse.json() as PresignResponse;

  // 2. Upload the file to R2 directly using the presigned URL (PUT request with binary body)
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
    },
    body: file, // Automatically sent in binary format
  });

  if (!uploadResponse.ok) {
    throw new Error(`Failed to upload file to R2. Status: ${uploadResponse.status}`);
  }

  // 3. Return the public URL so it can be passed in req.body to your other APIs
  return publicUrl;
}

/**
 * Deletes a file from the Cloudflare R2 bucket.
 * 
 * @param keyOrUrl The file's key (e.g. 'uploads/file.pdf') or the full public URL.
 * @returns true if the deletion was successful
 */
export async function deleteFileFromR2(keyOrUrl: string): Promise<boolean> {
  const apiBase = getApiBase() || 'http://localhost:5000';
  
  // Extract key if a full public URL was passed
  let key = keyOrUrl;
  if (key.startsWith('http')) {
    try {
      const url = new URL(key);
      // Remove the leading '/' from the pathname to get the correct R2 key
      key = url.pathname.substring(1);
    } catch (e) {
      // If parsing fails, fall back to the original string
    }
  }

  const response = await fetch(`${apiBase}/api/storage/file`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ key }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to delete file from R2: ${errText}`);
  }

  return true;
}
