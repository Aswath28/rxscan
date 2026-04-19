import drugsData from '@/data/drugs.json';
import brandMappings from '@/data/brand-mappings.json';
import interactionsData from '@/data/drug-interactions.json';

// ============================================================
// TYPES
// ============================================================

export interface OCRMedicine {
  name: string;
  dosage: string | null;
  frequency: string;
  frequencyPlain: string;
  duration: string | null;
  instructions: string | null;
  confidence: 'high' | 'medium' | 'low';
  formulation: string;
}

export interface DoctorNote {
  kind: 'condition' | 'symptom';
  value: string;
}

export interface OCRResult {
  medicines: OCRMedicine[];
  doctorName: string | null;
  patientName: string | null;
  clinicName: string | null;
  date: string | null;
  diagnosis: string | null;
  overallReadability: 'good' | 'fair' | 'poor';
  totalMedicines: number;
  doctorNotes?: DoctorNote[];
  aiSummary?: string | null;
  aiConfidence?: number | null;
}

// NEW — how confidently did we identify this medicine?
// 'exact'      : brand name matched exactly (Augmentin → Augmentin)
// 'prefix'     : one is a prefix of the other (Pan → Pan 40)
// 'fuzzy'      : Levenshtein close enough to pass threshold (risky)
// 'unmatched'  : no match at all — show OCR reading only
export type MatchMethod = 'exact' | 'prefix' | 'fuzzy' | 'unmatched';

export interface MatchedMedicine extends OCRMedicine {
  ocrReading: string;
  matchedDrug: string | null;
  genericName: string | null;
  category: string | null;
  description: string | null;
  howToTake: string | null;
  commonSideEffects: string[];
  brandPrice: number | null;
  genericPrice: number | null;
  janAushadhiAvailable: boolean;
  matchMethod: MatchMethod;        // NEW
  showMatchedName: boolean;        // NEW — UI guard
  showPricing: boolean;            // NEW — UI guard
}

export interface Interaction {
  drug1: string;
  drug2: string;
  severity: 'severe' | 'moderate' | 'mild';
  effect: string;
  recommendation: string;
}

export interface AnalysisResult {
  medicines: MatchedMedicine[];
  interactions: Interaction[];
  savings: {
    brandTotal: number;
    genericTotal: number;
    savingsAmount: number;
    savingsPercent: number;
  };
  doctorName: string | null;
  patientName: string | null;
  clinicName: string | null;
  date: string | null;
  diagnosis: string | null;
  overallReadability: 'good' | 'fair' | 'poor';
  doctorNotes: DoctorNote[];
  aiSummary: string | null;
  aiConfidence: number | null;
}

// ============================================================
// HELPERS
// ============================================================

function normalize(str: string): string {
  return str.toLowerCase().trim().replace(/\s+/g, ' ');
}

function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

// ============================================================
// BRAND MATCHING — now also reports the method used
// ============================================================

const brandMap = brandMappings as Record<string, { generic: string; dosage: string }>;
const drugs = drugsData as any[];
const interactions = interactionsData as any[];

interface BrandMatchResult {
  mapping: { generic: string; dosage: string };
  method: 'exact' | 'prefix' | 'fuzzy';
}

