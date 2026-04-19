const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'data', 'brand-mappings.json');

// New brand mappings — each is a "brand as Vision reads it" → generic mapping
// Dosage strings left empty where it's ambiguous; drug-matcher will still match on the name
const NEW_MAPPINGS = {
  // DAPAMAC — Dapagliflozin 10mg (SGLT2, diabetes)
  "DAPAMAC": { generic: "Dapagliflozin", dosage: "10mg" },
  "DAPAMAC 10mg": { generic: "Dapagliflozin", dosage: "10mg" },
  "Dapamac": { generic: "Dapagliflozin", dosage: "10mg" },

  // FLAVEDON MR — Trimetazidine 35mg modified release (anti-anginal)
  "FLAVEDON MR": { generic: "Trimetazidine", dosage: "35mg" },
  "Flavedon MR": { generic: "Trimetazidine", dosage: "35mg" },
  "Flavedon": { generic: "Trimetazidine", dosage: "20mg" },
  "FLAVEDON": { generic: "Trimetazidine", dosage: "20mg" },

  // GALVUS MET — Vildagliptin 50mg + Metformin 500mg (diabetes combo)
  "GALVUS MET": { generic: "Vildagliptin + Metformin", dosage: "50mg+500mg" },
  "Galvus Met": { generic: "Vildagliptin + Metformin", dosage: "50mg+500mg" },
  "GALVUS MET 50/500": { generic: "Vildagliptin + Metformin", dosage: "50mg+500mg" },
  "GALVUS MET 50/1000": { generic: "Vildagliptin + Metformin", dosage: "50mg+1000mg" },
  "Galvus": { generic: "Vildagliptin", dosage: "50mg" },
  "GALVUS": { generic: "Vildagliptin", dosage: "50mg" },

  // GLYCOMET GP2 — Metformin 500mg + Glimepiride 2mg (diabetes combo)
  "GLYCOMET GP2": { generic: "Metformin + Glimepiride", dosage: "500mg+2mg" },
  "Glycomet GP2": { generic: "Metformin + Glimepiride", dosage: "500mg+2mg" },
  "GLYCOMET GP1": { generic: "Metformin + Glimepiride", dosage: "500mg+1mg" },
  "Glycomet GP1": { generic: "Metformin + Glimepiride", dosage: "500mg+1mg" },
  "GLYCOMET GP 0.5": { generic: "Metformin + Glimepiride", dosage: "500mg+0.5mg" },
  "Glycomet": { generic: "Metformin", dosage: "500mg" },
  "GLYCOMET": { generic: "Metformin", dosage: "500mg" },
  "Glycomet 500": { generic: "Metformin", dosage: "500mg" },
  "Glycomet 850": { generic: "Metformin", dosage: "850mg" },

  // Amoxiclav — Amoxicillin 500mg + Clavulanic Acid 125mg (= Augmentin 625 equivalent)
  // Vision often reads this without the 625 suffix
  "Amoxiclav": { generic: "Amoxicillin + Clavulanic Acid", dosage: "500mg+125mg" },
  "AMOXICLAV": { generic: "Amoxicillin + Clavulanic Acid", dosage: "500mg+125mg" },
  "Amoxiclav 625": { generic: "Amoxicillin + Clavulanic Acid", dosage: "500mg+125mg" },
  "Amoxiclav 375": { generic: "Amoxicillin + Clavulanic Acid", dosage: "250mg+125mg" },
  "Cap Amoxiclav": { generic: "Amoxicillin + Clavulanic Acid", dosage: "500mg+125mg" },
  "Tab Amoxiclav": { generic: "Amoxicillin + Clavulanic Acid", dosage: "500mg+125mg" },

  // MIGT XL — Metformin + Glimepiride extended release
  "MIGT XL": { generic: "Metformin + Glimepiride", dosage: "500mg+1mg" },
  "MIGT XL 1": { generic: "Metformin + Glimepiride", dosage: "500mg+1mg" },
  "MIGT XL 2": { generic: "Metformin + Glimepiride", dosage: "500mg+2mg" },
  "Migt XL": { generic: "Metformin + Glimepiride", dosage: "500mg+1mg" },

  // Corzer — Carvedilol (beta-blocker, heart failure / hypertension)
  "Corzer": { generic: "Carvedilol", dosage: "3.125mg" },
  "CORZER": { generic: "Carvedilol", dosage: "3.125mg" },
  "Corzer 3.125": { generic: "Carvedilol", dosage: "3.125mg" },
  "Corzer 6.25": { generic: "Carvedilol", dosage: "6.25mg" },
  "Corzer 12.5": { generic: "Carvedilol", dosage: "12.5mg" },
  "Corzer 25": { generic: "Carvedilol", dosage: "25mg" },
};

// -----------------------------------------------------------------------------
// Load, merge, save
// -----------------------------------------------------------------------------

console.log('Reading', FILE);
const raw = fs.readFileSync(FILE, 'utf8');
const existing = JSON.parse(raw);
const existingKeys = new Set(Object.keys(existing));

console.log(`Existing mappings: ${existingKeys.size}`);

let added = 0;
let skipped = 0;
const addedList = [];
const skippedList = [];

for (const [brand, mapping] of Object.entries(NEW_MAPPINGS)) {
  if (existingKeys.has(brand)) {
    skipped++;
    skippedList.push(brand);
  } else {
    existing[brand] = mapping;
    added++;
    addedList.push(brand);
  }
}

// Sort keys alphabetically for cleaner diff
const sorted = {};
Object.keys(existing).sort().forEach((k) => { sorted[k] = existing[k]; });

fs.writeFileSync(FILE, JSON.stringify(sorted, null, 2) + '\n', 'utf8');

console.log('');
console.log(`✓ Added ${added} new mappings`);
console.log(`  Skipped ${skipped} duplicates`);
console.log(`  Total now: ${Object.keys(sorted).length}`);
console.log('');
if (addedList.length) {
  console.log('Added:');
  addedList.forEach((k) => console.log('  +', k));
}
if (skippedList.length) {
  console.log('Skipped (already existed):');
  skippedList.forEach((k) => console.log('  =', k));
}
