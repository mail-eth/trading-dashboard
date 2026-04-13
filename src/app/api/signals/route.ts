import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Test simple fetch
    const res = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT')
    const data = await res.json()
    
    return NextResponse.json({
      test: 'SIGNALS_API_V2',
      btcPrice: data.price,
      status: res.status,
      ok: res.ok,
      url: res.url,
      headers: Object.fromEntries(res.headers.entries()),
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ 
      error: String(error),
      test: 'SIGNALS_API_V2',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}