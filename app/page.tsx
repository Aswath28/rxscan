'use client';

import { useState, useRef, useCallback } from 'react';
import LandingPage from '@/components/LandingPage';
import UploadScreen from '@/components/UploadScreen';
import ProcessingScreen from '@/components/ProcessingScreen';
import ResultsScreen from '@/components/ResultsScreen';

// ============================================================
// APP STATES
// ============================================================

type AppScreen = 'landing' | 'upload' | 'processing' | 'results';

export default function Home() {
  const [screen, setScreen] = useState<AppScreen>('landing');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Track whether API has returned while animation is still playing
  const apiDoneRef = useRef(false);
  const animDoneRef = useRef(false);
  const apiResultRef = useRef<any>(null);

  // ----------------------------------------------------------
  // Transition to results — only when BOTH api and animation done
  // ----------------------------------------------------------
  const tryShowResults = useCallback(() => {
    if (apiDoneRef.current && animDoneRef.current) {
      if (apiResultRef.current?.error) {
        setError(apiResultRef.current.error);
        setScreen('upload');
      } else {
        setAnalysisResult(apiResultRef.current);
        setScreen('results');
      }
    }
  }, []);

  // ----------------------------------------------------------
  // Called when processing animation finishes
  // ----------------------------------------------------------
  const handleAnimationComplete = useCallback(() => {
    animDoneRef.current = true;
    tryShowResults();
  }, [tryShowResults]);

  // ----------------------------------------------------------
  // Called when user confirms an image in the upload screen
  // ----------------------------------------------------------
  const handleImageSelected = useCallback(async (file: File) => {
    // Reset state
    apiDoneRef.current = false;
    animDoneRef.current = false;
    apiResultRef.current = null;
    setError(null);

    // Move to processing screen immediately
    setScreen('processing');

    try {
      // Convert image to base64
      const base64 = await fileToBase64(file);
      const mimeType = file.type || 'image/jpeg';

      // Call the scan API
      const response = await fetch('/api/scan-prescription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mimeType }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        apiResultRef.current = {
          error: data.error || data.message || 'Something went wrong. Please try again.',
        };
      } else {
        apiResultRef.current = data.data;
      }
    } catch (err) {
      console.error('API call failed:', err);
      apiResultRef.current = {
        error: 'Could not connect to the server. Please check your internet and try again.',
      };
    }

    apiDoneRef.current = true;
    tryShowResults();
  }, [tryShowResults]);

  // ----------------------------------------------------------
  // RENDER — show the active screen
  // ----------------------------------------------------------

  if (screen === 'landing') {
    return (
      <LandingPage
        onScanClick={() => setScreen('upload')}
        onTrySample={() => setScreen('upload')}
      />
    );
  }

  if (screen === 'upload') {
    return (
      <>
        {error && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-red-500 text-white text-sm text-center py-3 px-4">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-3 underline font-medium"
            >
              Dismiss
            </button>
          </div>
        )}
        <UploadScreen onImageSelected={handleImageSelected} onBack={() => setScreen('landing')} />
      </>
    );
  }

  if (screen === 'processing') {
    return <ProcessingScreen onComplete={handleAnimationComplete} onBack={() => setScreen('landing')} />;
  }

  if (screen === 'results' && analysisResult) {
    return (
      <ResultsScreen
        result={analysisResult}
        onScanAnother={() => {
          setAnalysisResult(null);
          setScreen('upload');
        }}
        onBack={() => setScreen('landing')}
      />
    );
  }

  // Fallback
  return null;
}

// ============================================================
// UTILITY: Convert File to raw base64 (no data: prefix)
// ============================================================

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the "data:image/jpeg;base64," prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
