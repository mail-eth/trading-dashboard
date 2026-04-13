import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const res = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT')
    const data = await res.json()
    
    // Return raw data to see what's happening
    return NextResponse.json({
      raw: data,
      message: 'raw data returned'
    })
  } catch (error) {
    return NextResponse.json({ 
      error: String(error)
    }, { status: 500 })
  }
}