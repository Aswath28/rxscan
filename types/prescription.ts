// ============================================================
// RxScan — Prescription Analysis Types
// Shared between drug-matcher, API route, and UI components
// ============================================================

export type Confidence = 'high' | 'medium' | 'low';

export type InteractionSeverity = 'severe' | 'moderate' | 'mild';

export type AnalysisQuality = 'good' | 'fair' | 'poor';

export type MatchMethod = 'exact' | 'prefix' | 'fuzzy' | 'unmatched';

export interface Medicine {
  id: string;
  ocrReading: string;
  matchedName: string;
  category: string;
  confidence: Confidence;
  attributes: string[];
  pricing?: {
    brandPrice: number;
    genericPrice: number;
    savingsPercent: number;
  };
  availableAtJanAushadhi?: boolean;
  iconKind?: 'capsule' | 'round' | 'tablet' | 'injection' | 'syrup';
  // Rich detail — shown when card is expanded
  whatItIs?: string;
  whatItDoes?: string;
  howToTake?: string;
  sideEffects?: string[];
  // Match trust signals — for safety fix
  matchMethod?: MatchMethod;
  showMatchedName?: boolean;
  showPricing?: boolean;
  // AI fallback — discriminator for which card variant to render
  source?: 'verified' | 'untrusted_match' | 'ai_fallback' | 'unknown';
}

export interface DoctorNote {
  kind: 'condition' | 'symptom';
  value: string;
}

export interface Interaction {
  drug1: string;
  drug2: string;
  severity: InteractionSeverity;
  effect: string;
  recommendation: string;
}

export interface PrescriptionAnalysis {
  id: string;
  doctorName?: string;
  prescriptionDate: string;
  quality: AnalysisQuality;
  aiSummary: string;
  aiConfidence: number;
  medicines: Medicine[];
  doctorNotes: DoctorNote[];
  interactions: Interaction[];
  totalBrandPrice: number;
  totalGenericPrice: number;
  totalSavings: number;
}
