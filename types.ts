export enum AspectRatio {
  SQUARE = '1:1',
  LANDSCAPE = '16:9',
  PORTRAIT = '9:16',
  STANDARD_LANDSCAPE = '4:3',
  STANDARD_PORTRAIT = '3:4',
}

export enum ImageQuality {
  STANDARD = 'Standard',
  HIGH = 'High (2K)',
}

export interface UploadedImage {
  file: File;
  previewUrl: string;
  base64: string;
  mimeType: string;
}

export interface GenerationConfig {
  aspectRatio: AspectRatio;
  quality: ImageQuality;
}
