'use client';

import { useState } from 'react';

// ============================================================
// MOCK DATA — Realistic prescription result from your API pipeline
// This mirrors what /api/scan-prescription + fuzzy match + interactions returns
// ============================================================

const MOCK_RESULT = {
  doctorName: "Dr. Ramesh Gupta",
  date: "02/04/2026",
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


// ============================================================
// COMPONENT: Savings Banner
// ============================================================

function SavingsBanner({ medicines }: { medicines: any[] }) {
  const brandTotal = medicines.reduce((sum, m) => sum + m.brandPrice, 0);
  const genericTotal = medicines.reduce((sum, m) => sum + m.genericPrice, 0);
  const savings = brandTotal - genericTotal;
  const savingsPercent = Math.round((savings / brandTotal) * 100);

  return (
    <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 p-5 text-white shadow-lg">
      <div className="text-sm font-medium text-emerald-100 tracking-wide uppercase">
        Potential Savings
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-4xl font-bold tracking-tight">₹{savings}</span>
        <span className="text-lg font-semibold text-emerald-200">({savingsPercent}%)</span>
      </div>
      <p className="mt-2 text-sm text-emerald-100">
        by switching to generic alternatives
      </p>

      {/* Price comparison bar */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-emerald-200">Branded</span>
          <span className="font-semibold">₹{brandTotal}</span>
        </div>
        <div className="h-3 w-full rounded-full bg-white/20 overflow-hidden">
          <div className="h-full rounded-full bg-white" style={{ width: '100%' }} />
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-emerald-200">Generic</span>
          <span className="font-semibold">₹{genericTotal}</span>
        </div>
        <div className="h-3 w-full rounded-full bg-white/20 overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-300"
            style={{ width: `${(genericTotal / brandTotal) * 100}%` }}
          />
        </div>
      </div>

      <p className="mt-4 text-xs text-emerald-200/80 leading-relaxed">
        Generic medicines are CDSCO-certified as bioequivalent. Ask your doctor or pharmacist before switching.
      </p>
    </div>
  );
}


// ============================================================
// COMPONENT: Confidence Badge
// ============================================================

function ConfidenceBadge({ level }: { level: 'high' | 'medium' | 'low' }) {
  const config = {
    high: { emoji: '🟢', label: 'High confidence', bg: 'bg-green-50 text-green-700 border-green-200' },
    medium: { emoji: '🟡', label: 'Verify this', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
    low: { emoji: '🔴', label: 'Low confidence', bg: 'bg-red-50 text-red-700 border-red-200' },
  };
  const c = config[level];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${c.bg}`}>
      <span>{c.emoji}</span> {c.label}
    </span>
  );
}


// ============================================================
// COMPONENT: Medicine Card (expandable)
// ============================================================

function MedicineCard({ medicine, index }: { medicine: any; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const savingsPercent = Math.round(((medicine.brandPrice - medicine.genericPrice) / medicine.brandPrice) * 100);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md">
      {/* Card Header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4 flex items-start gap-3"
      >
        {/* Medicine number pill */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-sm font-bold mt-0.5">
          {index + 1}
        </div>

        <div className="flex-1 min-w-0">
          {/* OCR reading → matched name */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-slate-900 text-base leading-tight">
                {medicine.name}
              </h3>
              <p className="text-sm text-slate-500 mt-0.5">
                {medicine.matchedDrug}
              </p>
            </div>
            <ConfidenceBadge level={medicine.confidence} />
          </div>

          {/* Dosage + frequency summary */}
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 text-xs font-medium text-slate-600">
              💊 {medicine.dosage}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 text-xs font-medium text-slate-600">
              🕐 {medicine.frequencyPlain}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 text-xs font-medium text-slate-600">
              📅 {medicine.duration}
            </span>
            {medicine.instructions && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 text-xs font-medium text-blue-600">
                ℹ️ {medicine.instructions}
              </span>
            )}
          </div>

          {/* Savings teaser */}
          <div className="mt-2 flex items-center gap-2 text-sm">
            <span className="text-slate-400 line-through">₹{medicine.brandPrice}</span>
            <span className="font-semibold text-emerald-600">₹{medicine.genericPrice} generic</span>
            <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded">
              Save {savingsPercent}%
            </span>
          </div>
        </div>

        {/* Expand chevron */}
        <div className="flex-shrink-0 mt-1">
          <svg
            className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-slate-100">
          <div className="mt-4 space-y-4">
            {/* What it is */}
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                What this medicine is
              </h4>
              <p className="text-sm text-slate-700 leading-relaxed">{medicine.whatItIs}</p>
            </div>

            {/* What it does */}
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                What it does for you
              </h4>
              <p className="text-sm text-slate-700 leading-relaxed">{medicine.whatItDoes}</p>
            </div>

            {/* How to take */}
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                How to take it
              </h4>
              <p className="text-sm text-slate-700 leading-relaxed">{medicine.howToTake}</p>
            </div>

            {/* Side effects */}
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Common side effects
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {(medicine.sideEffects || []).map((effect: string, i: number) => (
                  <span key={i} className="px-2 py-1 rounded-md bg-orange-50 text-xs text-orange-700 border border-orange-100">
                    {effect}
                  </span>
                ))}
              </div>
            </div>

            {/* Generic alternative box */}
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                    Generic Alternative
                  </h4>
                  <p className="text-sm font-medium text-emerald-900 mt-0.5">{medicine.genericName}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-emerald-700">₹{medicine.genericPrice}</div>
                  <div className="text-xs text-slate-500 line-through">₹{medicine.brandPrice}</div>
                </div>
              </div>
              {medicine.janAushadhiAvailable && (
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                    🏪 Available at Jan Aushadhi Kendra
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ============================================================
// COMPONENT: Interaction Alert
// ============================================================

function InteractionAlert({ interaction }: { interaction: any }) {
  const severityConfig = {
    severe: { bg: 'bg-red-50 border-red-300', icon: '🔴', label: 'Severe', text: 'text-red-800' },
    moderate: { bg: 'bg-amber-50 border-amber-300', icon: '🟡', label: 'Moderate', text: 'text-amber-800' },
    mild: { bg: 'bg-blue-50 border-blue-200', icon: '🔵', label: 'Mild', text: 'text-blue-800' },
  };
  const config = severityConfig[interaction.severity];

  return (
    <div className={`rounded-xl border-2 ${config.bg} p-4`}>
      <div className="flex items-start gap-3">
        <span className="text-xl mt-0.5">{config.icon}</span>
        <div>
          <div className="flex items-center gap-2">
            <h4 className={`font-semibold text-sm ${config.text}`}>
              {config.label} Interaction
            </h4>
          </div>
          <p className={`text-sm mt-1 ${config.text} font-medium`}>
            {interaction.drug1} + {interaction.drug2}
          </p>
          <p className="text-sm text-slate-600 mt-1 leading-relaxed">
            {interaction.effect}
          </p>
          <p className="text-sm text-slate-700 mt-2 font-medium leading-relaxed">
            💡 {interaction.recommendation}
          </p>
        </div>
      </div>
    </div>
  );
}


// ============================================================
// COMPONENT: Prescription Header
// ============================================================

function PrescriptionHeader({ doctorName, date, readability }: {
  doctorName: string | null;
  date: string | null;
  readability: 'good' | 'fair' | 'poor';
}) {
  const readabilityConfig = {
    good: { label: 'Clear', color: 'text-green-600' },
    fair: { label: 'Partially legible', color: 'text-amber-600' },
    poor: { label: 'Hard to read', color: 'text-red-600' },
  };
  const r = readabilityConfig[readability];

  return (
    <div className="flex items-center justify-between py-3">
      <div>
        {doctorName && (
          <h2 className="font-semibold text-slate-800 text-base">{doctorName}</h2>
        )}
        {date && (
          <p className="text-sm text-slate-500">{date}</p>
        )}
      </div>
      <div className={`text-xs font-medium ${r.color}`}>
        Readability: {r.label}
      </div>
    </div>
  );
}


// ============================================================
// MAIN: Results Screen
// ============================================================

interface ResultsScreenProps {
  result: any;
  onScanAnother: () => void;
  onBack: () => void;
}

export default function ResultsScreen({ result, onScanAnother, onBack }: ResultsScreenProps) {
  // Map API response to what the components expect
  const medicines = (result.medicines || []).map((med: any) => ({
    ...med,
    name: med.ocrReading || med.name,
    matchedDrug: med.matchedDrug || med.genericName || med.name,
    genericName: med.genericName || null,
    category: med.category || null,
    whatItIs: med.description || null,
    whatItDoes: med.description || null,
    howToTake: med.howToTake || med.instructions || null,
    sideEffects: med.commonSideEffects || [],
    brandPrice: med.brandPrice || 0,
    genericPrice: med.genericPrice || 0,
    janAushadhiAvailable: med.janAushadhiAvailable || false,
    confidence: med.confidence || 'medium',
    frequencyPlain: med.frequencyPlain || med.frequency || '',
    dosage: med.dosage || '',
    duration: med.duration || '',
    instructions: med.instructions || null,
    formulation: med.formulation || 'tablet',
  }));

  const interactions = (result.interactions || []).map((int: any) => ({
    drug1: int.drug1,
    drug2: int.drug2,
    severity: int.severity || 'moderate',
    effect: int.effect,
    recommendation: int.recommendation,
  }));

  const hasInteractions = interactions.length > 0;

  // Build share text
  const brandTotal = medicines.reduce((s: number, m: any) => s + (m.brandPrice || 0), 0);
  const genericTotal = medicines.reduce((s: number, m: any) => s + (m.genericPrice || 0), 0);
  const savingsAmount = brandTotal - genericTotal;

  const shareText = [
    `💊 RxScan Report`,
    result.doctorName ? `Scanned ${medicines.length} medicines from ${result.doctorName}'s prescription` : `Scanned ${medicines.length} medicines`,
    ``,
    `💰 You could save ₹${savingsAmount} by switching to generics!`,
    ``,
    `Branded cost: ₹${brandTotal}`,
    `Generic cost: ₹${genericTotal}`,
    ``,
    `Try RxScan free: https://rxscan.vercel.app`,
  ].join('\n');

  const handleShareWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleShare = async () => {
    // Use native share if available (mobile), otherwise copy to clipboard
    if (navigator.share) {
      try {
        await navigator.share({ title: 'RxScan Report', text: shareText });
      } catch {
        // User cancelled — do nothing
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        alert('Report copied to clipboard!');
      } catch {
        // Fallback — open WhatsApp
        handleShareWhatsApp();
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={onBack} className="text-slate-600 hover:text-slate-900 flex items-center gap-1 text-sm font-medium">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 onClick={onBack} className="font-bold text-slate-900 text-lg tracking-tight cursor-pointer">
            Rx<span className="text-emerald-600">Scan</span>
          </h1>
          <button onClick={handleShare} className="text-slate-600 hover:text-slate-900">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 pb-32">
        {/* Doctor + date */}
        <PrescriptionHeader
          doctorName={result.doctorName || null}
          date={result.date || null}
          readability={result.overallReadability || 'fair'}
        />

        {/* Savings banner */}
        <SavingsBanner medicines={medicines} />

        {/* Interaction alerts */}
        {hasInteractions && (
          <div className="mt-5 space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              ⚠️ Interaction Alerts
            </h3>
            {interactions.map((interaction: any, i: number) => (
              <InteractionAlert key={i} interaction={interaction} />
            ))}
          </div>
        )}

        {/* Medicine cards */}
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Your Medicines ({medicines.length})
            </h3>
            <span className="text-xs text-slate-400">Tap to expand</span>
          </div>
          {medicines.map((medicine: any, i: number) => (
            <MedicineCard key={i} medicine={medicine} index={i} />
          ))}
        </div>

        {/* OCR disclaimer */}
        <div className="mt-6 rounded-lg bg-slate-100 p-3">
          <p className="text-xs text-slate-500 leading-relaxed">
            ⓘ AI-powered reading may not be 100% accurate. Please verify each medicine 
            name and dosage against your prescription before relying on this information.
          </p>
        </div>
      </main>

      {/* Bottom action bar — fixed */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="max-w-lg mx-auto flex gap-3">
          <button onClick={handleShareWhatsApp} className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share on WhatsApp
          </button>
          <button onClick={onScanAnother} className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-4 rounded-xl text-sm transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Scan New
          </button>
        </div>
      </div>

      {/* Global disclaimer */}
      <div className="max-w-lg mx-auto px-4 pb-6 mt-2">
        <p className="text-[11px] text-slate-400 leading-relaxed text-center">
          RxScan helps you understand your prescription. It is NOT medical advice. 
          Always confirm with your doctor or pharmacist before making any changes to your medication.
        </p>
      </div>
    </div>
  );
}
