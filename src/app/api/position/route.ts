import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const res = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT')
    const data = await res.json()
    
    return NextResponse.json({
      currentPrice: data.price,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to fetch'
    }, { status: 500 })
  }
}