"use client";

import { useState } from "react";
import { useCamera } from "@/hooks/useCamera";
import { Card, DetectionResult } from "@/lib/poker/types";
import { preprocessImage } from "@/lib/vision/imagePreprocessing";

interface CameraCaptureProps {
  onCardsDetected: (cards: Card[]) => void;
  onClose: () => void;
}

export function CameraCapture({ onCardsDetected, onClose }: CameraCaptureProps) {
  const { videoRef, isStreaming, hasPermission, error, startCamera, stopCamera, captureImage } = useCamera();
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);

  const handleCapture = async () => {
    const rawImage = captureImage();
    if (!rawImage) return;

    setIsDetecting(true);
    setDetectionResult(null);

    try {
      // Preprocess image (resize for faster API calls)
      const image = await preprocessImage(rawImage);

      const response = await fetch("/api/detect-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      });

      const result: DetectionResult = await response.json();
      setDetectionResult(result);

      if (result.cards.length > 0) {
        onCardsDetected(result.cards);
      }
    } catch (err) {
      setDetectionResult({
        cards: [],
        confidence: 0,
        error: "Failed to detect cards. Try again.",
      });
    } finally {
      setIsDetecting(false);
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header - fixed height */}
      <div className="flex-shrink-0 flex justify-between items-center p-3 bg-black safe-area-top">
        <h2 className="text-white font-bold">Scan Cards</h2>
        <button
          onClick={handleClose}
          className="text-white hover:text-gray-300 px-3 py-1"
        >
          Close
        </button>
      </div>

      {/* Camera view - takes remaining space */}
      <div className="flex-1 relative min-h-0 overflow-hidden">
        {!isStreaming && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={startCamera}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-500"
            >
              Start Camera
            </button>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 text-center max-w-sm">
              <div className="text-red-200 font-medium">{error}</div>
              <button
                onClick={handleClose}
                className="mt-4 bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Use Manual Selection
              </button>
            </div>
          </div>
        )}

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />

        {/* Scanning overlay */}
        {isStreaming && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-4 border-4 border-white/30 rounded-lg" />
            <div className="absolute bottom-4 left-0 right-0 text-center">
              <div className="text-white text-sm bg-black/50 inline-block px-4 py-2 rounded">
                Position cards in frame
              </div>
            </div>
          </div>
        )}

        {/* Detection result overlay */}
        {detectionResult && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className={`rounded-lg p-3 ${
              detectionResult.cards.length > 0
                ? "bg-green-900/80 border border-green-600"
                : "bg-red-900/80 border border-red-600"
            }`}>
              {detectionResult.cards.length > 0 ? (
                <div className="text-green-200">
                  Detected {detectionResult.cards.length} card(s)!
                </div>
              ) : (
                <div className="text-red-200">
                  {detectionResult.error || "No cards detected"}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Capture button - always visible at bottom */}
      <div className="flex-shrink-0 p-4 pb-8 bg-black safe-area-bottom">
        {!isStreaming && !error ? (
          <button
            onClick={startCamera}
            className="w-full py-4 rounded-xl font-bold text-lg bg-blue-600 text-white"
          >
            Start Camera
          </button>
        ) : isStreaming ? (
          <button
            onClick={handleCapture}
            disabled={isDetecting}
            className={`
              w-full py-4 rounded-xl font-bold text-lg
              ${isDetecting
                ? "bg-gray-600 text-gray-400"
                : "bg-white text-black active:bg-gray-200"
              }
            `}
          >
            {isDetecting ? "Detecting..." : "Capture"}
          </button>
        ) : (
          <button
            onClick={handleClose}
            className="w-full py-4 rounded-xl font-bold text-lg bg-gray-700 text-white"
          >
            Use Manual Selection
          </button>
        )}
      </div>
    </div>
  );
}
