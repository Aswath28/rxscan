import drugsData from '@/data/drugs.json';
import brandMappings from '@/data/brand-mappings.json';
import interactionsData from '@/data/drug-interactions.json';

// ============================================================
// TYPES
// ============================================================

interface OCRMedicine {
  name: string;
  dosage: string | null;
  frequency: string;
  frequencyPlain: string;
  duration: string | null;
  instructions: string | null;
  confidence: 'high' | 'medium' | 'low';
  formulation: string;
}

interface OCRResult {
  medicines: OCRMedicine[];
  doctorName: string | null;
  patientName: string | null;
  clinicName: string | null;
  date: string | null;
  diagnosis: string | null;
  overallReadability: 'good' | 'fair' | 'poor';
  totalMedicines: number;
}

interface MatchedMedicine extends OCRMedicine {
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
}

interface Interaction {
  drug1: string;
  drug2: string;
  severity: 'severe' | 'moderate' | 'mild';
  effect: string;
  recommendation: string;
}

interface AnalysisResult {
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
}

// ============================================================
// HELPERS
// ============================================================

// Normalize a string for comparison: lowercase, trim, remove extra spaces
function normalize(str: string): string {
  return str.toLowerCase().trim().replace(/\s+/g, ' ');
}

// Levenshtein distance between two strings
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
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

// ============================================================
// BRAND MATCHING — exact match, then fuzzy
// ============================================================

const brandMap = brandMappings as Record<string, { generic: string; dosage: string }>;
const drugs = drugsData as any[];
const interactions = interactionsData as any[];

function matchBrand(ocrName: string): { generic: string; dosage: string } | null {
  const normalized = normalize(ocrName);

  // 1. Exact match (case-insensitive)
  for (const [brand, mapping] of Object.entries(brandMap)) {
    if (normalize(brand) === normalized) {
      return mapping;
    }
  }

  // 2. Starts-with match (e.g., "Augmentin" matches "Augmentin 625")
  for (const [brand, mapping] of Object.entries(brandMap)) {
    if (normalize(brand).startsWith(normalized) || normalized.startsWith(normalize(brand))) {
      return mapping;
    }
  }

  // 3. Fuzzy match — dynamic Levenshtein tolerance based on word length
  //    Short names (3-5 chars): max 1 edit (strict — "Pan" shouldn't match "Ran")
  //    Medium names (6-9 chars): max 2 edits
  //    Long names (10+ chars): max 3 edits
  //    Also uses similarity ratio (1 - distance/maxLen) to pick the best match
  //    This reduces inconsistency between phone and browser OCR (Bug #2)
  const ocrNamePart = normalized.replace(/\d+.*/g, '').trim();
  if (ocrNamePart.length < 3) return null; // too short to fuzzy match reliably

  const maxDistance = ocrNamePart.length <= 5 ? 1 : ocrNamePart.length <= 9 ? 2 : 3;

  let bestMatch: { brand: string; mapping: { generic: string; dosage: string }; distance: number; ratio: number } | null = null;

  for (const [brand, mapping] of Object.entries(brandMap)) {
    const brandNamePart = normalize(brand).replace(/\d+.*/g, '').trim();
    
    // Skip if length difference is too large — no point computing Levenshtein
    if (Math.abs(ocrNamePart.length - brandNamePart.length) > maxDistance) continue;
    
    const distance = levenshtein(ocrNamePart, brandNamePart);
    const maxLen = Math.max(ocrNamePart.length, brandNamePart.length);
    const ratio = 1 - (distance / maxLen); // 1.0 = perfect, 0.0 = no match

    if (distance <= maxDistance && ratio >= 0.6) {
      if (!bestMatch || ratio > bestMatch.ratio || (ratio === bestMatch.ratio && distance < bestMatch.distance)) {
        bestMatch = { brand, mapping, distance, ratio };
      }
    }
  }

  return bestMatch ? bestMatch.mapping : null;
}

// ============================================================
// DRUG DATABASE LOOKUP — find the drug entry by generic name
// ============================================================

function findDrugByGeneric(genericName: string): any | null {
  const normalized = normalize(genericName);

  // Exact match
  for (const drug of drugs) {
    if (normalize(drug.genericName) === normalized) {
      return drug;
    }
  }

  // Partial match — generic name contains or is contained by
  for (const drug of drugs) {
    const drugNorm = normalize(drug.genericName);
    if (drugNorm.includes(normalized) || normalized.includes(drugNorm)) {
      return drug;
    }
  }

  // Match on first component of combination drugs (e.g., "Pantoprazole + Domperidone")
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
// INTERACTION CHECKER — check all medicine pairs
// ============================================================

function checkInteractions(genericNames: string[]): Interaction[] {
  const found: Interaction[] = [];
  const normalizedNames = genericNames.map(normalize);

  for (const interaction of interactions) {
    const interactionDrugs = interaction.drugs.map((d: string) => normalize(d));

    // Check if both drugs in the interaction pair are present
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
// MAIN: analyzePrescription — the full pipeline
// ============================================================

export function analyzePrescription(ocrResult: OCRResult): AnalysisResult {
  const matchedMedicines: MatchedMedicine[] = [];
  const genericNames: string[] = [];

  for (const med of ocrResult.medicines) {
    // Step 1: Try to match the OCR name to a brand
    const brandMatch = matchBrand(med.name);

    // Step 2: Look up drug details from the database
    const genericName = brandMatch?.generic || med.name;
    const drugEntry = findDrugByGeneric(genericName);

    // Step 3: Find brand price from the drug entry
    let brandPrice: number | null = null;
    if (drugEntry && drugEntry.commonBrands && drugEntry.commonBrands.length > 0) {
      // Try to find the exact brand, otherwise use the first one
      const exactBrand = drugEntry.commonBrands.find(
        (b: any) => normalize(b.name) === normalize(med.name) ||
          normalize(med.name).includes(normalize(b.name))
      );
      brandPrice = exactBrand ? exactBrand.mrp : drugEntry.commonBrands[0].mrp;
    }

    // Step 4: Build the matched medicine object
    const matched: MatchedMedicine = {
      ...med,
      ocrReading: med.name,
      matchedDrug: brandMatch
        ? `${brandMatch.generic} ${brandMatch.dosage}`
        : drugEntry
        ? `${drugEntry.genericName} ${med.dosage || ''}`
        : null,
      genericName: brandMatch?.generic || drugEntry?.genericName || null,
      category: drugEntry?.category || null,
      description: drugEntry?.description || null,
      howToTake: drugEntry?.howToTake || null,
      commonSideEffects: drugEntry?.commonSideEffects || [],
      brandPrice: brandPrice,
      genericPrice: drugEntry?.janAushadhiPrice || null,
      janAushadhiAvailable: drugEntry?.janAushadhiPrice != null,
    };

    matchedMedicines.push(matched);

    // Collect generic names for interaction checking
    if (matched.genericName) {
      genericNames.push(matched.genericName);
    }
  }

  // Step 5: Check interactions across all medicines
  const foundInteractions = checkInteractions(genericNames);

  // Step 6: Calculate savings
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
  };
}