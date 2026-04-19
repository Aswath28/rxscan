'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import LandingPage from '@/components/LandingPage';
import UploadScreen from '@/components/UploadScreen';
import ProcessingScreen from '@/components/ProcessingScreen';
import ResultsScreen from '@/components/ResultsScreen';
import MyMedicinesScreen from '@/components/MyMedicinesScreen';
import type { PrescriptionAnalysis, Medicine, AnalysisQuality } from '@/types/prescription';

type AppScreen = 'landing' | 'upload' | 'processing' | 'results' | 'my-medicines';

// ============================================================
// SAMPLE RESULT — loaded when user taps "Try a Sample"
// ============================================================

const SAMPLE_RESULT = {
  doctorName: "Dr. Ramesh Gupta",
  clinicName: "Gupta Clinic, Koramangala",
  date: "02/04/2026",
  diagnosis: "Upper Respiratory Tract Infection",
  overallReadability: "fair" as const,
  aiSummary: "Looks like a 5-day course for an upper respiratory infection.",
  aiConfidence: 78,
  doctorNotes: [
    { kind: "condition" as const, value: "Upper Respiratory Tract Infection" },
  ],
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
  savings: {
    brandTotal: 580,
    genericTotal: 100,
    savingsAmount: 480,
    savingsPercent: 83,
  },
};

// ============================================================
// TRANSLATOR — legacy analysis shape → new PrescriptionAnalysis
// ============================================================

// Guess an icon kind based on formulation string
function pickIconKind(formulation?: string | null): Medicine['iconKind'] {
  const f = (formulation || '').toLowerCase();
  if (f.includes('capsule') || f.includes('cap')) return 'capsule';
  if (f.includes('syrup') || f.includes('syp')) return 'syrup';
  if (f.includes('injection') || f.includes('inj')) return 'injection';
  if (f.includes('tablet') || f.includes('tab')) return 'tablet';
  return 'capsule';
}

// Build the attributes chips shown on the medicine card
function buildAttributes(med: any): string[] {
  const attrs: string[] = [];
  if (med.formulation) attrs.push(med.formulation);
  if (med.frequency) attrs.push(med.frequency);
  if (med.duration) attrs.push(med.duration);
  if (med.instructions) attrs.push(med.instructions);
  return attrs;
}

// Map readability to AnalysisQuality
function toQuality(r?: string | null): AnalysisQuality {
  if (r === 'good' || r === 'fair' || r === 'poor') return r;
  return 'fair';
}

// Parse whatever date format is in the legacy result into ISO
function toIsoDate(d?: string | null): string {
  if (!d) return new Date().toISOString().slice(0, 10);
  // Try DD/MM/YYYY
  const parts = d.split(/[/\-.]/);
  if (parts.length === 3) {
    const [dd, mm, yyyy] = parts;
    if (dd.length <= 2 && mm.length <= 2 && yyyy.length === 4) {
      return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
    }
  }
  // Otherwise just pass through
  return d;
}

