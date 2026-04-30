import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

// ============================================================
// VERIFIED PATH — unchanged from your previous prompt.
// Used when the medicine matched the verified DB.
// ============================================================
const EXPLAIN_PROMPT = `You are a friendly Indian pharmacist explaining a medicine to a patient in simple, clear English. The patient has no medical background.

For the medicine provided, give a brief explanation covering:

1. WHAT IT IS: One sentence — drug category and what class it belongs to.
2. WHAT IT DOES: 2 sentences max — what it does in the body, in plain English. No jargon.
3. HOW TO TAKE IT: 1-2 sentences — specific to the dosage and frequency provided. Include food timing if relevant.
4. COMMON SIDE EFFECTS: List 3-4 most common ones in plain language. Keep it calm — don't scare the patient.
5. IMPORTANT WARNINGS: 1-2 sentences ONLY if there's something critical (e.g., don't stop abruptly, avoid alcohol, take on empty stomach). Skip this section if nothing critical.

RULES:
- Keep the TOTAL response under 150 words.
- Use simple words. "Reduces stomach acid" not "Proton pump inhibitor that inhibits H+/K+-ATPase".
- Be warm and reassuring, not clinical.
- Do NOT say "consult your doctor" — the user already knows that.
- Do NOT include any disclaimers or caveats.
- Return ONLY valid JSON in this format:

{
  "whatItIs": "one sentence",
  "whatItDoes": "1-2 sentences",
  "howToTake": "1-2 sentences specific to the dosage/frequency given",
  "sideEffects": ["effect 1", "effect 2", "effect 3"],
  "importantWarning": "1-2 sentences or null if nothing critical"
}`;

// ============================================================
// UNVERIFIED PATH — new.
// Used when the medicine has source: 'ai_fallback' (no DB match
// but name is real-looking). Haiku must refuse to invent.
// ============================================================
const UNVERIFIED_PROMPT = `You are explaining an Indian outpatient medicine to a patient. The medicine name was extracted from a handwritten prescription via OCR but is NOT in our verified drug database.

If you confidently recognize this as a real medicine sold in India (brand or generic), respond with:
{
  "recognized": true,
  "molecule": "active ingredient(s)",
  "drugClass": "e.g. Antibiotic, Antacid, Antihypertensive",
  "explanation": {
    "whatItIs": "one plain-English sentence",
    "whatItDoes": "1-2 plain-English sentences. No jargon.",
    "howToTake": "1-2 sentences specific to the dosage/frequency given",
    "sideEffects": ["3-4 short bullets in plain language"],
    "importantWarning": "1-2 sentences if critical, otherwise null"
  }
}

If you do NOT recognize the name, are unsure, or suspect OCR garbled it beyond recognition, respond with:
{ "recognized": false, "reason": "brief reason" }

Strict rules:
- DO NOT invent a medicine. Uncertainty -> recognized: false.
- DO NOT provide pricing, generic alternatives, or savings claims.
- DO NOT make claims about effectiveness vs other drugs.
- DO NOT recommend this medicine over any other.
- Keep the explanation under 150 words total.
- Return ONLY the JSON. No preamble, no commentary.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      medicineName,
      genericName,
      dosage,
      frequency,
      frequencyPlain,
      unverified,
    } = body;

    if (!medicineName) {
      return NextResponse.json(
        { error: 'Please provide a medicine name.' },
        { status: 400 }
      );
    }

    // Build user message — same shape for both paths
    const userMessage = unverified
      ? `Medicine name (as read from prescription): ${medicineName}
Dosage (as read): ${dosage || 'not specified'}
Frequency: ${frequency || 'not specified'}${frequencyPlain ? ` — ${frequencyPlain}` : ''}`
      : `Medicine: ${medicineName}${genericName ? ` (Generic: ${genericName})` : ''}
Dosage: ${dosage || 'not specified'}
Frequency: ${frequency || 'not specified'}${frequencyPlain ? ` — ${frequencyPlain}` : ''}`;

    const systemPrompt = unverified ? UNVERIFIED_PROMPT : EXPLAIN_PROMPT;

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: systemPrompt },
            { type: 'text', text: userMessage },
          ],
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json(
        { error: 'AI returned no response' },
        { status: 500 }
      );
    }

    // Strip code fences if present
    let jsonString = textBlock.text.trim();
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
      console.error('Failed to parse explanation:', textBlock.text);
      return NextResponse.json(
        { error: 'Could not generate explanation. Please try again.' },
        { status: 422 }
      );
    }

    // ============================================================
    // UNVERIFIED RESPONSE
    // ============================================================
    if (unverified) {
      if (parsed.recognized === false) {
        return NextResponse.json({
          success: true,
          medicine: medicineName,
          recognized: false,
          reason: parsed.reason || 'Medicine not recognized',
        });
      }
      return NextResponse.json({
        success: true,
        medicine: medicineName,
        recognized: true,
        molecule: parsed.molecule || null,
        drugClass: parsed.drugClass || null,
        explanation: parsed.explanation || {
          whatItIs: null,
          whatItDoes: null,
          howToTake: null,
          sideEffects: [],
          importantWarning: null,
        },
      });
    }

    // ============================================================
    // VERIFIED RESPONSE — original shape, untouched
    // ============================================================
    return NextResponse.json({
      success: true,
      medicine: medicineName,
      explanation: parsed,
    });
  } catch (error) {
    console.error('Explain error:', error);
    return NextResponse.json(
      { error: 'Something went wrong generating the explanation' },
      { status: 500 }
    );
  }
}