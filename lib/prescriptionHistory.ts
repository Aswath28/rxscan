// ============================================================
// lib/prescriptionHistory.ts
// Prescription history stored in browser localStorage
// ============================================================

// ---- Types ----

export interface SavedMedicine {
  ocrReading: string;
  name: string;
  matchedDrug: string;
  genericName: string | null;
  dosage: string;
  frequency: string;
  frequencyPlain: string;
  duration: string;
  instructions: string | null;
  formulation: string;
  confidence: 'high' | 'medium' | 'low';
  category: string | null;
  whatItIs: string | null;
  whatItDoes: string | null;
  howToTake: string | null;
  sideEffects: string[];
  brandPrice: number;
  genericPrice: number;
  janAushadhiAvailable: boolean;
}

export interface SavedInteraction {
  drug1: string;
  drug2: string;
  severity: 'severe' | 'moderate' | 'mild';
  effect: string;
  recommendation: string;
}

export interface SavedPrescription {
  id: string;
  savedAt: string;                // ISO timestamp
  doctorName: string | null;
  date: string | null;            // prescription date from OCR
  diagnosis: string | null;
  overallReadability: 'good' | 'fair' | 'poor';
  medicines: SavedMedicine[];
  interactions: SavedInteraction[];
  totalBrandCost: number;
  totalGenericCost: number;
  totalSavings: number;
}

export interface CrossPrescriptionAlert {
  drug1: string;
  drug1Doctor: string;
  drug1PrescriptionId: string;
  drug2: string;
  drug2Doctor: string;
  drug2PrescriptionId: string;
  severity: 'severe' | 'moderate' | 'mild';
  effect: string;
  recommendation: string;
}

// ---- Constants ----

const STORAGE_KEY = 'rxscan_prescriptions';

// Known cross-drug interactions to check across prescriptions
// This mirrors your data/drug-interactions.json structure
// We'll import the real one later — for now, this checks against
// the same pairs your interaction engine already knows about
const CROSS_INTERACTIONS: Array<{
  drug1: string;
  drug2: string;
  severity: 'severe' | 'moderate' | 'mild';
  effect: string;
  recommendation: string;
}> = [
  {
    drug1: "Clopidogrel",
    drug2: "Omeprazole",
    severity: "moderate",
    effect: "Omeprazole may reduce the antiplatelet effect of Clopidogrel, increasing the risk of cardiovascular events.",
    recommendation: "Consider using Pantoprazole instead. Discuss with your doctor.",
  },
  {
    drug1: "Warfarin",
    drug2: "Aspirin",
    severity: "severe",
    effect: "Increased risk of serious bleeding when taken together.",
    recommendation: "This combination requires careful medical supervision. Discuss with your doctor immediately.",
  },
  {
    drug1: "Metformin",
    drug2: "Alcohol",
    severity: "severe",
    effect: "Risk of lactic acidosis, a rare but dangerous condition.",
    recommendation: "Avoid alcohol while taking Metformin. Discuss with your doctor.",
  },
  {
    drug1: "ACE Inhibitor",
    drug2: "Potassium",
    severity: "moderate",
    effect: "May lead to dangerously high potassium levels (hyperkalemia).",
    recommendation: "Regular blood tests recommended. Discuss with your doctor.",
  },
  {
    drug1: "Atorvastatin",
    drug2: "Erythromycin",
    severity: "moderate",
    effect: "Erythromycin can increase Atorvastatin levels, raising risk of muscle damage.",
    recommendation: "Monitor for muscle pain or weakness. Discuss with your doctor.",
  },
  {
    drug1: "Amlodipine",
    drug2: "Simvastatin",
    severity: "moderate",
    effect: "Amlodipine may increase Simvastatin levels, raising risk of muscle side effects.",
    recommendation: "Simvastatin dose should not exceed 20mg when taken with Amlodipine. Discuss with your doctor.",
  },
  {
    drug1: "Diclofenac",
    drug2: "Aspirin",
    severity: "moderate",
    effect: "Increased risk of gastrointestinal bleeding and may reduce Aspirin's cardioprotective effect.",
    recommendation: "Avoid taking together if possible. Discuss with your doctor.",
  },
  {
    drug1: "Ciprofloxacin",
    drug2: "Antacid",
    severity: "moderate",
    effect: "Antacids containing aluminium or magnesium can significantly reduce Ciprofloxacin absorption.",
    recommendation: "Take Ciprofloxacin at least 2 hours before or 6 hours after antacids.",
  },
];

// ---- Helper: generate unique ID ----

function generateId(): string {
  // crypto.randomUUID() isn't available in all browsers
  // This gives a good-enough unique ID for localStorage
  return Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 9);
}

// ---- Core functions ----

/**
 * Save a prescription analysis result to localStorage.
 * Returns the saved prescription object with its generated ID.
 */
