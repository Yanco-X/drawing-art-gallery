/** Mirrors MAX_UPLOAD_MB in backend/app/config.py. */
export const MAX_UPLOAD_MB = 60;

/** Advisory only: the API decides what is an image by decoding it. */
export const imageFileProblem = (file: File): string | null => {
  if (!file.type.startsWith('image/')) return 'That file is not an image.';
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
    return 'Images must be under ' + MAX_UPLOAD_MB + ' MB.';
  }
  return null;
};

export const describeBytes = (bytes: number): string =>
  (bytes / 1024 / 1024).toFixed(1) + ' MB';

export const describeFileSize = (file: File): string => describeBytes(file.size);
