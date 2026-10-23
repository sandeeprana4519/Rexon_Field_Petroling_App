import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  UploadTask
} from 'firebase/storage';
import { storage, auth, isFirebaseConfigured } from '../lib/firebase';
import { PatrolEvidenceItem, EvidenceMediaType } from '../types';

export const MAX_PHOTO_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB
export const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif'
];

export const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-m4v'
];

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  mediaType: EvidenceMediaType;
}

/**
 * Validates file MIME type and size limits before starting upload.
 */
export const validateEvidenceFile = (file: File): FileValidationResult => {
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type) || file.type.startsWith('image/');
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type) || file.type.startsWith('video/');

  if (!isImage && !isVideo) {
    return {
      isValid: false,
      error: `Unsupported file format (${file.type || 'unknown'}). Allowed: JPG, PNG, WEBP, MP4, WEBM, MOV.`,
      mediaType: 'photo'
    };
  }

  const mediaType: EvidenceMediaType = isVideo ? 'video' : 'photo';

  if (isImage && file.size > MAX_PHOTO_SIZE_BYTES) {
    return {
      isValid: false,
      error: `Photo exceeds the 15 MB maximum size limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`,
      mediaType
    };
  }

  if (isVideo && file.size > MAX_VIDEO_SIZE_BYTES) {
    return {
      isValid: false,
      error: `Video exceeds the 50 MB maximum size limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`,
      mediaType
    };
  }

  return { isValid: true, mediaType };
};

export interface UploadEvidenceParams {
  file: File;
  companyId: string;
  siteId: string;
  reportId: string;
  evidenceId: string;
  uploaderUid?: string;
  caption?: string;
  locationName?: string;
  checkpointId?: string;
  onProgress?: (percent: number) => void;
}

export interface UploadEvidenceResult {
  evidenceItem: PatrolEvidenceItem;
  downloadUrl: string;
  storagePath: string;
}

export interface StorageAvailabilityStatus {
  isAvailable: boolean;
  bucketName: string;
  message: string;
}

/**
 * Checks whether Firebase Cloud Storage bucket is provisioned and responsive.
 * Returns honest status without guessing or generating fake success.
 */
export const checkFirebaseStorageAvailability = async (): Promise<StorageAvailabilityStatus> => {
  const bucketName = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim() || '';
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY?.trim() || '';

  if (!bucketName || !apiKey || !isFirebaseConfigured || !storage) {
    return {
      isAvailable: false,
      bucketName: bucketName || 'Unconfigured',
      message: 'Photo/video upload is currently unavailable. Firebase Storage setup is required.'
    };
  }

  try {
    const res = await fetch(`https://firebasestorage.googleapis.com/v0/b/${bucketName}/o?key=${apiKey}`, {
      method: 'GET'
    });

    if (res.status === 404) {
      return {
        isAvailable: false,
        bucketName,
        message: 'Photo/video upload is currently unavailable. Firebase Storage setup is required.'
      };
    }

    if (res.ok || res.status === 403) {
      return {
        isAvailable: true,
        bucketName,
        message: 'Firebase Storage is active.'
      };
    }

    return {
      isAvailable: false,
      bucketName,
      message: 'Photo/video upload is currently unavailable. Firebase Storage setup is required.'
    };
  } catch (err) {
    return {
      isAvailable: false,
      bucketName,
      message: 'Photo/video upload is currently unavailable. Firebase Storage setup is required.'
    };
  }
};

/**
 * Sanitizes file names to ensure storage path safety across cloud filesystems
 */
const sanitizeFileName = (name: string): string => {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase();
};

/**
 * Uploads a patrol photo or video evidence file to Firebase Cloud Storage.
 * Generates an immutable, structured storage path:
 * `companies/{companyId}/sites/{siteId}/reports/{reportId}/evidence/{evidenceId}_{filename}`
 */
