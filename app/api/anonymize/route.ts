import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    // PII Detection patterns
    const piiPatterns = {
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
      ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
      creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
      ipAddress: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
      dateOfBirth: /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,
      medicalRecord: /\b(patient|medical record|diagnosis|treatment)[\s:][\w\s]+\b/gi,
    };

    const detectedPII: Record<string, any> = {};
    let anonymizedText = text;

    // Detect PII types
    Object.entries(piiPatterns).forEach(([type, pattern]) => {
      const matches = text.match(pattern);
      if (matches) {
        detectedPII[type] = {
          count: matches.length,
          matches: matches.slice(0, 5), // First 5 matches
        };
        // Anonymize
        anonymizedText = anonymizedText.replace(pattern, `[${type.toUpperCase()}]`);
      }
    });

    return NextResponse.json({
      success: true,
      original_length: text.length,
      anonymized_length: anonymizedText.length,
      pii_detected: detectedPII,
      anonymized_text: anonymizedText,
      confidence: Object.keys(detectedPII).length > 0 ? 0.95 : 1.0,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/anonymize',
    method: 'POST',
    description: 'Detect and anonymize PII in medical text',
    request: {
      text: 'Medical text with PII to anonymize',
    },
    response: {
      success: true,
      anonymized_text: 'Anonymized version',
      pii_detected: {
        email: { count: 1, matches: [] },
        phone: { count: 1, matches: [] },
      },
    },
  });
}
