import { AspectRatio, ImageQuality } from './types';

export const DEFAULT_ASPECT_RATIO = AspectRatio.SQUARE;
export const DEFAULT_QUALITY = ImageQuality.STANDARD;

export const MODEL_STANDARD = 'gemini-2.5-flash-image';
export const MODEL_HIGH_RES = 'gemini-3-pro-image-preview';

export const MAX_FILE_SIZE_MB = 10;
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
