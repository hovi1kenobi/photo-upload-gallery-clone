// Cosmic media object interface
export interface CosmicMedia {
  id: string;
  name: string;
  original_name: string;
  size: number;
  type: string;
  bucket: string;
  url: string;
  imgix_url: string;
  created_at: string;
  modified_at: string;
  folder?: string;
}

// API response types
export interface CosmicMediaResponse {
  media: CosmicMedia[];
  total: number;
  limit: number;
  skip: number;
}

export interface CosmicMediaUploadResponse {
  media: CosmicMedia;
}

// Access verification response type
export interface AccessResponse {
  success: boolean;
  message: string;
}

// Component prop types
export interface PhotoGridProps {
  photos: CosmicMedia[];
  onPhotoClick: (index: number) => void;
}

export interface PhotoModalProps {
  photos: CosmicMedia[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  onThumbnailClick: (index: number) => void;
}

export interface PhotoUploadProps {
  onUploadSuccess: (photo: CosmicMedia) => void;
}

export interface AccessFormProps {
  onAccessGranted: () => void;
}

// Upload state types
export interface UploadFile {
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  id: string;
}

// Type guards for runtime validation
export function isCosmicMedia(obj: any): obj is CosmicMedia {
  return obj && typeof obj.id === 'string' && typeof obj.url === 'string';
}

export function isCosmicMediaArray(arr: any): arr is CosmicMedia[] {
  return Array.isArray(arr) && arr.every(isCosmicMedia);
}