import { NextRequest, NextResponse } from 'next/server';

const EXCHANGE_CODE_MAP: Record<string, string> = {
  NYSE:   'US',
  NASDAQ: 'US',
  ASX:    'AU',
  LSE:    'LSE',
  TSX:    'TO',
};

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const ticker   = searchParams.get('ticker')?.toUpperCase();
  const exchange = searchParams.get('exchange');

  if (!ticker || !exchange) {
    return NextResponse.json({ valid: false }, { status: 400 });
  }

  // "Other" exchange — can't validate against EODHD
  const exchangeCode = EXCHANGE_CODE_MAP[exchange];
  if (!exchangeCode) {
    return NextResponse.json({ valid: true });
  }

  const apiKey    = process.env.NEXT_PUBLIC_EODHD_API_KEY ?? 'demo';
  const lookback  = new Date(Date.now() - 5 * 86_400_000).toISOString().split('T')[0];
  const today     = new Date().toISOString().split('T')[0];
  const url       = `https://eodhd.com/api/eod/${encodeURIComponent(ticker)}.${exchangeCode}?api_token=${apiKey}&fmt=json&from=${lookback}&to=${today}&order=d`;

  try {
    const resp = await fetch(url, { next: { revalidate: 3600 } });
    if (!resp.ok) return NextResponse.json({ valid: false });
    const data = await resp.json();
    return NextResponse.json({ valid: Array.isArray(data) && data.length > 0 });
  } catch {
    return NextResponse.json({ valid: false });
  }
}
