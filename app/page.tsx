'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import LandingPage from '@/components/LandingPage';
import UploadScreen from '@/components/UploadScreen';
import ProcessingScreen from '@/components/ProcessingScreen';
import ResultsScreen from '@/components/ResultsScreen';
import MyMedicinesScreen from '@/components/MyMedicinesScreen';

// ============================================================
// APP STATES
// ============================================================

type AppScreen = 'landing' | 'upload' | 'processing' | 'results' | 'my-medicines';

// ============================================================
// SAMPLE RESULT — loaded when user taps "Try a Sample"
// Realistic flu prescription so they see the full product
// ============================================================

const SAMPLE_RESULT = {
  doctorName: "Dr. Ramesh Gupta",
  clinicName: "Gupta Clinic, Koramangala",
  date: "02/04/2026",
  diagnosis: "Upper Respiratory Tract Infection",
  overallReadability: "fair" as const,
  medicines: [
    {
      ocrReading: "Augmentin 625",
      name: "Augmentin 625",
      matchedDrug: "Amoxicillin 500mg + Clavulanic Acid 125mg",
      genericName: "Amoxicillin + Clavulanic Acid",
      dosage: "625mg",
      frequency: "1-0-1",
      frequencyPlain: "One tablet morning and night",
      duration: "5 days",
      instructions: "After food",
      formulation: "Tablet",
      confidence: "high" as const,
      category: "Antibiotic",
      whatItIs: "Amoxicillin + Clavulanic Acid is a combination antibiotic that fights bacteria your body can't handle on its own.",
      whatItDoes: "It kills the bacteria causing your infection. The clavulanic acid protects the amoxicillin from being broken down, making it more effective against resistant bacteria.",
      howToTake: "Take one tablet after breakfast and one after dinner. Complete the full 5-day course even if you feel better — stopping early can cause the infection to return stronger.",
      sideEffects: ["Diarrhoea", "Nausea", "Skin rash", "Stomach discomfort"],
      brandPrice: 250,
      genericPrice: 45,
      janAushadhiAvailable: true,
    },
    {
      ocrReading: "Pan-D",
      name: "Pan-D",
      matchedDrug: "Pantoprazole 40mg + Domperidone 30mg",
      genericName: "Pantoprazole + Domperidone",
      dosage: "40mg + 30mg",
      frequency: "1-0-0",
      frequencyPlain: "One capsule in the morning",
      duration: "5 days",
      instructions: "Before food, 30 min before breakfast",
      formulation: "Capsule",
      confidence: "high" as const,
      category: "Gastric / Anti-emetic",
      whatItIs: "Pantoprazole reduces stomach acid, and Domperidone prevents nausea and vomiting.",
      whatItDoes: "Protects your stomach lining while you're taking the antibiotic. Reduces acidity, bloating, and that uncomfortable full feeling.",
      howToTake: "Take one capsule on an empty stomach, 30 minutes before breakfast. Don't crush or chew it.",
      sideEffects: ["Headache", "Dry mouth", "Dizziness", "Mild stomach pain"],
      brandPrice: 180,
      genericPrice: 25,
      janAushadhiAvailable: true,
    },
    {
      ocrReading: "Levocetirizine 5mg",
      name: "Levocetirizine 5mg",
      matchedDrug: "Levocetirizine 5mg",
      genericName: "Levocetirizine",
      dosage: "5mg",
      frequency: "0-0-1",
      frequencyPlain: "One tablet at night",
      duration: "5 days",
      instructions: null,
      formulation: "Tablet",
      confidence: "high" as const,
      category: "Antihistamine",
      whatItIs: "Levocetirizine is an antihistamine that reduces allergic reactions.",
      whatItDoes: "Relieves runny nose, sneezing, and itching. Also helps reduce swelling in your throat if there's an allergic component to your infection.",
      howToTake: "Take one tablet at bedtime. It can cause mild drowsiness, which is why it's prescribed at night.",
      sideEffects: ["Drowsiness", "Dry mouth", "Fatigue", "Headache"],
      brandPrice: 55,
      genericPrice: 8,
      janAushadhiAvailable: true,
    },
    {
      ocrReading: "Ambroxol Syp",
      name: "Ambrodil-S Syrup",
      matchedDrug: "Ambroxol 30mg + Salbutamol 2mg / 5ml",
      genericName: "Ambroxol + Salbutamol",
      dosage: "10ml",
      frequency: "1-1-1",
      frequencyPlain: "10ml three times a day",
      duration: "5 days",
      instructions: null,
      formulation: "Syrup",
      confidence: "medium" as const,
      category: "Cough / Mucolytic",
      whatItIs: "Ambroxol thins out mucus, and Salbutamol opens up your airways.",
      whatItDoes: "Makes it easier to cough out thick phlegm and helps you breathe more easily if your chest feels tight.",
      howToTake: "Take 10ml (two teaspoons) three times a day — morning, afternoon, and night. Can be taken with or without food.",
      sideEffects: ["Nausea", "Mild tremor", "Diarrhoea", "Heartburn"],
      brandPrice: 95,
      genericPrice: 22,
      janAushadhiAvailable: false,
    },
  ],
  interactions: [
    {
      drug1: "Amoxicillin + Clavulanic Acid",
      drug2: "Pantoprazole + Domperidone",
      severity: "mild" as const,
      effect: "Pantoprazole may slightly reduce absorption of Amoxicillin. The clinical impact is usually minimal.",
      recommendation: "Your doctor has likely accounted for this. Take them at different times if possible — Pantoprazole before breakfast, antibiotic after food.",
    },
  ],
};

