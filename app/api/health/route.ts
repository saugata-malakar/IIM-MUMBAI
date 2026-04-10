import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'Medical Anonymization API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      anonymize: '/api/anonymize',
      log_detection: '/api/detections/log',
      query_detections: '/api/detections/query',
      health: '/api/health',
    },
    database: 'Supabase PostgreSQL',
    ai_engine: 'Google Gemini API',
  });
}
