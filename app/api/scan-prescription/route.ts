import { analyzePrescription } from '@/lib/drug-matcher';
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

const PRESCRIPTION_PROMPT = `You are a medical prescription reader specializing in Indian handwritten prescriptions.

You are looking at a photograph of a handwritten doctor's prescription from India. Your task is to extract EVERY medicine prescribed AND any conditions/symptoms the doctor noted.

=== CRITICAL DISTINCTION — MEDICINES vs CONDITIONS ===

Doctors often write the patient's diagnosis or symptoms on the prescription. These are NOT medicines. Common examples that are CONDITIONS or SYMPTOMS, not medicines:
- HTN / Hypertension / High BP / BP
- DM / Diabetes / Diabetes Mellitus / Type 2 DM
- Fever / Viral fever / Pyrexia
- Cough / Cold / URI / Upper respiratory infection
- Pain abdomen / Abdominal pain / Headache / Migraine
- Asthma / COPD / CAD / IHD
- Anaemia / Anxiety / Depression

If you see these terms, DO NOT put them in the medicines array. Put them in a separate "doctorNotes" array with:
- kind: "condition" (for diagnoses like HTN, DM, Asthma)
- kind: "symptom" (for symptoms like pain abdomen, cough, headache)
- value: the exact text as written

A medicine has a dosage (mg, ml) or a formulation (Tab, Cap, Syp). If something is written without a dosage or formulation, it's almost certainly a condition/symptom, not a medicine.

=== FOR EACH MEDICINE, IDENTIFY ===

1. Medicine name (exactly as written — could be a brand name or generic name)
2. Dosage (e.g., 500mg, 10mg, 40mg)
3. Frequency (e.g., 1-0-1, BD, TDS, OD, SOS)
4. Duration (e.g., 5 days, 1 week, 1 month, "to continue", "as needed")
5. Special instructions if visible (e.g., "after food", "before bed", "with milk", "AC", "PC")
6. Formulation (tablet, capsule, syrup, injection, cream, drops, inhaler, pellets, sachets)

=== CRITICAL CONTEXT — Indian prescription abbreviations ===

- Tab = Tablet, Cap = Capsule, Syp = Syrup, Inj = Injection
- OD = once daily, BD = twice daily, TDS = three times daily
- QID = four times daily, SOS = as needed, STAT = immediately
- AC = before food, PC = after food, HS = at bedtime
- 1-0-1 = morning - skip afternoon - night
- 1-1-1 = morning - afternoon - night
- 0-0-1 = night only
- 1-0-0 = morning only
- x 1 or x1 = once daily
- x 2 or x2 = twice daily (same as BD)
- x 3 or x3 = three times daily (same as TDS)
- "1 tab x 2" means one tablet twice daily, NOT two tablets
- "2 tab x 3" means two tablets three times daily
- "2 cap x 2 with milk" means two capsules twice daily, taken with milk

MULTI-PHASE DOSING:
- If a single medicine has multiple dosing phases (e.g., "500mg BD x 3 days, then 250mg OD x 4 days"), treat it as ONE medicine entry.
- Put the primary (first) phase in the main fields (dosage, frequency, duration).
- Put the subsequent phase(s) in the "instructions" field.
- Example: name="Azithromycin", dosage="500mg", frequency="BD", duration="3 days", instructions="Then 250mg once daily for 4 more days"
- Do NOT split a single medicine with two dosing phases into two separate medicine entries.

OD vs BD DISAMBIGUATION:
- "OD" (once daily) is FAR more common than "BD" (twice daily) in Indian prescriptions.
- If the handwriting is ambiguous between OD and BD, prefer OD and set confidence to "medium".
- BD is typically written clearly with two distinct letters. If you see a single stroke that could be O or B, choose OD.

COMMON INDIAN BRAND NAMES you might encounter:
Crocin, Dolo, Pan-D, Pan 40, Pantop, Augmentin, Azee, Monocef,
Shelcal, Ecosprin, Glycomet, Telma, Stamlo, Amlong, Thyronorm,
Atorva, Rosuvas, Metformin, Cetrizine, Allegra, Montair, Combiflam,
Flexon, Voveran, Aciloc, Rantac, Zifi, Oflox, Norflox, Moxikind,
Becosules, Supradyn, Revital, Neurobion, Volini, Moov,
Glimekind, Telmikind, Teneli, Zytonin, Tridi, Atorva, Pan,
Sizodon, Qutipin, Ativan, Rivotril, Serta, Placida, Escitalopram,
Rozap, Ambulax, Bisolvon, Styplon, Cruel Cap, Sigrun Cap,
Kanchnar Guggul, Chandraprabha Vati, Amaryl, Trajenta, Arkamin,
Olmezest, Lipiez, Ecosprin, Qutpin

AYURVEDIC MEDICINES you might encounter:
Indian prescriptions may include Ayurvedic formulations. Common ones:
Kanchnar Guggul, Chandraprabha Vati, Arogyavardhini Vati,
Triphala, Ashwagandha, Shatavari, Punarnava, Guduchi,
Dashmool, Sitopaladi Churna, Talisadi Churna, Avipattikar Churna
These are legitimate medicines — extract them the same way as allopathic drugs.

IMPORTANT DISTINCTIONS:
- Times like "7 AM", "6 PM", "at bedtime" are INSTRUCTIONS, not duration. Put them in the "instructions" field.
- Duration is how long to take the medicine: "5 days", "1 week", "1 month", "6 months", "to continue"
- If a generic name appears in brackets after the brand name (e.g., "Ativan (Lorazepam)"), the brand name goes in "name" and the dosage number goes in "dosage". Do NOT put the generic name in the dosage field.
- "AC" means before food, "PC" means after food — these go in "instructions" field
- "B/F" means before food, same as AC

CONFIDENCE RULES — be strict about this. Most well-known brand names and clear text should be "high". Reserve "medium" for cases where YOU would meaningfully struggle to read the text.

- "high" = DEFAULT. Use this when you can read the text clearly, OR when the handwriting is slightly messy but the brand name is well-known (Crocin, Dolo, Augmentin, Pan-D, Telma, Amlong, Glycomet, Metformin, Paracetamol, Amoxicillin, etc.). If a brand name is commonly prescribed in India and you can recognize it, mark "high" even if handwriting has mild stylization.

- "medium" = ONLY when the handwriting is genuinely ambiguous AND the brand name is not obvious. For example: strokes that could be O or B, letters that could be ambiguous (c/e, n/u, a/o), or unusual/rare brand names where you're making a judgment call. Do NOT use "medium" just because the handwriting is a bit messy if the drug is still recognizable.

- "low" = you are guessing. The handwriting is very unclear AND the drug name is uncommon enough that you can't recognize it from context.

STRONG HINT: If the text you're reading matches a well-known Indian brand name or a common generic (Paracetamol, Metformin, Telmisartan, Amlodipine, Atorvastatin, Pantoprazole, Amoxicillin, Azithromycin, Cetirizine, Levocetirizine, Montelukast, Domperidone, Ondansetron, Losartan, Ramipril, Aspirin, Clopidogrel, Rosuvastatin, Glimepiride, Vildagliptin, Sitagliptin, Dapagliflozin, Empagliflozin, Thyroxine), default to "high". These drugs are prescribed daily across India — doctors don't write them exotically.

=== NEW FIELDS YOU MUST RETURN ===

1. "aiSummary" — ONE natural-language sentence describing what you found overall.
   Examples:
   - "Looks like a cardiac regimen. 3 medicines identified."
   - "Appears to be a 5-day course for an upper respiratory infection."
   - "I couldn't confidently read any medicine names from this prescription."
   - "A routine diabetes management regimen with 4 medicines."
   Write in first person ("I"), warm but concise. One sentence only.

2. "aiConfidence" — an integer 0-100 representing your overall confidence that you read this prescription correctly.
   - 90-100: handwriting was clear, confident about every medicine
   - 70-89: handwriting was mostly clear, one or two ambiguous bits
   - 50-69: handwriting was hard but you could make out most things
   - 30-49: handwriting was very hard, mostly guessing
   - 0-29: you could barely read anything

3. "doctorNotes" — array of conditions and symptoms (NOT medicines). Shape:
   [{ "kind": "condition" | "symptom", "value": "HTN" }]
   If none visible, return empty array [].

=== ERROR RESPONSES ===

If the image is NOT a medical prescription (e.g., a receipt, a random document, a photo of food), respond with:
{ "error": "NOT_A_PRESCRIPTION", "message": "This doesn't appear to be a medical prescription." }

If the image is too blurry or dark to read, respond with:
{ "error": "UNREADABLE", "message": "The image is too blurry or dark to read. Please retake the photo with better lighting." }

=== OUTPUT FORMAT ===

Return ONLY valid JSON. No markdown backticks. No explanation outside the JSON.

Return this exact format:
{
  "medicines": [
    {
      "name": "medicine name as read from prescription",
      "dosage": "dosage with unit or null if not visible",
      "frequency": "frequency as written",
      "frequencyPlain": "plain English version (e.g., 'One tablet in the morning and one at night')",
      "duration": "duration or null if not visible",
      "instructions": "special instructions or null",
      "confidence": "high/medium/low",
      "formulation": "tablet/capsule/syrup/injection/cream/drops/inhaler"
    }
  ],
  "doctorNotes": [
    { "kind": "condition", "value": "HTN" }
  ],
  "aiSummary": "One-sentence natural language summary in first person.",
  "aiConfidence": 85,
  "doctorName": "doctor name if visible or null",
  "patientName": "patient name if visible or null",
  "clinicName": "clinic or hospital name if visible or null",
  "date": "prescription date if visible or null",
  "diagnosis": "diagnosis if written on prescription or null",
  "overallReadability": "good/fair/poor",
  "totalMedicines": 0
}`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, mimeType } = body;

    if (!image || !mimeType) {
      return NextResponse.json(
        { error: 'Please provide an image and its type.' },
        { status: 400 }
      );
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(mimeType)) {
      return NextResponse.json(
        {
          error: `Unsupported image format: ${mimeType}. Please use JPEG, PNG, or WebP.`,
        },
        { status: 400 }
      );
    }

    const maxBase64Length = 20 * 1024 * 1024;
    if (image.length > maxBase64Length) {
      return NextResponse.json(
        { error: 'Image is too large. Please use an image under 10MB.' },
        { status: 400 }
      );
    }

    if (image.startsWith('data:')) {
      return NextResponse.json(
        {
          error:
            'Please send raw base64 data without the data:image/... prefix.',
        },
        { status: 400 }
      );
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType,
                data: image,
              },
            },
            {
              type: 'text',
              text: PRESCRIPTION_PROMPT,
            },
          ],
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === 'text');

    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json(
        { error: 'AI returned no readable response' },
        { status: 500 }
      );
    }

    const rawText = textBlock.text;

    let jsonString = rawText.trim();
    if (jsonString.startsWith('```')) {
      jsonString = jsonString
        .replace(/^```json\s*\n?/i, '')
        .replace(/^```\s*\n?/, '')
        .replace(/\n?\s*```\s*$/, '');
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse Claude response as JSON:');
      console.error('Raw response was:', rawText);
      console.error('After cleaning:', jsonString);

      return NextResponse.json(
        {
          error:
            'Could not understand the prescription analysis. Please try again.',
          debug:
            process.env.NODE_ENV === 'development' ? rawText : undefined,
        },
        { status: 422 }
      );
    }

    if (parsed.error) {
      return NextResponse.json(
        {
          success: false,
          errorType: parsed.error,
          message: parsed.message,
        },
        { status: 422 }
      );
    }

    if (!parsed.medicines || !Array.isArray(parsed.medicines)) {
      parsed.medicines = [];
    }

    parsed.medicines = parsed.medicines.filter((med: any) => {
      if (!med.name || med.name.trim() === '') {
        console.warn('Dropping medicine with no name:', med);
        return false;
      }
      return true;
    });

    parsed.totalMedicines = parsed.medicines.length;

    // Note: even if medicines is empty, we still return a valid analysis.
    // The redesigned UI handles the "hard to read — only doctor notes" case
    // gracefully. This is intentional — low-confidence scans should not be
    // hard errors; they should show the adaptive retake hero + doctor notes.

    const analysis = analyzePrescription(parsed);

    return NextResponse.json({
      success: true,
      data: analysis,
      medicineCount: analysis.medicines.length,
      interactionCount: analysis.interactions.length,
      savings: analysis.savings,
    });
  } catch (error: any) {
    console.error('Scan error:', error?.message || error);
    console.error('Stack:', error?.stack);
    return NextResponse.json(
      { error: `Something went wrong: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}