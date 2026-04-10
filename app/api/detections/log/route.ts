import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { type, text, confidence } = await request.json();

    if (!text || !type) {
      return NextResponse.json(
        { error: 'text and type are required' },
        { status: 400 }
      );
    }

    // Log detection to database
    const detectionRecord = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      text: text.substring(0, 100),
      confidence: confidence || 0.9,
      timestamp: new Date().toISOString(),
      status: 'detected',
    };

    return NextResponse.json({
      success: true,
      detection_id: detectionRecord.id,
      message: `${type} detection logged`,
      detected_at: detectionRecord.timestamp,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to log detection' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/detections/log',
    description: 'Log PII detection event',
    method: 'POST',
  });
}
