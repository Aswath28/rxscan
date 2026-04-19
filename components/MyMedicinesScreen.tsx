'use client';

import { useState, useEffect } from 'react';
import {
  getAllPrescriptions,
  deletePrescription,
  getAllMedicines,
  checkCrossPrescriptionInteractions,
  getTotalSavings,
  clearAllHistory,
  SavedPrescription,
  CrossPrescriptionAlert,
} from '@/lib/prescriptionHistory';

// ============================================================
// ICONS
// ============================================================

function IconPill({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="9" width="18" height="6" rx="3" stroke="currentColor" strokeWidth="1.6" />
      <line x1="12" y1="9" x2="12" y2="15" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function IconDocument({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M7 3h7l5 5v13H7z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M14 3v5h5M9 13h6M9 17h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconAlert({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 3l9 17H3L12 3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M12 10v4M12 17v.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconCamera({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="13.5" r="3.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function IconPlus({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconBulb({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8 1 1.5 2.5 1.5 3.5h5c0-1 .7-2.5 1.5-3.5A6 6 0 0 0 12 3z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ============================================================
// SUMMARY DASHBOARD
// ============================================================

function SummaryDashboard({ stats }: {
  stats: { totalBrand: number; totalGeneric: number; totalSavings: number; prescriptionCount: number; medicineCount: number };
}) {
  return (
    <div className="rounded-2xl bg-rx-pine-900 p-5 text-rx-surface">
      <h2 className="text-xs font-medium text-rx-pine-50/80 tracking-[0.06em] uppercase">
        My medicine summary
      </h2>
      <div className="mt-3 grid grid-cols-3 gap-4">
        <div>
          <div className="text-2xl font-medium">{stats.prescriptionCount}</div>
          <div className="text-xs text-rx-pine-50/70 mt-0.5">
            Prescription{stats.prescriptionCount !== 1 ? 's' : ''}
          </div>
        </div>
        <div>
          <div className="text-2xl font-medium">{stats.medicineCount}</div>
          <div className="text-xs text-rx-pine-50/70 mt-0.5">
            Medicine{stats.medicineCount !== 1 ? 's' : ''}
          </div>
        </div>
        <div>
          <div className="text-2xl font-medium text-rx-pine-50">
            {stats.totalSavings > 0 ? `₹${stats.totalSavings}` : '—'}
          </div>
          <div className="text-xs text-rx-pine-50/70 mt-0.5">Total savings</div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// CROSS INTERACTION ALERT
// ============================================================

function CrossInteractionAlert({ alert }: { alert: CrossPrescriptionAlert }) {
  const severityConfig = {
    severe: { bg: 'bg-rx-clay-50', border: 'border-rx-clay-100', text: 'text-rx-clay-900', muted: 'text-rx-clay-700', label: 'Severe' },
    moderate: { bg: 'bg-rx-sand-50', border: 'border-rx-hairline', text: 'text-rx-sand-700', muted: 'text-rx-sand-700', label: 'Moderate' },
    mild: { bg: 'bg-rx-dust-50', border: 'border-rx-hairline', text: 'text-rx-dust-900', muted: 'text-rx-dust-600', label: 'Mild' },
  };
  const config = severityConfig[alert.severity] || severityConfig.moderate;

  return (
    <div className={`rounded-xl border ${config.border} ${config.bg} p-4`}>
      <div className="flex items-start gap-3">
        <IconAlert className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.text}`} />
        <div>
          <h4 className={`font-medium text-sm ${config.text}`}>
            {config.label} cross-prescription interaction
          </h4>
          <p className={`text-sm mt-1 ${config.muted}`}>
            <span className="font-medium">{alert.drug1}</span>
            <span className="opacity-70"> from {alert.drug1Doctor}</span>
            {' + '}
            <span className="font-medium">{alert.drug2}</span>
            <span className="opacity-70"> from {alert.drug2Doctor}</span>
          </p>
          <p className={`text-sm mt-1 leading-relaxed ${config.muted}`}>
            {alert.effect}
          </p>
          <p className={`text-sm mt-2 font-medium ${config.text}`}>
            {alert.recommendation}
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PRESCRIPTION CARD
// ============================================================

function PrescriptionCard({
  prescription,
  onDelete,
  onView,
}: {
  prescription: SavedPrescription;
  onDelete: (id: string) => void;
  onView: (prescription: SavedPrescription) => void;
}) {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const savedDate = new Date(prescription.savedAt);
  const formattedDate = savedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const formattedTime = savedDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  // Use date as primary label if no doctor name
  const primaryLabel = prescription.doctorName
    ? prescription.doctorName
    : `Prescription — ${prescription.date || formattedDate}`;

  return (
    <div className="rounded-xl border border-rx-hairline bg-rx-card overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-medium text-rx-ink text-base">{primaryLabel}</h3>
            <p className="text-xs text-rx-ink-subtle mt-0.5">
              Saved {formattedDate} at {formattedTime}
            </p>
            {prescription.date && prescription.doctorName && (
              <p className="text-xs text-rx-ink-muted mt-0.5">
                Prescription date: {prescription.date}
              </p>
            )}
          </div>
          {prescription.totalSavings > 0 && (
            <div className="text-right">
              <div className="text-lg font-medium text-rx-pine-700">₹{prescription.totalSavings}</div>
              <div className="text-xs text-rx-ink-subtle">savings</div>
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {prescription.medicines.map((med, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-rx-surface text-xs font-medium text-rx-ink-muted"
            >
              <IconPill className="w-3 h-3" />
              {med.name}
            </span>
          ))}
        </div>

        {prescription.interactions.length > 0 && (
          <div className="mt-3 flex items-center gap-1.5">
            <IconAlert className="w-3.5 h-3.5 text-rx-clay-600" />
            <span className="text-xs font-medium text-rx-clay-700">
              {prescription.interactions.length} interaction{prescription.interactions.length !== 1 ? 's' : ''} flagged
            </span>
          </div>
        )}

        <div className="mt-3 flex gap-2">
          <button
            onClick={() => onView(prescription)}
            className="flex-1 text-center py-2 px-3 rounded-lg bg-rx-surface hover:bg-rx-pine-50 text-sm font-medium text-rx-ink transition-colors"
          >
            View details
          </button>
          {!showConfirmDelete ? (
            <button
              onClick={() => setShowConfirmDelete(true)}
              className="py-2 px-3 rounded-lg hover:bg-rx-clay-50 text-sm font-medium text-rx-ink-subtle hover:text-rx-clay-700 transition-colors"
            >
              Delete
            </button>
          ) : (
            <div className="flex gap-1">
              <button
                onClick={() => { onDelete(prescription.id); setShowConfirmDelete(false); }}
                className="py-2 px-3 rounded-lg bg-rx-clay-600 text-rx-surface text-sm font-medium"
              >
                Confirm
              </button>
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="py-2 px-3 rounded-lg bg-rx-surface text-sm font-medium text-rx-ink-muted"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ALL MEDICINES VIEW
// ============================================================

function AllMedicinesView() {
  const medicines = getAllMedicines();

  if (medicines.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-rx-ink-subtle">No medicines saved yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {medicines.map((med, i) => (
        <div key={i} className="rounded-lg border border-rx-hairline bg-rx-card p-3">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-medium text-rx-ink text-sm">{med.name}</h4>
              <p className="text-xs text-rx-ink-muted">{med.matchedDrug}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <span className="text-xs px-1.5 py-0.5 rounded bg-rx-surface text-rx-ink-muted">{med.dosage}</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-rx-surface text-rx-ink-muted">{med.frequencyPlain}</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-rx-surface text-rx-ink-muted">{med.duration}</span>
              </div>
              {med.fromDoctor && (
                <p className="text-xs text-rx-ink-subtle mt-1.5">Prescribed by {med.fromDoctor}</p>
              )}
            </div>
            {med.brandPrice > 0 && med.genericPrice > 0 && (
              <div className="text-right flex-shrink-0">
                <div className="text-xs text-rx-ink-subtle line-through">₹{med.brandPrice}</div>
                <div className="text-sm font-medium text-rx-pine-700">₹{med.genericPrice}</div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// EMPTY STATE
// ============================================================

function EmptyState({ onScan }: { onScan: () => void }) {
  return (
    <div className="text-center py-16 px-6">
      <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-rx-surface flex items-center justify-center">
        <IconDocument className="w-7 h-7 text-rx-ink-subtle" />
      </div>
      <h3 className="text-lg font-medium text-rx-ink">No saved prescriptions yet</h3>
      <p className="text-sm text-rx-ink-muted mt-2 max-w-xs mx-auto leading-relaxed">
        Scan a prescription and tap "Save" to start building your medicine history.
      </p>
      <button
        onClick={onScan}
        className="mt-6 inline-flex items-center gap-2 bg-rx-pine-700 hover:bg-rx-pine-900 text-rx-surface font-medium py-3 px-6 rounded-xl text-sm transition-colors"
      >
        <IconCamera className="w-4 h-4" />
        Scan a prescription
      </button>
    </div>
  );
}

// ============================================================
// MAIN
// ============================================================

interface MyMedicinesScreenProps {
  onBack: () => void;
  onScan: () => void;
  onViewPrescription: (prescription: SavedPrescription) => void;
}

export default function MyMedicinesScreen({ onBack, onScan, onViewPrescription }: MyMedicinesScreenProps) {
  const [prescriptions, setPrescriptions] = useState<SavedPrescription[]>([]);
  const [crossAlerts, setCrossAlerts] = useState<CrossPrescriptionAlert[]>([]);
  const [activeTab, setActiveTab] = useState<'prescriptions' | 'all-medicines'>('prescriptions');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    setPrescriptions(getAllPrescriptions());
    setCrossAlerts(checkCrossPrescriptionInteractions());
  }, []);

  const savings = getTotalSavings();
  const allMedicines = getAllMedicines();

  const handleDelete = (id: string) => {
    deletePrescription(id);
    setPrescriptions(getAllPrescriptions());
    setCrossAlerts(checkCrossPrescriptionInteractions());
  };

  const handleClearAll = () => {
    clearAllHistory();
    setPrescriptions([]);
    setCrossAlerts([]);
    setShowClearConfirm(false);
  };

  const isEmpty = prescriptions.length === 0;

  return (
    <div className="min-h-screen bg-rx-bg">
      <header className="sticky top-0 z-10 bg-rx-card/80 backdrop-blur-md border-b border-rx-hairline">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={onBack} className="text-rx-ink-muted hover:text-rx-ink flex items-center gap-1 text-sm font-medium">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 onClick={onBack} className="font-medium text-rx-ink text-lg tracking-tight cursor-pointer">
            Rx<span className="text-rx-pine-700">Scan</span>
          </h1>
          {!isEmpty ? (
            <button
              onClick={onScan}
              className="flex items-center gap-1.5 bg-rx-pine-50 hover:bg-rx-pine-100 px-3 py-1.5 rounded-full transition-colors"
            >
              <IconPlus className="w-3.5 h-3.5 text-rx-pine-700" />
              <span className="text-xs font-medium text-rx-pine-700">Scan</span>
            </button>
          ) : (
            <div className="w-12" />
          )}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pb-8">
        {isEmpty ? (
          <EmptyState onScan={onScan} />
        ) : (
          <>
            <div className="mt-4">
              <SummaryDashboard stats={{ ...savings, medicineCount: allMedicines.length }} />
            </div>

            {crossAlerts.length > 0 && (
              <div className="mt-5 space-y-3">
                <h3 className="text-xs font-medium text-rx-clay-700 uppercase tracking-wider flex items-center gap-1.5">
                  <IconAlert className="w-3.5 h-3.5" />
                  Cross-prescription alerts ({crossAlerts.length})
                </h3>
                {crossAlerts.map((alert, i) => <CrossInteractionAlert key={i} alert={alert} />)}
              </div>
            )}

            <div className="mt-5 flex rounded-lg bg-rx-surface p-1">
              <button
                onClick={() => setActiveTab('prescriptions')}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'prescriptions'
                    ? 'bg-rx-card text-rx-ink'
                    : 'text-rx-ink-muted hover:text-rx-ink'
                }`}
              >
                Prescriptions ({prescriptions.length})
              </button>
              <button
                onClick={() => setActiveTab('all-medicines')}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'all-medicines'
                    ? 'bg-rx-card text-rx-ink'
                    : 'text-rx-ink-muted hover:text-rx-ink'
                }`}
              >
                All medicines ({allMedicines.length})
              </button>
            </div>

            <div className="mt-4">
              {activeTab === 'prescriptions' && (
                <div className="space-y-3">
                  {prescriptions.map((rx) => (
                    <PrescriptionCard key={rx.id} prescription={rx} onDelete={handleDelete} onView={onViewPrescription} />
                  ))}
                </div>
              )}
              {activeTab === 'all-medicines' && <AllMedicinesView />}
            </div>

            <div className="mt-8 text-center">
              {!showClearConfirm ? (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="text-xs text-rx-ink-subtle hover:text-rx-clay-700 transition-colors"
                >
                  Clear all history
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-rx-clay-700 font-medium">
                    This will delete all saved prescriptions. Are you sure?
                  </p>
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={handleClearAll}
                      className="px-4 py-2 rounded-lg bg-rx-clay-600 text-rx-surface text-xs font-medium"
                    >
                      Yes, clear all
                    </button>
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className="px-4 py-2 rounded-lg bg-rx-surface text-xs font-medium text-rx-ink-muted"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <div className="mt-8">
          <p className="text-[11px] text-rx-ink-subtle leading-relaxed text-center">
            Your prescription history is stored only on this device. RxScan does not store
            any medical data on servers. Clearing your browser data will remove this history.
          </p>
        </div>
      </main>
    </div>
  );
}