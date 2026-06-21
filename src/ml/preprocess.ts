/**
 * Image Preprocessing Module
 * 
 * Prepares camera frames for YOLO inference.
 * In production, use OpenCV.js for optimized processing.
 */

export interface PreprocessedFrame {
  data: Float32Array;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
}

/**
 * Convert image to grayscale, apply threshold, normalize.
 */
export function preprocessFrame(
  imageData: ImageData,
  targetSize: number = 640
): PreprocessedFrame {
  const { width, height, data } = imageData;

  // Convert to grayscale
  const gray = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    gray[i] = (0.299 * r + 0.587 * g + 0.114 * b) / 255.0;
  }

  // Stub: resize to targetSize x targetSize
  // In production, use canvas or OpenCV.js resize
  return {
    data: gray,
    width: targetSize,
    height: targetSize,
    originalWidth: width,
    originalHeight: height,
  };
}

/**
 * Apply adaptive thresholding for better Braille dot contrast.
 */
export function applyThreshold(gray: Float32Array, threshold: number = 0.5): Float32Array {
  return gray.map((v) => (v > threshold ? 1.0 : 0.0));
}

/**
 * Adjust preprocessing based on detected surface type.
 */
export function adjustForSurface(
  frame: PreprocessedFrame,
  surface: "paper" | "plastic" | "medicine" | "elevator"
): PreprocessedFrame {
  // Each surface has different contrast/threshold needs
  const thresholds = { paper: 0.5, plastic: 0.45, medicine: 0.55, elevator: 0.4 };
  const t = thresholds[surface];
  return { ...frame, data: applyThreshold(frame.data, t) };
}
