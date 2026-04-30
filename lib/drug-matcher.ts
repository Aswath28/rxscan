import drugsData from '@/data/drugs.json';
import brandMappings from '@/data/brand-mappings.json';
import interactionsData from '@/data/drug-interactions.json';

function isLikelyGibberish(name: string, ocrConfidence: string): boolean {
  if (!name || name.trim().length < 4) return true;
  if (ocrConfidence === 'low') return true;
  const letterRatio = (name.match(/[a-zA-Z]/g) || []).length / name.length;
  if (letterRatio < 0.5) return true;
  if (!/[aeiouAEIOU]/.test(name)) return true;
  return false;
}

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

// 'exact'      : brand name matched exactly (Augmentin → Augmentin)
// 'prefix'     : one is a prefix of the other (Pan → Pan 40)
// 'fuzzy'      : Levenshtein close enough to pass threshold (never auto-trusted)
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
  matchMethod: MatchMethod;
  source: 'verified' | 'untrusted_match' | 'ai_fallback' | 'unknown';
  showMatchedName: boolean;
  showPricing: boolean;
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
// BRAND MATCHING
// ============================================================

const brandMap = brandMappings as Record<string, { generic: string; dosage: string }>;
const drugs = drugsData as any[];
const interactions = interactionsData as any[];

interface BrandMatchResult {
  mapping: { generic: string; dosage: string };
  method: 'exact' | 'prefix' | 'fuzzy';
  matchedBrandName: string;
}

function matchBrand(ocrName: string): BrandMatchResult | null {
  const normalized = normalize(ocrName);

  // 1. Exact
  for (const [brand, mapping] of Object.entries(brandMap)) {
    if (normalize(brand) === normalized) {
      return { mapping, method: 'exact', matchedBrandName: brand };
    }
  }

  // 2. Starts-with (either direction)
  // SAFETY FIX: require ≥4 chars of overlap. Prevents bogus prefix matches
  // like "Pan" (3 chars) latching onto random P-a-n brands.
  for (const [brand, mapping] of Object.entries(brandMap)) {
    const brandNorm = normalize(brand);
    const overlap = Math.min(brandNorm.length, normalized.length);
    if (overlap < 4) continue;
    if (brandNorm.startsWith(normalized) || normalized.startsWith(brandNorm)) {
      return { mapping, method: 'prefix', matchedBrandName: brand };
    }
  }

  // 3. Fuzzy
  // SAFETY FIX: short brand names (≤7 chars) get NO fuzzy matching at all.
  // They've already had exact + prefix shots above. Fuzzy on short names is
  // how Cefolac → Cefixime, Calpol → Calpan-class errors creep in:
  // a single character flip on a 7-char name is a different drug.
  const ocrNamePart = normalized.replace(/\d+.*/g, '').trim();
  if (ocrNamePart.length < 4) return null;
  if (ocrNamePart.length <= 7) return null;

  // Names 8+ chars: tighter thresholds than before
  const maxDistance = ocrNamePart.length <= 9 ? 1 : 2;
  const minRatio = 0.85; // was 0.6 — much stricter

  let bestMatch: {
    mapping: { generic: string; dosage: string };
    distance: number;
    ratio: number;
    brand: string;
  } | null = null;

  for (const [brand, mapping] of Object.entries(brandMap)) {
    const brandNamePart = normalize(brand).replace(/\d+.*/g, '').trim();
    if (brandNamePart.length < 4) continue;
    if (Math.abs(ocrNamePart.length - brandNamePart.length) > maxDistance) continue;

    const distance = levenshtein(ocrNamePart, brandNamePart);
    const maxLen = Math.max(ocrNamePart.length, brandNamePart.length);
    const ratio = 1 - distance / maxLen;

    if (distance <= maxDistance && ratio >= minRatio) {
      if (
        !bestMatch ||
        ratio > bestMatch.ratio ||
        (ratio === bestMatch.ratio && distance < bestMatch.distance)
      ) {
        bestMatch = { mapping, distance, ratio, brand };
      }
    }
  }

  return bestMatch
    ? { mapping: bestMatch.mapping, method: 'fuzzy', matchedBrandName: bestMatch.brand }
    : null;
}

