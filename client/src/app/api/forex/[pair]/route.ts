import { NextRequest, NextResponse } from 'next/server';

const EODHD_KEY = process.env.NEXT_PUBLIC_EODHD_API_KEY ?? 'demo';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ pair: string }> },
) {
  const { pair } = await params;

  const url = `https://eodhd.com/api/real-time/${pair}.FOREX?api_token=${EODHD_KEY}&fmt=json`;

  const upstream = await fetch(url, { next: { revalidate: 300 } }); // cache 5 min

  if (!upstream.ok) {
    return NextResponse.json(
      { error: `EODHD returned ${upstream.status}` },
      { status: upstream.status },
    );
  }

  const data = await upstream.json();
  return NextResponse.json(data);
}
