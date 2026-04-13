import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Test simple fetch
    const res = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT')
    const data = await res.json()
    
    console.log('Binance response:', JSON.stringify(data))
    
    return NextResponse.json({
      test: true,
      btcPrice: data.price || 'NO_PRICE',
      raw: data,
      status: res.status,
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