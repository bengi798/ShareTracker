import { NextRequest, NextResponse } from 'next/server';

const EODHD_KEY = process.env.NEXT_PUBLIC_EODHD_API_KEY ?? 'demo';

export async function GET(req: NextRequest) {
  const symbols = req.nextUrl.searchParams.get('symbols') ?? '';
  const parts = symbols.split(',').filter(Boolean);
  if (parts.length === 0) return NextResponse.json([]);

  const [first, ...rest] = parts;
  const s = rest.length > 0 ? `&s=${rest.join(',')}` : '';
  const url = `https://eodhd.com/api/real-time/${first}?${s}&api_token=${EODHD_KEY}&fmt=json`;

  const upstream = await fetch(url, { cache: 'no-store' });

  if (!upstream.ok) {
    return NextResponse.json(
      { error: `EODHD returned ${upstream.status}` },
      { status: upstream.status },
    );
  }

  const data = await upstream.json();
  // EODHD returns a plain object for a single symbol, array for multiple
  return NextResponse.json(Array.isArray(data) ? data : [data]);
}