export const uploadPatrolEvidence = (
  params: UploadEvidenceParams
): { promise: Promise<UploadEvidenceResult>; cancel: () => void } => {
  const {
    file,
    companyId,
    siteId,
    reportId,
    evidenceId,
    uploaderUid,
    caption,
    locationName,
    checkpointId,
    onProgress
  } = params;

  // 1. Client-side pre-upload validation
  const validation = validateEvidenceFile(file);
  if (!validation.isValid) {
    return {
      promise: Promise.reject(new Error(validation.error || 'Invalid file')),
      cancel: () => {}
    };
  }

  // 2. Format sanitized path
  const sanitizedName = sanitizeFileName(file.name || `evidence_${Date.now()}`);
  const storagePath = `companies/${companyId}/sites/${siteId}/reports/${reportId}/evidence/${evidenceId}_${sanitizedName}`;

  // 3. Strict Check: If Firebase Storage is not configured or initialized, fail honestly
  if (!storage || !isFirebaseConfigured) {
    return {
      promise: Promise.reject(
        new Error('Photo/video upload is currently unavailable. Firebase Storage setup is required.')
      ),
      cancel: () => {}
    };
  }

  // 4. Real Firebase Cloud Storage upload
  const activeStorage = storage;
  let uploadTask: UploadTask | null = null;

  const promise = new Promise<UploadEvidenceResult>((resolve, reject) => {
    try {
      const storageRef = ref(activeStorage, storagePath);

      const metadata = {
        contentType: file.type || (validation.mediaType === 'video' ? 'video/mp4' : 'image/jpeg'),
        customMetadata: {
          companyId,
          siteId,
          reportId,
          evidenceId,
          uploaderUid: auth?.currentUser?.uid || uploaderUid || 'unknown',
          mediaType: validation.mediaType,
          originalName: file.name,
          uploadedAt: new Date().toISOString()
        }
      };

      uploadTask = uploadBytesResumable(storageRef, file, metadata);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          if (snapshot.totalBytes > 0) {
            const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            onProgress?.(percent);
          }
        },
        (error: any) => {
          console.error('[Firebase Storage] Upload error:', error);
          let friendlyMsg = error.message || 'File upload failed.';

          if (error.code === 'storage/unauthorized') {
            friendlyMsg = 'Permission denied by Firebase Storage security rules.';
          } else if (error.code === 'storage/retry-limit-exceeded') {
            friendlyMsg = 'Network timeout while uploading evidence. Please check connection and retry.';
          } else if (error.code === 'storage/canceled') {
            friendlyMsg = 'Upload cancelled by user.';
          } else if (error.code === 'storage/bucket-not-found' || error.message?.includes('404')) {
            friendlyMsg = 'Photo/video upload is currently unavailable. Firebase Storage setup is required.';
          }

          reject(new Error(friendlyMsg));
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask!.snapshot.ref);

            const evidenceItem: PatrolEvidenceItem = {
              id: evidenceId,
              storagePath,
              downloadUrl,
              originalFileName: file.name,
              contentType: file.type || (validation.mediaType === 'video' ? 'video/mp4' : 'image/jpeg'),
              fileSizeBytes: file.size,
              uploadedAt: new Date().toISOString(),
              uploaderUid: auth?.currentUser?.uid || uploaderUid || 'officer',
              companyId,
              siteId,
              reportId,
              mediaType: validation.mediaType,
              caption: caption || '',
              locationName: locationName || '',
              checkpointId
            };

            resolve({
              evidenceItem,
              downloadUrl,
              storagePath
            });
          } catch (urlErr: any) {
            console.error('[Firebase Storage] Failed to get download URL:', urlErr);
            reject(urlErr);
          }
        }
      );
    } catch (initErr: any) {
      console.error('[Firebase Storage] Upload init failed:', initErr);
      reject(initErr);
    }
  });

  return {
    promise,
    cancel: () => {
      if (uploadTask) {
        uploadTask.cancel();
      }
    }
  };
};

/**
 * Retrieves a secured download URL for a storage path
 */
export const getEvidenceDownloadUrl = async (storagePath: string): Promise<string> => {
  if (!storage || !isFirebaseConfigured) {
    throw new Error('Firebase Storage is not configured.');
  }
  const storageRef = ref(storage, storagePath);
  return await getDownloadURL(storageRef);
};

/**
 * Deletes an evidence file from Storage (Admins only)
 */
export const deleteEvidenceFile = async (storagePath: string): Promise<void> => {
  if (!storage || !isFirebaseConfigured) {
    throw new Error('Firebase Storage is not configured.');
  }
  const storageRef = ref(storage, storagePath);
  await deleteObject(storageRef);
};
