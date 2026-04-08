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
// COMPONENT: Summary Dashboard
// ============================================================

function SummaryDashboard({ stats }: {
  stats: { totalBrand: number; totalGeneric: number; totalSavings: number; prescriptionCount: number; medicineCount: number };
}) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-5 text-white shadow-lg">
      <h2 className="text-sm font-medium text-slate-300 tracking-wide uppercase">
        My Medicine Summary
      </h2>
      <div className="mt-3 grid grid-cols-3 gap-4">
        <div>
          <div className="text-2xl font-bold">{stats.prescriptionCount}</div>
          <div className="text-xs text-slate-400 mt-0.5">
            Prescription{stats.prescriptionCount !== 1 ? 's' : ''}
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold">{stats.medicineCount}</div>
          <div className="text-xs text-slate-400 mt-0.5">
            Medicine{stats.medicineCount !== 1 ? 's' : ''}
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold text-emerald-400">₹{stats.totalSavings}</div>
          <div className="text-xs text-slate-400 mt-0.5">Total savings</div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// COMPONENT: Cross-Prescription Interaction Alert
// ============================================================

function CrossInteractionAlert({ alert }: { alert: CrossPrescriptionAlert }) {
  const severityConfig = {
    severe: { bg: 'bg-red-50 border-red-300', icon: '🔴', label: 'Severe', text: 'text-red-800' },
    moderate: { bg: 'bg-amber-50 border-amber-300', icon: '🟡', label: 'Moderate', text: 'text-amber-800' },
    mild: { bg: 'bg-blue-50 border-blue-200', icon: '🔵', label: 'Mild', text: 'text-blue-800' },
  };
  const config = severityConfig[alert.severity] || severityConfig.moderate;

  return (
    <div className={`rounded-xl border-2 ${config.bg} p-4`}>
      <div className="flex items-start gap-3">
        <span className="text-xl mt-0.5">{config.icon}</span>
        <div>
          <h4 className={`font-semibold text-sm ${config.text}`}>
            {config.label} Cross-Prescription Interaction
          </h4>
          <p className="text-sm text-slate-600 mt-1">
            <span className="font-medium">{alert.drug1}</span>
            <span className="text-slate-400"> from {alert.drug1Doctor}</span>
            {' + '}
            <span className="font-medium">{alert.drug2}</span>
            <span className="text-slate-400"> from {alert.drug2Doctor}</span>
          </p>
          <p className="text-sm text-slate-600 mt-1 leading-relaxed">
            {alert.effect}
          </p>
          <p className="text-sm text-slate-700 mt-2 font-medium">
            💡 {alert.recommendation}
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// COMPONENT: Saved Prescription Card
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
  const formattedDate = savedDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const formattedTime = savedDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-slate-900 text-base">
              {prescription.doctorName || 'Unknown Doctor'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Saved {formattedDate} at {formattedTime}
            </p>
            {prescription.date && (
              <p className="text-xs text-slate-500 mt-0.5">
                Prescription date: {prescription.date}
              </p>
            )}
          </div>
          {prescription.totalSavings > 0 && (
            <div className="text-right">
              <div className="text-lg font-bold text-emerald-600">₹{prescription.totalSavings}</div>
              <div className="text-xs text-slate-400">savings</div>
            </div>
          )}
        </div>

        {/* Medicine pills */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {prescription.medicines.map((med, i) => (
            <span
              key={i}
              className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-xs font-medium text-slate-600"
            >
              💊 {med.name}
            </span>
          ))}
        </div>

        {/* Within-prescription interactions */}
        {prescription.interactions.length > 0 && (
          <div className="mt-3">
            <span className="text-xs font-medium text-amber-600">
              ⚠️ {prescription.interactions.length} interaction{prescription.interactions.length !== 1 ? 's' : ''} flagged
            </span>
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => onView(prescription)}
            className="flex-1 text-center py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm font-medium text-slate-700 transition-colors"
          >
            View Details
          </button>
          {!showConfirmDelete ? (
            <button
              onClick={() => setShowConfirmDelete(true)}
              className="py-2 px-3 rounded-lg hover:bg-red-50 text-sm font-medium text-slate-400 hover:text-red-500 transition-colors"
            >
              Delete
            </button>
          ) : (
            <div className="flex gap-1">
              <button
                onClick={() => {
                  onDelete(prescription.id);
                  setShowConfirmDelete(false);
                }}
                className="py-2 px-3 rounded-lg bg-red-500 text-white text-sm font-medium"
              >
                Confirm
              </button>
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="py-2 px-3 rounded-lg bg-slate-100 text-sm font-medium text-slate-600"
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
// COMPONENT: All Medicines View (deduplicated)
// ============================================================

function AllMedicinesView() {
  const medicines = getAllMedicines();

  if (medicines.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-slate-400">No medicines saved yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {medicines.map((med, i) => (
        <div key={i} className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-semibold text-slate-900 text-sm">{med.name}</h4>
              <p className="text-xs text-slate-500">{med.matchedDrug}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                  {med.dosage}
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                  {med.frequencyPlain}
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                  {med.duration}
                </span>
              </div>
              {med.fromDoctor && (
                <p className="text-xs text-slate-400 mt-1.5">
                  Prescribed by {med.fromDoctor}
                </p>
              )}
            </div>
            {med.brandPrice > 0 && med.genericPrice > 0 && (
              <div className="text-right flex-shrink-0">
                <div className="text-xs text-slate-400 line-through">₹{med.brandPrice}</div>
                <div className="text-sm font-bold text-emerald-600">₹{med.genericPrice}</div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// COMPONENT: Empty State
// ============================================================

function EmptyState({ onScan }: { onScan: () => void }) {
  return (
    <div className="text-center py-16 px-6">
      <div className="text-5xl mb-4">📋</div>
      <h3 className="text-lg font-semibold text-slate-800">No saved prescriptions yet</h3>
      <p className="text-sm text-slate-500 mt-2 max-w-xs mx-auto leading-relaxed">
        Scan a prescription and tap "Save to My Medicines" to start building your medicine history.
      </p>
      <button
        onClick={onScan}
        className="mt-6 inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-xl text-sm transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Scan a Prescription
      </button>
    </div>
  );
}

// ============================================================
// MAIN: My Medicines Screen
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

  // Load data on mount
  useEffect(() => {
    setPrescriptions(getAllPrescriptions());
    setCrossAlerts(checkCrossPrescriptionInteractions());
  }, []);

  // Stats for dashboard
  const savings = getTotalSavings();
  const allMedicines = getAllMedicines();

  const handleDelete = (id: string) => {
    deletePrescription(id);
    const updated = getAllPrescriptions();
    setPrescriptions(updated);
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
        {!isEmpty && (
            <button
              onClick={onScan}
              className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-full transition-colors"
            >
              <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-xs font-semibold text-emerald-600">Scan</span>
            </button>
          )}
          {isEmpty && <div className="w-12" />}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pb-8">
        {isEmpty ? (
          <EmptyState onScan={onScan} />
        ) : (
          <>
            {/* Summary dashboard */}
            <div className="mt-4">
              <SummaryDashboard
                stats={{
                  ...savings,
                  medicineCount: allMedicines.length,
                }}
              />
            </div>

            {/* Cross-prescription interaction alerts */}
            {crossAlerts.length > 0 && (
              <div className="mt-5 space-y-3">
                <h3 className="text-xs font-semibold text-red-500 uppercase tracking-wider flex items-center gap-1">
                  ⚠️ Cross-Prescription Alerts ({crossAlerts.length})
                </h3>
                {crossAlerts.map((alert, i) => (
                  <CrossInteractionAlert key={i} alert={alert} />
                ))}
              </div>
            )}

            {/* Tab switcher */}
            <div className="mt-5 flex rounded-lg bg-slate-200 p-1">
              <button
                onClick={() => setActiveTab('prescriptions')}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'prescriptions'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Prescriptions ({prescriptions.length})
              </button>
              <button
                onClick={() => setActiveTab('all-medicines')}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'all-medicines'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                All Medicines ({allMedicines.length})
              </button>
            </div>

            {/* Tab content */}
            <div className="mt-4">
              {activeTab === 'prescriptions' && (
                <div className="space-y-3">
                  {prescriptions.map((rx) => (
                    <PrescriptionCard
                      key={rx.id}
                      prescription={rx}
                      onDelete={handleDelete}
                      onView={onViewPrescription}
                    />
                  ))}
                </div>
              )}
              {activeTab === 'all-medicines' && <AllMedicinesView />}
            </div>

            {/* Clear all */}
            <div className="mt-8 text-center">
              {!showClearConfirm ? (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                >
                  Clear all history
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-red-500 font-medium">
                    This will delete all saved prescriptions. Are you sure?
                  </p>
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={handleClearAll}
                      className="px-4 py-2 rounded-lg bg-red-500 text-white text-xs font-semibold"
                    >
                      Yes, clear all
                    </button>
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className="px-4 py-2 rounded-lg bg-slate-100 text-xs font-semibold text-slate-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Disclaimer */}
        <div className="mt-8">
          <p className="text-[11px] text-slate-400 leading-relaxed text-center">
            Your prescription history is stored only on this device. RxScan does not store
            any medical data on servers. Clearing your browser data will remove this history.
          </p>
        </div>
      </main>
    </div>
  );
}