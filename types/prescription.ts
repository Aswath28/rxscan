export type Confidence = 'high' | 'medium' | 'low'

export type InteractionSeverity = 'severe' | 'moderate' | 'mild'

export interface Medicine {
  id: string
  ocrReading: string
  matchedName: string
  category: string
  confidence: Confidence
  attributes: string[]
  pricing?: {
    brandPrice: number
    genericPrice: number
    savingsPercent: number
  }
  availableAtJanAushadhi?: boolean
  iconKind?: 'capsule' | 'round' | 'tablet' | 'injection' | 'syrup'
  // Rich detail — shown when card is expanded
  whatItIs?: string
  whatItDoes?: string
  howToTake?: string
  sideEffects?: string[]
}

export interface Interaction {
  drug1: string
  drug2: string
  severity: InteractionSeverity
  effect: string
  recommendation: string
}

export interface DoctorNote {
  kind: 'condition' | 'symptom'
  value: string
}

export type AnalysisQuality = 'good' | 'fair' | 'poor'

export interface Medicine {
  id: string
  ocrReading: string
  matchedName: string
  category: string
  confidence: Confidence
  attributes: string[]
  pricing?: {
    brandPrice: number
    genericPrice: number
    savingsPercent: number
  }
  availableAtJanAushadhi?: boolean
  iconKind?: 'capsule' | 'round' | 'tablet' | 'injection' | 'syrup'
  whatItIs?: string
  whatItDoes?: string
  howToTake?: string
  sideEffects?: string[]
  // NEW — match trust signals
  matchMethod?: 'exact' | 'prefix' | 'fuzzy' | 'unmatched'
  showMatchedName?: boolean
  showPricing?: boolean
}