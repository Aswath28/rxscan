'use client';

import { useState, useRef, useCallback } from 'react';

// ============================================================
// COMPONENT: Camera Viewfinder (mobile)
// ============================================================

function CameraCapture({ onCapture, onClose }: {
  onCapture: (file: File) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setCameraReady(true);
      }
    } catch {
      setError('Camera access denied. Please allow camera access or use file upload instead.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const takePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) {
        // BUG #6 FIX: Use the blob's actual type instead of hardcoding image/jpeg.
        // Android Chrome sometimes produces WebP even when JPEG is requested.
        const ext = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg';
        const file = new File([blob], `prescription.${ext}`, { type: blob.type });
        stopCamera();
        onCapture(file);
      }
    }, 'image/jpeg', 0.9);
  }, [stopCamera, onCapture]);

  // Start camera on mount
  useState(() => {
    startCamera();
  });

  if (error) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center px-6 text-center">
        <div className="text-4xl mb-4">📷</div>
        <p className="text-white text-sm mb-6">{error}</p>
        <button
          onClick={onClose}
          className="bg-white text-slate-900 font-semibold py-2.5 px-6 rounded-xl text-sm"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Camera feed */}
      <div className="flex-1 relative overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Viewfinder overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[85%] aspect-[3/4] border-2 border-white/40 rounded-2xl relative">
            {/* Corner markers */}
            <div className="absolute -top-0.5 -left-0.5 w-8 h-8 border-t-3 border-l-3 border-white rounded-tl-xl" />
            <div className="absolute -top-0.5 -right-0.5 w-8 h-8 border-t-3 border-r-3 border-white rounded-tr-xl" />
            <div className="absolute -bottom-0.5 -left-0.5 w-8 h-8 border-b-3 border-l-3 border-white rounded-bl-xl" />
            <div className="absolute -bottom-0.5 -right-0.5 w-8 h-8 border-b-3 border-r-3 border-white rounded-br-xl" />
          </div>
        </div>

        {/* Tips bar */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 to-transparent px-4 pt-12 pb-8">
          <p className="text-white/90 text-sm text-center font-medium">
            Place prescription flat • Good lighting • Capture full page
          </p>
        </div>

        {/* Loading state */}
        {!cameraReady && (
          <div className="absolute inset-0 bg-black flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="bg-black px-4 py-6 flex items-center justify-between">
        <button
          onClick={() => { stopCamera(); onClose(); }}
          className="text-white/70 text-sm font-medium py-2 px-4"
        >
          Cancel
        </button>

        {/* Shutter button */}
        <button
          onClick={takePhoto}
          disabled={!cameraReady}
          className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center disabled:opacity-30"
        >
          <div className="w-12 h-12 rounded-full bg-white active:bg-slate-200 transition-colors" />
        </button>

        <div className="w-16" /> {/* Spacer for centering */}
      </div>
    </div>
  );
}


// ============================================================
// COMPONENT: Image Preview with retake
// ============================================================

function ImagePreview({ file, onConfirm, onRetake }: {
  file: File;
  onConfirm: () => void;
  onRetake: () => void;
}) {
  const [previewUrl] = useState(() => URL.createObjectURL(file));

  return (
    <div className="space-y-4">
      {/* Preview image */}
      <div className="rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-100 shadow-sm">
        <img
          src={previewUrl}
          alt="Prescription preview"
          className="w-full object-contain max-h-[50vh]"
        />
      </div>

      {/* Confirm / Retake buttons */}
      <div className="flex gap-3">
        <button
          onClick={onRetake}
          className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3.5 px-4 rounded-xl text-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Retake
        </button>
        <button
          onClick={onConfirm}
          className="flex-[2] flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 px-4 rounded-xl text-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          Analyze Prescription
        </button>
      </div>
    </div>
  );
}


// ============================================================
// MAIN: Upload Screen
// ============================================================

interface UploadScreenProps {
  onImageSelected: (file: File) => void;
  onBack?: () => void;
}

export default function UploadScreen({ onImageSelected, onBack }: UploadScreenProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleConfirm = () => {
    if (selectedFile) {
      onImageSelected(selectedFile);
    }
  };

  const handleRetake = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Camera capture mode
  if (showCamera) {
    return (
      <CameraCapture
        onCapture={(file) => {
          setSelectedFile(file);
          setShowCamera(false);
        }}
        onClose={() => setShowCamera(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={onBack} className="text-slate-600 hover:text-slate-900 flex items-center gap-1 text-sm font-medium">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 onClick={onBack} className="font-bold text-slate-900 text-lg tracking-tight cursor-pointer">
            Rx<span className="text-emerald-600">Scan</span>
          </h1>
          <div className="w-12" />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-lg mx-auto px-4 py-6 w-full">
        {selectedFile ? (
          // Preview mode
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">Looking good?</h2>
            <p className="text-sm text-slate-500 mb-4">
              Make sure the full prescription is visible and text is readable.
            </p>
            <ImagePreview
              file={selectedFile}
              onConfirm={handleConfirm}
              onRetake={handleRetake}
            />
          </div>
        ) : (
          // Upload mode
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">Scan your prescription</h2>
            <p className="text-sm text-slate-500 mb-6">
              Take a photo or upload an image of your handwritten prescription.
            </p>

            {/* Camera button — primary on mobile */}
            <button
              onClick={() => setShowCamera(true)}
              className="w-full flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-4 px-6 rounded-2xl text-base transition-colors shadow-lg shadow-emerald-600/20"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Take a Photo
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400 font-medium">or</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* File upload — secondary */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-300 hover:border-emerald-400 bg-white hover:bg-emerald-50/50 rounded-2xl py-8 px-6 transition-colors cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
                <svg className="w-6 h-6 text-slate-400 group-hover:text-emerald-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-slate-600 group-hover:text-emerald-700 transition-colors">
                Upload from gallery
              </span>
              <span className="text-xs text-slate-400">
                JPG, PNG, WebP — max 10MB
              </span>
            </button>

            {/* Tips section */}
            <div className="mt-8 rounded-xl bg-white border border-slate-200 p-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                📸 Tips for best results
              </h3>
              <div className="space-y-2.5">
                {[
                  { icon: '☀️', text: 'Good lighting — avoid shadows on the prescription' },
                  { icon: '📐', text: 'Flat surface — lay the prescription flat, no folds' },
                  { icon: '🔍', text: 'Full page — capture the entire prescription in frame' },
                  { icon: '✋', text: 'Steady hand — hold still to avoid blur' },
                ].map((tip, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="text-sm flex-shrink-0">{tip.icon}</span>
                    <p className="text-sm text-slate-600 leading-snug">{tip.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom disclaimer */}
      <div className="px-4 pb-6">
        <p className="text-[11px] text-slate-400 leading-relaxed text-center max-w-lg mx-auto">
          Your prescription image is processed securely and is NOT stored.
          We delete all images after processing.
        </p>
      </div>
    </div>
  );
}
