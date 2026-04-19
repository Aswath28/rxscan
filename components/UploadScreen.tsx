'use client';

import { useState, useRef, useCallback } from 'react';

// ============================================================
// ICONS
// ============================================================

function IconCamera({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="13.5" r="3.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function IconUpload({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 15V3M7 8l5-5 5 5M5 15v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconSun({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconRuler({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="9" width="18" height="6" rx="1" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7 9v2M11 9v3M15 9v2M19 9v3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function IconSearch({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.6" />
      <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconHand({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M8 13V6a2 2 0 1 1 4 0v4M12 10V4a2 2 0 1 1 4 0v8M16 10V6a2 2 0 1 1 4 0v9a6 6 0 0 1-12 0v-3l-2-3a2 2 0 1 1 3-2l1 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconImage({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="9" cy="10" r="1.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 18l5-5 5 5 3-3 3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ============================================================
// CAMERA CAPTURE
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
        const ext = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg';
        const file = new File([blob], `prescription.${ext}`, { type: blob.type });
        stopCamera();
        onCapture(file);
      }
    }, 'image/jpeg', 0.9);
  }, [stopCamera, onCapture]);

  useState(() => {
    startCamera();
  });

  if (error) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center px-6 text-center">
        <IconCamera className="w-12 h-12 text-white/60 mb-4" />
        <p className="text-white text-sm mb-6">{error}</p>
        <button
          onClick={onClose}
          className="bg-rx-surface text-rx-ink font-medium py-2.5 px-6 rounded-xl text-sm"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex-1 relative overflow-hidden">
        <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[85%] aspect-[3/4] border-2 border-white/40 rounded-2xl relative">
            <div className="absolute -top-0.5 -left-0.5 w-8 h-8 border-t-3 border-l-3 border-white rounded-tl-xl" />
            <div className="absolute -top-0.5 -right-0.5 w-8 h-8 border-t-3 border-r-3 border-white rounded-tr-xl" />
            <div className="absolute -bottom-0.5 -left-0.5 w-8 h-8 border-b-3 border-l-3 border-white rounded-bl-xl" />
            <div className="absolute -bottom-0.5 -right-0.5 w-8 h-8 border-b-3 border-r-3 border-white rounded-br-xl" />
          </div>
        </div>

        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 to-transparent px-4 pt-12 pb-8">
          <p className="text-white/90 text-sm text-center font-medium">
            Place prescription flat • Good lighting • Capture full page
          </p>
        </div>

        {!cameraReady && (
          <div className="absolute inset-0 bg-black flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}
      </div>

      <div className="bg-black px-4 py-6 flex items-center justify-between">
        <button onClick={() => { stopCamera(); onClose(); }} className="text-white/70 text-sm font-medium py-2 px-4">
          Cancel
        </button>
        <button onClick={takePhoto} disabled={!cameraReady} className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center disabled:opacity-30">
          <div className="w-12 h-12 rounded-full bg-white active:bg-rx-surface transition-colors" />
        </button>
        <div className="w-16" />
      </div>
    </div>
  );
}

// ============================================================
// IMAGE PREVIEW
// ============================================================

function ImagePreview({ file, onConfirm, onRetake }: {
  file: File;
  onConfirm: () => void;
  onRetake: () => void;
}) {
  const [previewUrl] = useState(() => URL.createObjectURL(file));

  return (
    <div className="space-y-4">
      <div className="rounded-2xl overflow-hidden border border-rx-hairline bg-rx-surface">
        <img src={previewUrl} alt="Prescription preview" className="w-full object-contain max-h-[50vh]" />
      </div>

      <div className="flex gap-3">
        <button
          onClick={onRetake}
          className="flex-1 flex items-center justify-center gap-2 bg-rx-surface hover:bg-rx-pine-50 text-rx-ink font-medium py-3.5 px-4 rounded-xl text-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Retake
        </button>
        <button
          onClick={onConfirm}
          className="flex-[2] flex items-center justify-center gap-2 bg-rx-pine-700 hover:bg-rx-pine-900 text-rx-surface font-medium py-3.5 px-4 rounded-xl text-sm transition-colors"
        >
          Analyze prescription
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ============================================================
// MAIN
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
    if (file) setSelectedFile(file);
  };

  const handleConfirm = () => { if (selectedFile) onImageSelected(selectedFile); };
  const handleRetake = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

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
    <div className="min-h-screen bg-rx-bg flex flex-col">
      <header className="bg-rx-card/80 backdrop-blur-md border-b border-rx-hairline">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={onBack} className="text-rx-ink-muted hover:text-rx-ink flex items-center gap-1 text-sm font-medium">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 onClick={onBack} className="font-medium text-rx-ink text-lg tracking-tight cursor-pointer">
            Rx<span className="text-rx-pine-700">Scan</span>
          </h1>
          <div className="w-12" />
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto px-4 py-6 w-full">
        {selectedFile ? (
          <div>
            <h2 className="text-lg font-medium text-rx-ink mb-1">Looking good?</h2>
            <p className="text-sm text-rx-ink-muted mb-4">
              Make sure the full prescription is visible and text is readable.
            </p>
            <ImagePreview file={selectedFile} onConfirm={handleConfirm} onRetake={handleRetake} />
          </div>
        ) : (
          <div>
            <h2 className="text-lg font-medium text-rx-ink mb-1">Scan your prescription</h2>
            <p className="text-sm text-rx-ink-muted mb-6">
              Take a photo or upload an image of your handwritten prescription.
            </p>

            <button
              onClick={() => setShowCamera(true)}
              className="w-full flex items-center justify-center gap-3 bg-rx-pine-700 hover:bg-rx-pine-900 text-rx-surface font-medium py-4 px-6 rounded-2xl text-base transition-colors"
            >
              <IconCamera className="w-5 h-5" />
              Take a photo
            </button>

            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-rx-hairline" />
              <span className="text-xs text-rx-ink-subtle font-medium">or</span>
              <div className="flex-1 h-px bg-rx-hairline" />
            </div>

            <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center justify-center gap-2 border border-dashed border-rx-hairline hover:border-rx-pine-700 bg-rx-card hover:bg-rx-pine-50/40 rounded-2xl py-8 px-6 transition-colors cursor-pointer group"
            >
              <div className="w-11 h-11 rounded-full bg-rx-surface group-hover:bg-rx-pine-50 flex items-center justify-center transition-colors">
                <IconImage className="w-5 h-5 text-rx-ink-subtle group-hover:text-rx-pine-700 transition-colors" />
              </div>
              <span className="text-sm font-medium text-rx-ink-muted group-hover:text-rx-pine-700 transition-colors">
                Upload from gallery
              </span>
              <span className="text-xs text-rx-ink-subtle">JPG, PNG, WebP — max 10MB</span>
            </button>

            <div className="mt-8 rounded-xl bg-rx-card border border-rx-hairline p-4">
              <h3 className="text-xs font-medium text-rx-ink-subtle uppercase tracking-wider mb-3">
                Tips for best results
              </h3>
              <div className="space-y-2.5">
                {[
                  { Icon: IconSun, text: 'Good lighting — avoid shadows on the prescription' },
                  { Icon: IconRuler, text: 'Flat surface — lay the prescription flat, no folds' },
                  { Icon: IconSearch, text: 'Full page — capture the entire prescription in frame' },
                  { Icon: IconHand, text: 'Steady hand — hold still to avoid blur' },
                ].map((tip, i) => {
                  const TipIcon = tip.Icon;
                  return (
                    <div key={i} className="flex items-start gap-2.5">
                      <TipIcon className="w-4 h-4 text-rx-pine-700 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-rx-ink leading-snug">{tip.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      <div className="px-4 pb-6">
        <p className="text-[11px] text-rx-ink-subtle leading-relaxed text-center max-w-lg mx-auto">
          Your prescription image is processed securely and is not stored. We delete all images after processing.
        </p>
      </div>
    </div>
  );
}