function toAnalysis(result: any): PrescriptionAnalysis {
  const medicines: Medicine[] = (result.medicines || []).map((m: any, idx: number) => {
    const hasBoth = m.brandPrice != null && m.genericPrice != null;
    const pricing = hasBoth
      ? {
          brandPrice: m.brandPrice,
          genericPrice: m.genericPrice,
          savingsPercent: m.brandPrice > 0
            ? Math.round(((m.brandPrice - m.genericPrice) / m.brandPrice) * 100)
            : 0,
        }
      : undefined;

    return {
      id: `med-${idx}`,
      ocrReading: m.ocrReading || m.name || '',
      matchedName: m.matchedDrug || m.genericName || m.name || '',
      category: m.category || '',
      confidence: (m.confidence as Medicine['confidence']) || 'medium',
      attributes: buildAttributes(m),
      pricing,
      availableAtJanAushadhi: !!m.janAushadhiAvailable,
      iconKind: pickIconKind(m.formulation),
      whatItIs: m.whatItIs || m.description || undefined,
      whatItDoes: m.whatItDoes || undefined,
      howToTake: m.howToTake || undefined,
      sideEffects: m.sideEffects || m.commonSideEffects || undefined,
      matchMethod: m.matchMethod,
      showMatchedName: m.showMatchedName ?? true,
      showPricing: m.showPricing ?? true,
    };
  });

  const totalBrand = result.savings?.brandTotal ?? 0;
  const totalGeneric = result.savings?.genericTotal ?? 0;
  const totalSavings = result.savings?.savingsAmount ?? (totalBrand - totalGeneric);

  return {
    id: `rx-${Date.now()}`,
    doctorName: result.doctorName || undefined,
    prescriptionDate: toIsoDate(result.date),
    quality: toQuality(result.overallReadability),
    aiSummary:
      result.aiSummary ||
      (medicines.length === 0
        ? "I couldn't confidently read medicine names from this prescription."
        : `I identified ${medicines.length} medicine${medicines.length === 1 ? '' : 's'} from this prescription.`),
    aiConfidence:
      typeof result.aiConfidence === 'number'
        ? result.aiConfidence
        : result.overallReadability === 'good'
        ? 92
        : result.overallReadability === 'poor'
        ? 35
        : 72,
    medicines,
    doctorNotes: Array.isArray(result.doctorNotes) ? result.doctorNotes : [],
    interactions: (result.interactions || []).map((i: any) => ({
      drug1: i.drug1,
      drug2: i.drug2,
      severity: i.severity,
      effect: i.effect,
      recommendation: i.recommendation,
    })),
    totalBrandPrice: totalBrand,
    totalGenericPrice: totalGeneric,
    totalSavings,
  };
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function Home() {
  const [screen, setScreen] = useState<AppScreen>('landing');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiResultRef = useRef<any>(null);
  const [apiDone, setApiDone] = useState(false);
  const [animDone, setAnimDone] = useState(false);

  useEffect(() => {
    if (apiDone && animDone) {
      if (apiResultRef.current?.error) {
        setError(apiResultRef.current.error);
        setScreen('upload');
      } else if (apiResultRef.current) {
        setAnalysisResult(apiResultRef.current);
        setIsDemo(false);
        setScreen('results');
      }
    }
  }, [apiDone, animDone]);

  const handleAnimationComplete = useCallback(() => {
    setAnimDone(true);
  }, []);

  const handleImageSelected = useCallback(async (file: File) => {
    setApiDone(false);
    setAnimDone(false);
    apiResultRef.current = null;
    setError(null);
    setScreen('processing');

    try {
      const base64 = await fileToBase64(file);
      const mimeType = file.type || 'image/jpeg';

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
  // RENDER
  // ----------------------------------------------------------

  if (screen === 'landing') {
    return (
      <LandingPage
        onScanClick={() => setScreen('upload')}
        onTrySample={() => {
          setAnalysisResult(SAMPLE_RESULT);
          setIsDemo(true);
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
    const analysis = toAnalysis(analysisResult);
    return (
      <ResultsScreen
        analysis={analysis}
        isDemo={isDemo}
        onBack={() => setScreen('landing')}
        onScanAnother={() => {
          setAnalysisResult(null);
          setScreen('upload');
        }}
        onRetake={() => {
          setAnalysisResult(null);
          setScreen('upload');
        }}
        onManualEntry={() => {
          alert('Manual entry coming soon');
        }}
        onShareWhatsApp={() => {
          const total = analysis.totalSavings;
          const msg = `💊 RxScan Report\n\nScanned ${analysis.medicines.length} medicines. Could save ₹${total.toLocaleString('en-IN')} with generic alternatives.\n\nTry RxScan free: ${window.location.origin}`;
          window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
        }}
        onSaveToMyMedicines={() => {
          // Save to localStorage using your existing logic
          const saved = JSON.parse(localStorage.getItem('rxscan-prescriptions') || '[]');
          saved.unshift({
            ...analysisResult,
            savedAt: new Date().toISOString(),
          });
          localStorage.setItem('rxscan-prescriptions', JSON.stringify(saved));
          alert('Saved to My Medicines');
        }}
        onFindNearby={(id) => {
          window.open('https://janaushadhi.gov.in/StoreLocator', '_blank');
        }}
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
          setIsDemo(false);
          setScreen('results');
        }}
      />
    );
  }

  return null;
}

// ============================================================
// UTILITY
// ============================================================

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}