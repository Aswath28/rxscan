'use client'

import { useState } from 'react'
import ResultsScreen from '@/components/ResultsScreen'
import { PrescriptionAnalysis } from '@/types/prescription'

const successfulScan: PrescriptionAnalysis = {
  id: 'rx-demo-1',
  doctorName: 'Dr. Sharma',
  prescriptionDate: '2026-04-10',
  quality: 'good',
  aiSummary:
    'Looks like a cardiac regimen. 3 medicines identified, one interaction flagged for review.',
  aiConfidence: 94,
  medicines: [
    {
      id: 'm1',
      ocrReading: 'Pan 40',
      matchedName: 'Pantoprazole 40mg',
      category: 'Proton pump inhibitor',
      confidence: 'high',
      attributes: ['Tablet', '1-0-1', '5 days', 'Before food'],
      pricing: { brandPrice: 180, genericPrice: 25, savingsPercent: 86 },
      availableAtJanAushadhi: true,
      iconKind: 'capsule',
      whatItIs: 'Pantoprazole is a proton pump inhibitor (PPI) — a type of acid reducer.',
      whatItDoes: "Calms down your stomach's acid production. Prescribed when you have acidity, heartburn, or stomach ulcers. Think of it as turning down the acid dial.",
      howToTake: '30-60 minutes before meals, on an empty stomach. Swallow whole — don\'t crush or chew.',
      sideEffects: ['Headache', 'Diarrhoea', 'Nausea', 'Flatulence'],
    },
    {
      id: 'm2',
      ocrReading: 'Ecosprin 75',
      matchedName: 'Aspirin 75mg',
      category: 'Blood thinner',
      confidence: 'high',
      attributes: ['Tablet', '0-0-1', '30 days'],
      pricing: { brandPrice: 35, genericPrice: 8, savingsPercent: 77 },
      iconKind: 'round',
      whatItIs: 'Aspirin at low dose is a blood thinner (antiplatelet).',
      whatItDoes: 'Prevents blood cells from sticking together and forming clots. Prescribed after cardiac events to reduce the risk of stroke or heart attack.',
      howToTake: 'One tablet at night, after food. Continue for as long as your doctor advises — don\'t stop on your own.',
      sideEffects: ['Stomach irritation', 'Easy bruising', 'Mild bleeding', 'Heartburn'],
    },
    {
      id: 'm3',
      ocrReading: 'Clop 75',
      matchedName: 'Clopidogrel 75mg',
      category: 'Blood thinner',
      confidence: 'medium',
      attributes: ['Tablet', '1-0-0', '30 days'],
      pricing: { brandPrice: 120, genericPrice: 15, savingsPercent: 88 },
      iconKind: 'tablet',
      whatItIs: 'Clopidogrel is an antiplatelet medicine that prevents blood clots.',
      whatItDoes: 'Works alongside aspirin to further reduce the risk of clots forming. Common in cardiac patients after stent placement or a heart attack.',
      howToTake: 'One tablet in the morning with or without food. Don\'t miss doses — consistency matters for this medicine.',
      sideEffects: ['Bruising', 'Headache', 'Dizziness', 'Rash'],
    },
  ],
  doctorNotes: [],
  interactions: [
    {
      drug1: 'Aspirin',
      drug2: 'Clopidogrel',
      severity: 'moderate',
      effect: 'Both thin the blood.',
      recommendation:
        'Cardiologists often prescribe this combination intentionally — confirm with your doctor.',
    },
  ],
  totalBrandPrice: 1400,
  totalGenericPrice: 280,
  totalSavings: 1120,
}

const hardToReadScan: PrescriptionAnalysis = {
  id: 'rx-demo-2',
  prescriptionDate: '2021-07-13',
  quality: 'poor',
  aiSummary:
    "I found doctor's notes but couldn't confidently read any medicine names. Here's what I could make out.",
  aiConfidence: 28,
  medicines: [],
  doctorNotes: [
    { kind: 'condition', value: 'HTN — Hypertension' },
    { kind: 'symptom', value: 'Abdominal pain' },
  ],
  interactions: [],
  totalBrandPrice: 0,
  totalGenericPrice: 0,
  totalSavings: 0,
}

export default function TestResultsPage() {
  const [scenario, setScenario] = useState<'success' | 'poor'>('success')
  const analysis = scenario === 'success' ? successfulScan : hardToReadScan

  return (
    <div>
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: '#fff',
          padding: '12px 16px',
          borderBottom: '1px solid #e5e5e5',
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: 13, color: '#666', marginRight: 8 }}>
          Test scenario:
        </span>
        <button
          onClick={() => setScenario('success')}
          style={{
            padding: '6px 12px',
            fontSize: 13,
            borderRadius: 8,
            border: scenario === 'success' ? '2px solid #1F3D36' : '1px solid #ccc',
            background: scenario === 'success' ? '#E1EFE8' : '#fff',
            cursor: 'pointer',
          }}
        >
          Successful scan
        </button>
        <button
          onClick={() => setScenario('poor')}
          style={{
            padding: '6px 12px',
            fontSize: 13,
            borderRadius: 8,
            border: scenario === 'poor' ? '2px solid #1F3D36' : '1px solid #ccc',
            background: scenario === 'poor' ? '#F2E4DA' : '#fff',
            cursor: 'pointer',
          }}
        >
          Hard to read
        </button>
      </div>

      <div
        style={{
          maxWidth: '420px',
          margin: '0 auto',
          minHeight: '100vh',
          boxShadow: '0 0 0 1px rgba(0,0,0,0.05)',
        }}
      >
        <ResultsScreen
          analysis={analysis}
          isDemo={true}
          onBack={() => alert('Back clicked')}
          onScanAnother={() => alert('Scan another clicked')}
          onRetake={() => alert('Retake clicked')}
          onManualEntry={() => alert('Manual entry clicked')}
          onFindNearby={(id) => alert(`Find nearby for ${id}`)}
        />
      </div>
    </div>
  )
}