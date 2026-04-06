import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { medicineName, genericName, dosage, frequency, frequencyPlain } = body;

    if (!medicineName) {
      return NextResponse.json(
        { error: 'Please provide a medicine name.' },
        { status: 400 }
      );
    }

    const userMessage = `Medicine: ${medicineName}${genericName ? ` (Generic: ${genericName})` : ''}
Dosage: ${dosage || 'not specified'}
Frequency: ${frequency || 'not specified'}${frequencyPlain ? ` — ${frequencyPlain}` : ''}`;

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: EXPLAIN_PROMPT },
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

    // Parse JSON response
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