export function savePrescription(result: any): SavedPrescription {
  const medicines: SavedMedicine[] = (result.medicines || []).map((med: any) => ({
    ocrReading: med.ocrReading || med.name || '',
    name: med.name || med.ocrReading || '',
    matchedDrug: med.matchedDrug || med.genericName || med.name || '',
    genericName: med.genericName || null,
    dosage: med.dosage || '',
    frequency: med.frequency || '',
    frequencyPlain: med.frequencyPlain || med.frequency || '',
    duration: med.duration || '',
    instructions: med.instructions || null,
    formulation: med.formulation || 'tablet',
    confidence: med.confidence || 'medium',
    category: med.category || null,
    whatItIs: med.whatItIs || null,
    whatItDoes: med.whatItDoes || null,
    howToTake: med.howToTake || null,
    sideEffects: med.sideEffects || [],
    brandPrice: med.brandPrice || 0,
    genericPrice: med.genericPrice || 0,
    janAushadhiAvailable: med.janAushadhiAvailable || false,
  }));

  const interactions: SavedInteraction[] = (result.interactions || []).map((int: any) => ({
    drug1: int.drug1,
    drug2: int.drug2,
    severity: int.severity || 'moderate',
    effect: int.effect,
    recommendation: int.recommendation,
  }));

  const totalBrandCost = medicines.reduce((sum, m) => sum + m.brandPrice, 0);
  const totalGenericCost = medicines.reduce((sum, m) => sum + m.genericPrice, 0);

  const prescription: SavedPrescription = {
    id: generateId(),
    savedAt: new Date().toISOString(),
    doctorName: result.doctorName || null,
    date: result.date || null,
    diagnosis: result.diagnosis || null,
    overallReadability: result.overallReadability || 'fair',
    medicines,
    interactions,
    totalBrandCost,
    totalGenericCost,
    totalSavings: totalBrandCost - totalGenericCost,
  };

  // Get existing prescriptions, add new one, save back
  const existing = getAllPrescriptions();
  existing.unshift(prescription); // newest first
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));

  return prescription;
}

/**
 * Get all saved prescriptions, newest first.
 */
export function getAllPrescriptions(): SavedPrescription[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedPrescription[];
  } catch {
    return [];
  }
}

/**
 * Delete a single prescription by ID.
 */
export function deletePrescription(id: string): void {
  const prescriptions = getAllPrescriptions().filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prescriptions));
}

/**
 * Get all medicines across all saved prescriptions.
 * Deduplicated by matchedDrug name — if the same drug appears in
 * multiple prescriptions, keeps the most recent one.
 */
export function getAllMedicines(): (SavedMedicine & { fromDoctor: string | null; prescriptionId: string })[] {
  const prescriptions = getAllPrescriptions();
  const seen = new Map<string, SavedMedicine & { fromDoctor: string | null; prescriptionId: string }>();

  for (const rx of prescriptions) {
    for (const med of rx.medicines) {
      const key = (med.matchedDrug || med.name).toLowerCase().trim();
      if (!seen.has(key)) {
        seen.set(key, {
          ...med,
          fromDoctor: rx.doctorName,
          prescriptionId: rx.id,
        });
      }
    }
  }

  return Array.from(seen.values());
}

/**
 * Check for drug interactions ACROSS prescriptions.
 * This is the "wow" feature — Clopidogrel from Dr. A + Omeprazole from Dr. B.
 *
 * Returns alerts only for interactions between medicines from DIFFERENT prescriptions.
 * (Within-prescription interactions are already shown on the results screen.)
 */
export function checkCrossPrescriptionInteractions(): CrossPrescriptionAlert[] {
  const prescriptions = getAllPrescriptions();
  if (prescriptions.length < 2) return [];

  const alerts: CrossPrescriptionAlert[] = [];

  // Build a flat list of all medicines with their prescription context
  const allMeds: Array<{
    genericName: string;
    matchedDrug: string;
    doctor: string;
    prescriptionId: string;
  }> = [];

  for (const rx of prescriptions) {
    for (const med of rx.medicines) {
      allMeds.push({
        genericName: (med.genericName || med.matchedDrug || med.name).toLowerCase(),
        matchedDrug: med.matchedDrug || med.name,
        doctor: rx.doctorName || 'Unknown doctor',
        prescriptionId: rx.id,
      });
    }
  }

  // Check every pair of medicines from DIFFERENT prescriptions
  for (let i = 0; i < allMeds.length; i++) {
    for (let j = i + 1; j < allMeds.length; j++) {
      // Skip pairs from the same prescription
      if (allMeds[i].prescriptionId === allMeds[j].prescriptionId) continue;

      const med1 = allMeds[i];
      const med2 = allMeds[j];

      // Check against known interaction pairs
      for (const interaction of CROSS_INTERACTIONS) {
        const d1 = interaction.drug1.toLowerCase();
        const d2 = interaction.drug2.toLowerCase();

        const match =
          (med1.genericName.includes(d1) && med2.genericName.includes(d2)) ||
          (med1.genericName.includes(d2) && med2.genericName.includes(d1));

        if (match) {
          // Avoid duplicate alerts
          const alertKey = [med1.matchedDrug, med2.matchedDrug].sort().join('|');
          const alreadyAdded = alerts.some(
            (a) => [a.drug1, a.drug2].sort().join('|') === alertKey
          );

          if (!alreadyAdded) {
            alerts.push({
              drug1: med1.matchedDrug,
              drug1Doctor: med1.doctor,
              drug1PrescriptionId: med1.prescriptionId,
              drug2: med2.matchedDrug,
              drug2Doctor: med2.doctor,
              drug2PrescriptionId: med2.prescriptionId,
              severity: interaction.severity,
              effect: interaction.effect,
              recommendation: interaction.recommendation,
            });
          }
        }
      }
    }
  }

  return alerts;
}

/**
 * Clear all saved prescription history.
 */
export function clearAllHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Get total savings across all saved prescriptions.
 */
export function getTotalSavings(): { totalBrand: number; totalGeneric: number; totalSavings: number; prescriptionCount: number } {
  const prescriptions = getAllPrescriptions();
  const totalBrand = prescriptions.reduce((sum, rx) => sum + rx.totalBrandCost, 0);
  const totalGeneric = prescriptions.reduce((sum, rx) => sum + rx.totalGenericCost, 0);

  return {
    totalBrand,
    totalGeneric,
    totalSavings: totalBrand - totalGeneric,
    prescriptionCount: prescriptions.length,
  };
}