function matchBrand(ocrName: string): BrandMatchResult | null {
  const normalized = normalize(ocrName);

  // 1. Exact
  for (const [brand, mapping] of Object.entries(brandMap)) {
    if (normalize(brand) === normalized) {
      return { mapping, method: 'exact' };
    }
  }

  // 2. Starts-with (either direction)
  for (const [brand, mapping] of Object.entries(brandMap)) {
    if (normalize(brand).startsWith(normalized) || normalized.startsWith(normalize(brand))) {
      return { mapping, method: 'prefix' };
    }
  }

  // 3. Fuzzy
  const ocrNamePart = normalized.replace(/\d+.*/g, '').trim();
  if (ocrNamePart.length < 3) return null;

  const maxDistance = ocrNamePart.length <= 5 ? 1 : ocrNamePart.length <= 9 ? 2 : 3;

  let bestMatch: { mapping: { generic: string; dosage: string }; distance: number; ratio: number } | null = null;

  for (const [brand, mapping] of Object.entries(brandMap)) {
    const brandNamePart = normalize(brand).replace(/\d+.*/g, '').trim();
    if (Math.abs(ocrNamePart.length - brandNamePart.length) > maxDistance) continue;

    const distance = levenshtein(ocrNamePart, brandNamePart);
    const maxLen = Math.max(ocrNamePart.length, brandNamePart.length);
    const ratio = 1 - (distance / maxLen);

    if (distance <= maxDistance && ratio >= 0.6) {
      if (!bestMatch || ratio > bestMatch.ratio || (ratio === bestMatch.ratio && distance < bestMatch.distance)) {
        bestMatch = { mapping, distance, ratio };
      }
    }
  }

  return bestMatch ? { mapping: bestMatch.mapping, method: 'fuzzy' } : null;
}

// ============================================================
// DRUG DATABASE LOOKUP — unchanged
// ============================================================

function findDrugByGeneric(genericName: string): any | null {
  const normalized = normalize(genericName);

  for (const drug of drugs) {
    if (normalize(drug.genericName) === normalized) {
      return drug;
    }
  }

  for (const drug of drugs) {
    const drugNorm = normalize(drug.genericName);
    if (drugNorm.includes(normalized) || normalized.includes(drugNorm)) {
      return drug;
    }
  }

  const firstComponent = normalized.split('+')[0].split('/')[0].trim();
  if (firstComponent.length >= 4) {
    for (const drug of drugs) {
      const drugFirst = normalize(drug.genericName).split('+')[0].split('/')[0].trim();
      if (drugFirst === firstComponent || levenshtein(drugFirst, firstComponent) <= 2) {
        return drug;
      }
    }
  }

  return null;
}

// ============================================================
// INTERACTION CHECKER — unchanged
// ============================================================

function checkInteractions(genericNames: string[]): Interaction[] {
  const found: Interaction[] = [];
  const normalizedNames = genericNames.map(normalize);

  for (const interaction of interactions) {
    const interactionDrugs = interaction.drugs.map((d: string) => normalize(d));

    const drug1Present = normalizedNames.some(
      (name) => interactionDrugs[0] && (name.includes(interactionDrugs[0]) || interactionDrugs[0].includes(name))
    );
    const drug2Present = normalizedNames.some(
      (name) => interactionDrugs[1] && (name.includes(interactionDrugs[1]) || interactionDrugs[1].includes(name))
    );

    if (drug1Present && drug2Present) {
      found.push({
        drug1: interaction.drugs[0],
        drug2: interaction.drugs[1],
        severity: interaction.severity,
        effect: interaction.effect,
        recommendation: interaction.recommendation,
      });
    }
  }

  return found;
}

// ============================================================
// MAIN: analyzePrescription
// ============================================================

