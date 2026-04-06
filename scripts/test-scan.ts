import fs from 'fs';
import path from 'path';

async function testPrescription(filename: string) {
  const imagePath = path.join(process.cwd(), 'test-images', filename);

  if (!fs.existsSync(imagePath)) {
    console.error(`File not found: ${imagePath}`);
    return;
  }

  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');

  const ext = path.extname(filename).toLowerCase();
  const mimeMap: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
  };
  const mimeType = mimeMap[ext] || 'image/jpeg';

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${filename}`);
  console.log(`Size: ${(imageBuffer.length / 1024).toFixed(0)} KB`);
  console.log(`MIME: ${mimeType}`);
  console.log('='.repeat(60));

  try {
    const response = await fetch('http://localhost:3000/api/scan-prescription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Image, mimeType }),
    });

    const result = await response.json();

    if (result.success) {
      console.log(`\n✅ Found ${result.medicineCount} medicines:\n`);

      result.data.medicines.forEach((med: any, i: number) => {
        const conf =
          med.confidence === 'high'
            ? '🟢'
            : med.confidence === 'medium'
            ? '🟡'
            : '🔴';

        console.log(`  ${i + 1}. ${conf} ${med.ocrName}`);
        console.log(`     Dosage: ${med.ocrDosage || 'not found'}`);
        console.log(`     Frequency: ${med.frequency || 'not found'} (${med.frequencyPlain || ''})`);
        console.log(`     Duration: ${med.duration || 'not found'}`);
        console.log(`     Form: ${med.formulation || 'not found'}`);

        if (med.matched) {
          console.log(`     ✅ MATCHED → ${med.matchedBrandName} (score: ${(med.matchScore * 100).toFixed(0)}%)`);
          console.log(`     Generic: ${med.genericName} ${med.genericDosage || ''}`);
          console.log(`     Category: ${med.category || 'unknown'}`);
          if (med.brandPrice && med.genericPrice) {
            console.log(`     💰 Brand: ₹${med.brandPrice} → Generic: ₹${med.genericPrice} (Save ₹${med.savingsAmount}, ${med.savingsPercent}%)`);
          }
        } else {
          console.log(`     ❌ NOT IN DATABASE`);
        }
        console.log('');
      });

      // Interactions
      if (result.data.interactions && result.data.interactions.length > 0) {
        console.log(`  ⚠️  INTERACTIONS FOUND (${result.data.interactions.length}):\n`);
        result.data.interactions.forEach((int: any) => {
          const icon = int.severity === 'severe' ? '🔴' : int.severity === 'moderate' ? '🟡' : '🟢';
          console.log(`     ${icon} ${int.drug1} + ${int.drug2} [${int.severity}]`);
          console.log(`        ${int.effect}`);
          console.log('');
        });
      }

      // Savings
      if (result.savings && result.savings.totalSavings > 0) {
        console.log(`  💰 TOTAL SAVINGS:`);
        console.log(`     Brand total: ₹${result.savings.totalBrandPrice}`);
        console.log(`     Generic total: ₹${result.savings.totalGenericPrice}`);
        console.log(`     You save: ₹${result.savings.totalSavings} (${result.savings.savingsPercent}%)`);
      }

      if (result.data.doctorName) console.log(`\n  Doctor: ${result.data.doctorName}`);
      if (result.data.diagnosis) console.log(`  Diagnosis: ${result.data.diagnosis}`);
    } else {
      console.log(`\n❌ Error: ${result.error || result.message}`);
    }
  } catch (err) {
    console.error(`\n💥 Request failed:`, err);
  }
}

async function runAllTests() {
  const testDir = path.join(process.cwd(), 'test-images');

  if (!fs.existsSync(testDir)) {
    console.error('Create a test-images/ folder and add prescription images');
    process.exit(1);
  }

  const files = fs.readdirSync(testDir).filter((f) =>
    ['.jpg', '.jpeg', '.png', '.webp'].includes(path.extname(f).toLowerCase())
  );

  if (files.length === 0) {
    console.error('No images found in test-images/');
    process.exit(1);
  }

  console.log(`Found ${files.length} test images\n`);

  for (const file of files) {
    await testPrescription(file);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('Testing complete!');
}

runAllTests();