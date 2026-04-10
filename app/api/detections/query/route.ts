import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const type = request.nextUrl.searchParams.get('type');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10');

    // Mock data - in production this would query Supabase
    const detections = [
      {
        id: '1',
        type: 'email',
        confidence: 0.99,
        detected_at: new Date(Date.now() - 3600000).toISOString(),
        status: 'processed',
      },
      {
        id: '2',
        type: 'phone',
        confidence: 0.95,
        detected_at: new Date(Date.now() - 7200000).toISOString(),
        status: 'processed',
      },
      {
        id: '3',
        type: 'ssn',
        confidence: 0.98,
        detected_at: new Date(Date.now() - 10800000).toISOString(),
        status: 'processed',
      },
    ];

    const filtered = type
      ? detections.filter((d) => d.type === type)
      : detections;

    return NextResponse.json({
      success: true,
      total: filtered.length,
      limit,
      detections: filtered.slice(0, limit),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch detections' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { type, confidence_min, confidence_max } = await request.json();

    return NextResponse.json({
      success: true,
      message: 'Query logged',
      filters: { type, confidence_min, confidence_max },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process query' },
      { status: 500 }
    );
  }
}
