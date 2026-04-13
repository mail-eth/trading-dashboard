import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Test simple fetch
    const res = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT')
    const data = await res.json()
    
    return NextResponse.json({
      test: true,
      btcPrice: data.price,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ 
      error: String(error),
      test: true,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}