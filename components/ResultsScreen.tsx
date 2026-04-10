'use client';

import { useState } from 'react';

import { savePrescription } from '@/lib/prescriptionHistory';

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
  const brandTotal = medicines.reduce((sum, m) => sum + (m.brandPrice || 0), 0);
  const genericTotal = medicines.reduce((sum, m) => sum + (m.genericPrice || 0), 0);
  const savings = brandTotal - genericTotal;
  const savingsPercent = brandTotal > 0 ? Math.round((savings / brandTotal) * 100) : 0;

  // BUG #4 FIX: Show contextual message when no pricing data is available
  const hasPricingData = medicines.some((m) => m.brandPrice > 0 || m.genericPrice > 0);

  if (!hasPricingData) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-slate-500 to-slate-700 p-5 text-white shadow-lg">
        <div className="flex items-start gap-3">
          <span className="text-2xl mt-0.5">💊</span>
          <div>
            <div className="text-sm font-semibold text-white">
              Pricing data not available
            </div>
            <p className="mt-1 text-sm text-slate-200 leading-relaxed">
              We couldn't find pricing information for the medicines in this prescription.
              This usually means these medicines aren't in our database yet. You can still
              review the medicine details below.
            </p>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              Ask your pharmacist about generic alternatives — they may be available at
              a Jan Aushadhi Kendra near you.
            </p>
          </div>
        </div>
      </div>
    );
  }

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
            style={{ width: `${brandTotal > 0 ? (genericTotal / brandTotal) * 100 : 0}%` }}
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
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap flex-shrink-0 ${c.bg}`}>
      <span>{c.emoji}</span> {c.label}
    </span>
  );
}


// ============================================================
// COMPONENT: Medicine Card (expandable)
// ============================================================

function MedicineCard({ medicine, index }: { medicine: any; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const savingsPercent = medicine.brandPrice > 0
    ? Math.round(((medicine.brandPrice - medicine.genericPrice) / medicine.brandPrice) * 100)
    : 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4 flex items-start gap-3"
      >
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-sm font-bold mt-0.5">
          {index + 1}
        </div>

        <div className="flex-1 min-w-0">
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

          {medicine.brandPrice > 0 && medicine.genericPrice > 0 && (
            <div className="mt-2 flex items-center gap-2 text-sm">
              <span className="text-slate-400 line-through">₹{medicine.brandPrice}</span>
              <span className="font-semibold text-emerald-600">₹{medicine.genericPrice} generic</span>
              <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded">
                Save {savingsPercent}%
              </span>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 mt-1">
          <svg
            className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-slate-100">
          <div className="mt-4 space-y-4">
            {medicine.whatItIs && (
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  What this medicine is
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed">{medicine.whatItIs}</p>
              </div>
            )}

            {medicine.whatItDoes && (
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  What it does for you
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed">{medicine.whatItDoes}</p>
              </div>
            )}

            {medicine.howToTake && (
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  How to take it
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed">{medicine.howToTake}</p>
              </div>
            )}

            {medicine.sideEffects && medicine.sideEffects.length > 0 && (
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
            )}

            {medicine.genericName && medicine.genericPrice > 0 && (
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
            )}
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
  const config = severityConfig[interaction.severity as keyof typeof severityConfig] || severityConfig.moderate;

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

function PrescriptionHeader({ doctorName, patientName, date, readability }: {
  doctorName: string | null;
  patientName: string | null;
  date: string | null;
  readability: 'good' | 'fair' | 'poor';
}) {
  const readabilityConfig = {
    good: { label: 'Clear', color: 'text-green-600' },
    fair: { label: 'Partially legible', color: 'text-amber-600' },
    poor: { label: 'Hard to read', color: 'text-red-600' },
  };
  const r = readabilityConfig[readability] || readabilityConfig.fair;

  return (
    <div className="flex items-center justify-between py-3">
      <div>
        {patientName && (
          <h2 className="font-semibold text-slate-800 text-base">{patientName}</h2>
        )}
        {doctorName && (
          <p className={`text-sm ${patientName ? 'text-slate-500' : 'font-semibold text-slate-800 text-base'}`}>
            {doctorName}
          </p>
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
// COMPONENT: Share Success Toast
// ============================================================

function Toast({ message, visible }: { message: string; visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
      <div className="bg-slate-900 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2">
        <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        {message}
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
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isSaved, setIsSaved] = useState(() => {
    if (typeof window === 'undefined') return false;
    if (result.isDemo) return false;
    try {
      const saved = JSON.parse(localStorage.getItem('rxscan_prescriptions') || '[]');
      return saved.some((rx: any) =>
        rx.doctorName === result.doctorName &&
        rx.date === result.date &&
        rx.medicines?.length === result.medicines?.length
      );
    } catch {
      return false;
    }
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  };

  const medicines = (result.medicines || []).map((med: any) => ({
    ...med,
    name: med.ocrReading || med.name,
    matchedDrug: med.matchedDrug || med.genericName || med.name,
    genericName: med.genericName || null,
    category: med.category || null,
    whatItIs: med.whatItIs || med.description || null,
    whatItDoes: med.whatItDoes || med.description || null,
    howToTake: med.howToTake || med.instructions || null,
    sideEffects: med.sideEffects || med.commonSideEffects || [],
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

  const brandTotal = medicines.reduce((s: number, m: any) => s + (m.brandPrice || 0), 0);
  const genericTotal = medicines.reduce((s: number, m: any) => s + (m.genericPrice || 0), 0);
  const savingsAmount = brandTotal - genericTotal;

  const buildShareText = () => {
    const medicineCount = medicines.length;
    const doctorName = result.doctorName || 'your doctor';

    const medicineLines = medicines
      .map((med: any) => {
        const name = med.name;
        const generic = med.genericName;
        if (generic && med.brandPrice > 0 && med.genericPrice > 0) {
          return `  • ${name} → ${generic} (₹${med.brandPrice} → ₹${med.genericPrice})`;
        }
        return `  • ${name}`;
      })
      .join('\n');

    let message = `💊 *RxScan Report*\n`;
    message += `Scanned ${medicineCount} medicine${medicineCount !== 1 ? 's' : ''} from ${doctorName}'s prescription\n\n`;

    if (savingsAmount > 0) {
      message += `💰 *You could save ₹${savingsAmount} by switching to generics!*\n\n`;
      message += `Branded cost: ₹${brandTotal}\n`;
      message += `Generic cost: ₹${genericTotal}\n\n`;
    }

    message += `*Medicines:*\n${medicineLines}\n\n`;

    if (hasInteractions) {
      message += `⚠️ ${interactions.length} drug interaction${interactions.length !== 1 ? 's' : ''} detected — discuss with your doctor\n\n`;
    }

    message += `Scan your prescription free → https://rxscan.vercel.app`;

    return message;
  };

  const handleShareWhatsApp = () => {
    const text = buildShareText();
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleShare = async () => {
    const text = buildShareText();

    if (navigator.share) {
      try {
        await navigator.share({ title: 'RxScan Report', text });
        return;
      } catch {
        // User cancelled or share failed
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      showToast('Report copied to clipboard!');
    } catch {
      handleShareWhatsApp();
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      showToast('Link copied!');
    } catch {
      // Silently fail
    }
  };

  // ---- Download shareable image card ----
  const handleDownloadCard = async () => {
    const canvas = document.createElement('canvas');
    const scale = 2; // 2x for retina
    const w = 540;
    const medCount = Math.min(result.medicines.length, 8);
    const h = Math.min(340 + medCount * 58 + (result.interactions.length > 0 ? 52 : 0) + (result.medicines.length > 8 ? 28 : 0), 900);
    canvas.width = w * scale;
    canvas.height = h * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(scale, scale);

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#047857');
    grad.addColorStop(0.3, '#065f46');
    grad.addColorStop(1, '#064e3b');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 16);
    ctx.fill();

    // Logo
    ctx.font = '500 22px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Rx', 32, 44);
    const rxW = ctx.measureText('Rx').width;
    ctx.fillStyle = '#6ee7b7';
    ctx.fillText('Scan', 32 + rxW, 44);

    // Savings section
    const savingsAmount = result.savings?.savingsAmount || 0;
    const savingsPercent = result.savings?.savingsPercent || 0;
    const hasPricing = savingsAmount > 0;

    let y = 70;
    if (hasPricing) {
      ctx.font = '11px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#6ee7b7';
      ctx.fillText('POTENTIAL SAVINGS', 32, y);
      y += 48;

      ctx.font = '500 48px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`₹${savingsAmount.toLocaleString('en-IN')}`, 32, y);
      y += 28;

      ctx.font = '14px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillText(`${savingsPercent}% less with generic alternatives`, 32, y);
      y += 36;
    } else {
      ctx.font = '12px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillText('Prescription analysis', 32, y);
      y += 28;
    }

    // Medicines label
    ctx.font = '11px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText('MEDICINES', 32, y);
    y += 18;

    // Medicine rows — name + generic only, no prices
    const medsToShow = result.medicines.slice(0, 8);
    for (const med of medsToShow) {
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.beginPath(); ctx.roundRect(32, y, w - 64, 48, 8); ctx.fill();

      ctx.font = '500 14px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(med.ocrReading || med.name, 48, y + 20);

      if (med.genericName) {
        ctx.font = '12px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#6ee7b7';
        const genText = `→ ${med.genericName}`;
        ctx.fillText(genText.length > 45 ? genText.substring(0, 42) + '...' : genText, 48, y + 38);
      }

      y += 56;
    }

    if (result.medicines.length > 8) {
      ctx.font = '12px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fillText(`+${result.medicines.length - 8} more medicines`, 48, y + 6);
      y += 26;
    }

    // Interaction warning
    if (result.interactions && result.interactions.length > 0) {
      y += 6;
      ctx.fillStyle = 'rgba(251,191,36,0.1)';
      ctx.beginPath(); ctx.roundRect(32, y, w - 64, 34, 6); ctx.fill();
      ctx.font = '13px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#fbbf24';
      ctx.fillText(`⚠ ${result.interactions.length} drug interaction${result.interactions.length > 1 ? 's' : ''} detected`, 48, y + 22);
      y += 44;
    }

    // Doctor name
    y += 8;
    ctx.font = '12px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    const doctorLine = [result.doctorName, `${result.medicines.length} medicines`].filter(Boolean).join('  ·  ');
    ctx.fillText(doctorLine, 32, y);

    // Divider
    y += 18;
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(32, y); ctx.lineTo(w - 32, y); ctx.stroke();

    // CTA
    y += 28;
    ctx.font = '500 16px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Are you overpaying for medicines?', 32, y);
    y += 22;
    ctx.font = '14px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText('Scan your prescription free', 32, y);

    // CTA button
    y += 16;
    ctx.fillStyle = '#6ee7b7';
    ctx.beginPath(); ctx.roundRect(32, y, 170, 36, 8); ctx.fill();
    ctx.font = '500 13px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#064e3b';
    ctx.fillText('rxscan.vercel.app', 50, y + 23);

    // Disclaimer
    y += 52;
    ctx.font = '10px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillText('Generic alternatives are CDSCO-certified. Consult your doctor before switching.', 32, y);

    // Convert to blob and share/download
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], 'rxscan-report.png', { type: 'image/png' });

      // Try native share first (mobile)
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'RxScan Prescription Report',
            text: `I could save ₹${savingsAmount} by switching to generic medicines! Try RxScan free.`,
          });
          return;
        } catch {
          // User cancelled or share failed — fall through to download
        }
      }

      // Fallback: download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'rxscan-report.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Image saved!');
    }, 'image/png');
  };

  const handleShareApp = () => {
    const text = `Hey! Check out RxScan — you scan your doctor's prescription and it reads the handwriting, shows what each medicine does, and finds generic alternatives that can save you 50-90%. Totally free.\n\nTry it → https://rxscan.vercel.app`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleSaveToHistory = () => {
    if (isSaved) return;
    savePrescription(result);
    setIsSaved(true);
    showToast('Saved to My Medicines!');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Toast message={toastMessage} visible={toastVisible} />

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

      <main className="max-w-lg mx-auto px-4 pb-40">
        {/* BUG #3 FIX: Pass patientName to header */}
        <PrescriptionHeader
          doctorName={result.doctorName || null}
          patientName={result.patientName || null}
          date={result.date || null}
          readability={result.overallReadability || 'fair'}
        />

        <SavingsBanner medicines={medicines} />

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

        <div className="mt-6 rounded-lg bg-slate-100 p-3">
          <p className="text-xs text-slate-500 leading-relaxed">
            ⓘ AI-powered reading may not be 100% accurate. Please verify each medicine
            name and dosage against your prescription before relying on this information.
          </p>
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Understanding your prescription
          </h3>
          <div className="space-y-3">
            <div>
              <h4 className="text-xs font-semibold text-slate-700 mb-1">Common abbreviations</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                {[
                  ['OD', 'Once daily'],
                  ['BD', 'Twice daily'],
                  ['TDS', 'Three times daily'],
                  ['SOS', 'As needed'],
                  ['1-0-1', 'Morning – skip – night'],
                  ['1-1-1', 'Morning – afternoon – night'],
                  ['AC', 'Before food'],
                  ['PC', 'After food'],
                  ['HS', 'At bedtime'],
                  ['Tab', 'Tablet'],
                  ['Cap', 'Capsule'],
                  ['Syp', 'Syrup'],
                ].map(([abbr, meaning], i) => (
                  <div key={i} className="flex items-baseline gap-1.5">
                    <span className="text-xs font-mono font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">{abbr}</span>
                    <span className="text-xs text-slate-600">{meaning}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <h4 className="text-xs font-semibold text-slate-700 mb-1">What is a generic medicine?</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                A generic medicine contains the same active ingredient, in the same dosage and form, as the branded version.
                CDSCO (India's drug regulator) certifies them as bioequivalent — meaning they work the same way in your body.
                The price difference is because you're not paying for the brand name, marketing, or packaging.
              </p>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <h4 className="text-xs font-semibold text-slate-700 mb-1">What is a drug interaction?</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                When two medicines affect each other — one might reduce the other's effectiveness, or together they might
                increase the risk of side effects. Your doctor may have prescribed them intentionally, but it's always
                worth confirming at your next visit.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom action bar — fixed */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="max-w-lg mx-auto space-y-2">
          {/* Primary row — WhatsApp share (real prescriptions only) */}
          {!result.isDemo && (
            <div className="flex gap-3">
              <button onClick={handleShareWhatsApp} className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Share on WhatsApp
              </button>
              <button onClick={handleDownloadCard} className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Card
              </button>
            </div>
          )}
          {/* Secondary row — Save + Scan New */}
          <div className="flex gap-3">
            {!result.isDemo && (
              <button
                onClick={handleSaveToHistory}
                className={`flex-1 flex items-center justify-center gap-2 font-semibold py-2.5 px-4 rounded-xl text-sm transition-all duration-300 ${
                  isSaved
                    ? 'bg-emerald-50 border-[1.5px] border-emerald-300 text-emerald-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {isSaved ? (
                  <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                )}
                {isSaved ? 'Saved to My Medicines' : 'Save to My Medicines'}
              </button>
            )}
            <button onClick={onScanAnother} className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Scan New
            </button>
          </div>
          {/* Recommend row — demo only */}
          {result.isDemo && (
            <div className="flex gap-3">
              <button onClick={handleShareApp} className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Recommend RxScan
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="h-4" />

      <div className="max-w-lg mx-auto px-4 pb-6">
        <p className="text-[11px] text-slate-400 leading-relaxed text-center">
          RxScan helps you understand your prescription. It is NOT medical advice.
          Always confirm with your doctor or pharmacist before making any changes to your medication.
        </p>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
