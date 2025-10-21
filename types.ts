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

// Book recommendation types
export interface BookAnalysis {
  photo: CosmicMedia;
  books_identified: string[];
  genres: string[];
  themes: string[];
  reader_profile: string;
  raw_analysis: string;
}

export interface BookRecommendation {
  title: string;
  author: string;
  genre: string;
  reasoning: string;
  isbn: string;
  amazonUrl: string;
}

export interface RecommendationResponse {
  success: boolean;
  analysis?: BookAnalysis;
  recommendations?: BookRecommendation[];
  error?: string;
}

// Component prop types
export interface BookUploadProps {
  onAnalysisComplete: (analysis: BookAnalysis | null, recommendations: BookRecommendation[]) => void;
}

// Changed: Added timestamp prop to show when analysis was performed
export interface RecommendationsListProps {
  analysis: BookAnalysis | null;
  recommendations: BookRecommendation[];
  timestamp?: string;
}

// Photo gallery types - Changed: Added missing type definitions
export interface AccessResponse {
  success: boolean;
  message: string;
}

export interface AccessFormProps {
  onAccessGranted: () => void;
}

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

// Cosmic AI response types
export interface CosmicAIAnalysisResponse {
  text: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface CosmicAIGenerationResponse {
  text: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}