"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface UseCameraResult {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isStreaming: boolean;
  hasPermission: boolean | null;
  error: string | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  captureImage: () => string | null;
}

export function useCamera(): UseCameraResult {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);

      // Request camera access with rear camera preference (for mobile)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Rear camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      streamRef.current = stream;
      setHasPermission(true);

      // Attach to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsStreaming(true);
      }
    } catch (err) {
      console.error("Camera error:", err);
      setHasPermission(false);

      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          setError("Camera access denied. Please enable camera permissions.");
        } else if (err.name === "NotFoundError") {
          setError("No camera found on this device.");
        } else {
          setError(`Camera error: ${err.message}`);
        }
      } else {
        setError("Failed to access camera");
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  const captureImage = useCallback((): string | null => {
    if (!videoRef.current || !isStreaming) {
      return null;
    }

    const video = videoRef.current;
    const canvas = document.createElement("canvas");

    // Use video's actual dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return null;
    }

    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0);

    // Convert to base64 JPEG (0.8 quality for smaller size)
    return canvas.toDataURL("image/jpeg", 0.8);
  }, [isStreaming]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    isStreaming,
    hasPermission,
    error,
    startCamera,
    stopCamera,
    captureImage,
  };
}
