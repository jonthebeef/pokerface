/**
 * Resize and compress an image for API efficiency
 * GPT-4o with low detail mode works best with smaller images
 */

const MAX_DIMENSION = 512; // Keep images small for low-detail mode
const JPEG_QUALITY = 0.7;

export async function preprocessImage(base64Image: string): Promise<string> {
  // If running on server, just return the image as-is
  // Preprocessing happens client-side
  if (typeof window === "undefined") {
    return base64Image;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions maintaining aspect ratio
      let { width, height } = img;

      if (width > height && width > MAX_DIMENSION) {
        height = (height / width) * MAX_DIMENSION;
        width = MAX_DIMENSION;
      } else if (height > MAX_DIMENSION) {
        width = (width / height) * MAX_DIMENSION;
        height = MAX_DIMENSION;
      }

      // Create canvas and draw resized image
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Convert to JPEG with compression
      const resized = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
      resolve(resized);
    };

    img.onerror = () => reject(new Error("Failed to load image"));

    // Handle both with and without data URL prefix
    if (base64Image.startsWith("data:")) {
      img.src = base64Image;
    } else {
      img.src = `data:image/jpeg;base64,${base64Image}`;
    }
  });
}

/**
 * Extract base64 data from data URL
 */
export function extractBase64(dataUrl: string): string {
  return dataUrl.replace(/^data:image\/\w+;base64,/, "");
}