// ============================================================
// DRUG DATABASE LOOKUP
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
      (name) =>
        interactionDrugs[0] &&
        (name.includes(interactionDrugs[0]) || interactionDrugs[0].includes(name))
    );
    const drug2Present = normalizedNames.some(
      (name) =>
        interactionDrugs[1] &&
        (name.includes(interactionDrugs[1]) || interactionDrugs[1].includes(name))
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

    let matchMethod: MatchMethod;
    if (brandMatch?.method === 'exact' && drugEntry) {
      matchMethod = 'exact';
    } else if (brandMatch?.method === 'prefix' && drugEntry) {
      matchMethod = 'prefix';
    } else if (brandMatch?.method === 'fuzzy' && drugEntry) {
      matchMethod = 'fuzzy';
    } else if (!brandMatch && drugEntry) {
      matchMethod = 'exact';
    } else {
      matchMethod = 'unmatched';
    }

    // Derive source for frontend dispatch.
    // - verified: trusted match, full data shown
    // - untrusted_match: fuzzy candidate, OCR-only display + verify banner
    // - ai_fallback: no DB match but name looks real, route to Haiku
    // - unknown: gibberish/illegible, no AI call
    let source: 'verified' | 'untrusted_match' | 'ai_fallback' | 'unknown';
    if (matchMethod === 'exact' || matchMethod === 'prefix') {
      source = 'verified';
    } else if (matchMethod === 'fuzzy') {
      source = 'untrusted_match';
    } else if (isLikelyGibberish(med.name, med.confidence)) {
      source = 'unknown';
    } else {
      source = 'ai_fallback';
    }

    // SAFETY FIX: fuzzy matches no longer get the green-light treatment.

    // SAFETY FIX: fuzzy matches no longer get the green-light treatment.
    // Even if the matcher cleared its own threshold, fuzzy is by definition
    // uncertain — surface it as untrusted, let the user verify.
    const showMatchedName = matchMethod === 'exact' || matchMethod === 'prefix';
    const showPricing = matchMethod === 'exact' || matchMethod === 'prefix';

    let finalConfidence = med.confidence;
    if (med.confidence === 'medium' && (matchMethod === 'exact' || matchMethod === 'prefix')) {
      finalConfidence = 'high';
    }
    if (med.confidence === 'high' && matchMethod === 'unmatched') {
      finalConfidence = 'medium';
    }

    // ============================================================
    // DOSAGE OVERRIDE FIX
    // ============================================================
    // OCR-extracted dosage from the prescription is the ground truth.
    // The brand-mapping default dosage is just a fallback for when OCR
    // didn't read one. Doctor wrote "Calpol 650mg" → user takes 650mg,
    // not whatever default we happen to have in brand-mappings.json.
    const effectiveDosage = (med.dosage && med.dosage.trim())
      ? med.dosage.trim()
      : (brandMatch?.mapping.dosage || '');

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

    const finalBrandPrice = showPricing ? brandPrice : null;
    const finalGenericPrice = showPricing ? drugEntry?.janAushadhiPrice ?? null : null;

    // Build matched name using OCR dosage (the override fix in action)
    let matchedDrug: string | null = null;
    if (showMatchedName && brandMatch) {
      const moleculeName = brandMatch.mapping.generic;
      matchedDrug = effectiveDosage
        ? `${moleculeName} ${effectiveDosage}`
        : moleculeName;
    } else if (showMatchedName && drugEntry) {
      matchedDrug = effectiveDosage
        ? `${drugEntry.genericName} ${effectiveDosage}`
        : drugEntry.genericName;
    }

    const matched: MatchedMedicine = {
      ...med,
      dosage: effectiveDosage || med.dosage, // preserve OCR dosage in raw field too
      confidence: finalConfidence,
      ocrReading: med.name,
      matchedDrug,
      genericName: showMatchedName
        ? brandMatch?.mapping.generic || drugEntry?.genericName || null
        : null,
      category: showMatchedName ? drugEntry?.category || null : null,
      description: showMatchedName ? drugEntry?.description || null : null,
      howToTake: showMatchedName ? drugEntry?.howToTake || null : null,
      commonSideEffects: showMatchedName ? drugEntry?.commonSideEffects || [] : [],
      brandPrice: finalBrandPrice,
      genericPrice: finalGenericPrice,
      janAushadhiAvailable: showPricing && drugEntry?.janAushadhiPrice != null,
      matchMethod,
      source,
      showMatchedName,
      showPricing,
    };

    matchedMedicines.push(matched);

    if (matched.genericName) {
      genericNames.push(matched.genericName);
    }
  }

  const foundInteractions = checkInteractions(genericNames);

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