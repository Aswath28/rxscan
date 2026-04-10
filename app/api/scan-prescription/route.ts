import { analyzePrescription } from '@/lib/drug-matcher';
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// Initialize the Anthropic client
// It automatically reads ANTHROPIC_API_KEY from your .env.local
const anthropic = new Anthropic();

const PRESCRIPTION_PROMPT = `You are a medical prescription reader specializing in Indian handwritten prescriptions.

You are looking at a photograph of a handwritten doctor's prescription from India. Your task is to extract EVERY medicine prescribed.

For each medicine, identify:
1. Medicine name (exactly as written — could be a brand name or generic name)
2. Dosage (e.g., 500mg, 10mg, 40mg)
3. Frequency (e.g., 1-0-1, BD, TDS, OD, SOS)
4. Duration (e.g., 5 days, 1 week, 1 month, "to continue", "as needed")
5. Special instructions if visible (e.g., "after food", "before bed", "with milk", "before breakfast", "at 7 AM", "at 6 PM", "AC", "PC")
6. Formulation (tablet, capsule, syrup, injection, cream, drops, inhaler, pellets, sachets)

CRITICAL CONTEXT — Indian prescription abbreviations:
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

CONFIDENCE RULES:
- "high" = you can clearly read the text
- "medium" = you're fairly sure but handwriting is ambiguous
- "low" = you're guessing — the handwriting is very unclear

If the image is NOT a medical prescription (e.g., a receipt, a random document, a photo of food), respond with:
{ "error": "NOT_A_PRESCRIPTION", "message": "This doesn't appear to be a medical prescription." }

If the image is too blurry or dark to read, respond with:
{ "error": "UNREADABLE", "message": "The image is too blurry or dark to read. Please retake the photo with better lighting." }

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
    // 1. Read the image from the request body
    const body = await request.json();
    const { image, mimeType } = body;

    // ============================================================
    // STEP 5: INPUT VALIDATION & GUARDS (runs first to save money)
    // ============================================================

    // GUARD 1: Missing data
    if (!image || !mimeType) {
      return NextResponse.json(
        { error: 'Please provide an image and its type.' },
        { status: 400 }
      );
    }

    // GUARD 2: Invalid MIME type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(mimeType)) {
      return NextResponse.json(
        {
          error: `Unsupported image format: ${mimeType}. Please use JPEG, PNG, or WebP.`,
        },
        { status: 400 }
      );
    }

    // GUARD 3: Image too large (20MB base64 ≈ ~15MB raw file)
    const maxBase64Length = 20 * 1024 * 1024;
    if (image.length > maxBase64Length) {
      return NextResponse.json(
        { error: 'Image is too large. Please use an image under 10MB.' },
        { status: 400 }
      );
    }

    // GUARD 4: Reject data URL prefix (frontend should send raw base64 only)
    if (image.startsWith('data:')) {
      return NextResponse.json(
        {
          error:
            'Please send raw base64 data without the data:image/... prefix.',
        },
        { status: 400 }
      );
    }

    // ============================================================
    // STEP 3: CALL CLAUDE VISION API
    // ============================================================

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

    // Extract text from Claude's response
    const textBlock = response.content.find(
      (block) => block.type === 'text'
    );

    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json(
        { error: 'AI returned no readable response' },
        { status: 500 }
      );
    }

    const rawText = textBlock.text;

    // ============================================================
    // STEP 4: PARSE AND VALIDATE THE JSON RESPONSE
    // ============================================================

    // Clean up — Claude sometimes wraps JSON in markdown backticks
    let jsonString = rawText.trim();
    if (jsonString.startsWith('```')) {
      jsonString = jsonString
        .replace(/^```json\s*\n?/i, '')
        .replace(/^```\s*\n?/, '')
        .replace(/\n?\s*```\s*$/, '');
    }

    // Try to parse the JSON
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

    // Handle error responses from Claude (not-a-prescription, unreadable)
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

    // Validate that we got a medicines array
    if (!parsed.medicines || !Array.isArray(parsed.medicines)) {
      return NextResponse.json(
        {
          error:
            'Could not identify any medicines in this image. Is this a medical prescription?',
        },
        { status: 422 }
      );
    }

    // Filter out any medicines with no name
    parsed.medicines = parsed.medicines.filter((med: any) => {
      if (!med.name || med.name.trim() === '') {
        console.warn('Dropping medicine with no name:', med);
        return false;
      }
      return true;
    });

    // Update the count
    parsed.totalMedicines = parsed.medicines.length;

    // If no medicines survived the filter
    if (parsed.medicines.length === 0) {
      return NextResponse.json(
        {
          error:
            'No medicine names could be read from this prescription. The handwriting may be too unclear.',
        },
        { status: 422 }
      );
    }

    // ============================================================
    // SUCCESS — Return the parsed prescription
    // ============================================================

    const analysis = analyzePrescription(parsed);

    return NextResponse.json({
      success: true,
      data: analysis,
      medicineCount: analysis.medicines.length,
      interactionCount: analysis.interactions.length,
      savings: analysis.savings,
    });

  } catch (error) {
    console.error('Scan error:', error);
    return NextResponse.json(
      { error: 'Something went wrong processing your prescription' },
      { status: 500 }
    );
  }
}