export function analyzePrescription(ocrResult: OCRResult): AnalysisResult {
  const matchedMedicines: MatchedMedicine[] = [];
  const genericNames: string[] = [];

  for (const med of ocrResult.medicines) {
    const brandMatch = matchBrand(med.name);
    const genericName = brandMatch?.mapping.generic || med.name;
    const drugEntry = findDrugByGeneric(genericName);

    // Determine match method — the single source of truth for trust
    let matchMethod: MatchMethod;
    if (brandMatch?.method === 'exact' && drugEntry) {
      matchMethod = 'exact';
    } else if (brandMatch?.method === 'prefix' && drugEntry) {
      matchMethod = 'prefix';
    } else if (brandMatch?.method === 'fuzzy' && drugEntry) {
      matchMethod = 'fuzzy';
    } else if (!brandMatch && drugEntry) {
      // Direct generic lookup succeeded — treat as exact
      matchMethod = 'exact';
    } else {
      matchMethod = 'unmatched';
    }

    // Trust gates for the UI
    const showMatchedName = matchMethod === 'exact' || matchMethod === 'prefix';
    const showPricing = matchMethod === 'exact' || matchMethod === 'prefix';

    // Confidence override — our match strength outranks Vision's self-doubt.
    // If Vision said "medium" but we got an exact or prefix brand match,
    // the match is confident enough to show as "high". This fixes the
    // "Tap to verify" pill firing on obvious matches like Paracetamol.
    let finalConfidence = med.confidence;
    if (med.confidence === 'medium' && (matchMethod === 'exact' || matchMethod === 'prefix')) {
      finalConfidence = 'high';
    }
    // If Vision said "high" but we couldn't match, downgrade to medium —
    // Vision read it confidently but it's not in our database, so the user
    // should still verify.
    if (med.confidence === 'high' && matchMethod === 'unmatched') {
      finalConfidence = 'medium';
    }

    // Brand price lookup
    let brandPrice: number | null = null;
    if (drugEntry && drugEntry.commonBrands && drugEntry.commonBrands.length > 0) {
      const exactBrand = drugEntry.commonBrands.find(
        (b: any) =>
          normalize(b.name) === normalize(med.name) ||
          normalize(med.name).includes(normalize(b.name))
      );
      brandPrice = exactBrand ? exactBrand.mrp : drugEntry.commonBrands[0].mrp;
    }

    // If match is untrusted, null out pricing + description regardless of what DB said
    const finalBrandPrice = showPricing ? brandPrice : null;
    const finalGenericPrice = showPricing ? drugEntry?.janAushadhiPrice ?? null : null;

    const matched: MatchedMedicine = {
      ...med,
      confidence: finalConfidence,
      ocrReading: med.name,
      matchedDrug: showMatchedName && brandMatch
        ? `${brandMatch.mapping.generic} ${brandMatch.mapping.dosage}`
        : showMatchedName && drugEntry
        ? `${drugEntry.genericName} ${med.dosage || ''}`
        : null,
      genericName: showMatchedName ? (brandMatch?.mapping.generic || drugEntry?.genericName || null) : null,
      category: showMatchedName ? drugEntry?.category || null : null,
      description: showMatchedName ? drugEntry?.description || null : null,
      howToTake: showMatchedName ? drugEntry?.howToTake || null : null,
      commonSideEffects: showMatchedName ? drugEntry?.commonSideEffects || [] : [],
      brandPrice: finalBrandPrice,
      genericPrice: finalGenericPrice,
      janAushadhiAvailable: showPricing && drugEntry?.janAushadhiPrice != null,
      matchMethod,
      showMatchedName,
      showPricing,
    };

    matchedMedicines.push(matched);

    // Only count genericName for interactions when trusted
    if (matched.genericName) {
      genericNames.push(matched.genericName);
    }
  }

  const foundInteractions = checkInteractions(genericNames);

  // Savings — only sum trusted matches
  let brandTotal = 0;
  let genericTotal = 0;
  for (const med of matchedMedicines) {
    if (med.brandPrice != null) brandTotal += med.brandPrice;
    if (med.genericPrice != null) genericTotal += med.genericPrice;
  }
  const savingsAmount = brandTotal - genericTotal;
  const savingsPercent = brandTotal > 0 ? Math.round((savingsAmount / brandTotal) * 100) : 0;

  return {
    medicines: matchedMedicines,
    interactions: foundInteractions,
    savings: {
      brandTotal,
      genericTotal,
      savingsAmount,
      savingsPercent,
    },
    doctorName: ocrResult.doctorName,
    patientName: ocrResult.patientName || null,
    clinicName: ocrResult.clinicName,
    date: ocrResult.date,
    diagnosis: ocrResult.diagnosis,
    overallReadability: ocrResult.overallReadability,
    doctorNotes: Array.isArray(ocrResult.doctorNotes) ? ocrResult.doctorNotes : [],
    aiSummary: ocrResult.aiSummary ?? null,
    aiConfidence: typeof ocrResult.aiConfidence === 'number' ? ocrResult.aiConfidence : null,
  };
}