export default function Home() {
  const [screen, setScreen] = useState<AppScreen>('landing');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Track whether API and animation are done — using STATE so React re-renders
  const apiResultRef = useRef<any>(null);
  const [apiDone, setApiDone] = useState(false);
  const [animDone, setAnimDone] = useState(false);

  // ----------------------------------------------------------
  // Transition to results — fires when BOTH apiDone and animDone
  // ----------------------------------------------------------
  useEffect(() => {
    if (apiDone && animDone) {
      if (apiResultRef.current?.error) {
        setError(apiResultRef.current.error);
        setScreen('upload');
      } else if (apiResultRef.current) {
        setAnalysisResult(apiResultRef.current);
        setScreen('results');
      }
    }
  }, [apiDone, animDone]);

  // ----------------------------------------------------------
  // Called when processing animation finishes
  // ----------------------------------------------------------
  const handleAnimationComplete = useCallback(() => {
    setAnimDone(true);
  }, []);

  // ----------------------------------------------------------
  // Called when user confirms an image in the upload screen
  // ----------------------------------------------------------
  const handleImageSelected = useCallback(async (file: File) => {
    // Reset state
    setApiDone(false);
    setAnimDone(false);
    apiResultRef.current = null;
    setError(null);

    // Move to processing screen immediately
    setScreen('processing');

    try {
      // Convert image to base64
      const base64 = await fileToBase64(file);
      const mimeType = file.type || 'image/jpeg';

      // Timeout after 30 seconds
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      try {
        const res = await fetch('/api/scan-prescription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64, mimeType }),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        const data = await res.json();

        if (!res.ok) {
          apiResultRef.current = {
            error: data.error || 'Analysis failed. Please try again.',
          };
        } else {
          apiResultRef.current = data.data;
        }
      } catch (err: any) {
        clearTimeout(timeout);
        if (err.name === 'AbortError') {
          apiResultRef.current = {
            error: 'Analysis is taking longer than expected. Please try again with a clearer photo.',
          };
        } else {
          console.error('API call failed:', err);
          apiResultRef.current = {
            error: 'Could not connect to the server. Please check your internet and try again.',
          };
        }
      }
    } catch (err) {
      console.error('API call failed:', err);
      apiResultRef.current = {
        error: 'Could not connect to the server. Please check your internet and try again.',
      };
    }

    setApiDone(true);
  }, []);

  // ----------------------------------------------------------
  // RENDER — show the active screen
  // ----------------------------------------------------------

  if (screen === 'landing') {
    return (
      <LandingPage
        onScanClick={() => setScreen('upload')}
        onTrySample={() => {
          setAnalysisResult({ ...SAMPLE_RESULT, isDemo: true });
          setScreen('results');
        }}
        onMyMedicines={() => setScreen('my-medicines')}
      />
    );
  }

  if (screen === 'upload') {
    return (
      <>
        {error && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-red-200 shadow-lg px-4 py-4 animate-fade-in">
            <div className="max-w-lg mx-auto flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">Something went wrong</p>
                <p className="text-sm text-slate-600 mt-0.5">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
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

  if (screen === 'my-medicines') {
    return (
      <MyMedicinesScreen
        onBack={() => setScreen('landing')}
        onScan={() => {
          setAnalysisResult(null);
          setScreen('upload');
        }}
        onViewPrescription={(prescription) => {
          setAnalysisResult(prescription);
          setScreen('results');
        }}
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