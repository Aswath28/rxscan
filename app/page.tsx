'use client';

import { useState, useRef, useCallback } from 'react';
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