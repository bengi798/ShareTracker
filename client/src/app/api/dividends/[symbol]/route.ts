import { NextRequest, NextResponse } from 'next/server';

const EODHD_KEY = process.env.NEXT_PUBLIC_EODHD_API_KEY ?? 'demo';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await params;
  const from = req.nextUrl.searchParams.get('from') ?? '1900-01-01';

  const url = `https://eodhd.com/api/div/${symbol}?from=${from}&api_token=${EODHD_KEY}&fmt=json`;

  const upstream = await fetch(url, { next: { revalidate: 3600 } }); // cache 1 hour

  if (!upstream.ok) {
    return NextResponse.json(
      { error: `EODHD returned ${upstream.status}` },
      { status: upstream.status },
    );
  }

  const data = await upstream.json();
  return NextResponse.json(data);
}
