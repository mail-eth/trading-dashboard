import { NextResponse } from 'next/server'

const WATCH_PAIRS = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT',
  'ADAUSDT', 'DOGEUSDT', 'DOTUSDT', 'AVAXUSDT', 'LINKUSDT',
  'MATICUSDT', 'LTCUSDT', 'UNIUSDT', 'ATOMUSDT', 'NEARUSDT'
]

async function fetchKlines(symbol: string) {
  try {
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1h&limit=200`
    const res = await fetch(url, { 
      headers: { 'Content-Type': 'application/json' }
    })
    if (!res.ok) {
      console.error(`Failed to fetch ${symbol}: ${res.status}`)
      return null
    }
    return res.json()
  } catch (error) {
    console.error(`Error fetching ${symbol}:`, error)
    return null
  }
}

function calculateEMA(data: number[], period: number): number {
  if (data.length < period) return data[data.length - 1]
  const multiplier = 2 / (period + 1)
  let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period
  for (let i = period; i < data.length; i++) {
    ema = data[i] * multiplier + ema * (1 - multiplier)
  }
  return ema
}

function calculateRSI(closes: number[], period: number = 14): number {
  if (closes.length < period + 1) return 50
  const deltas = closes.slice(1).map((c, i) => c - closes[i])
  const gains = deltas.slice(-period).filter((d: number) => d > 0)
  const losses = deltas.slice(-period).filter((d: number) => d < 0).map((d: number) => Math.abs(d))
  const avgGain = gains.length ? gains.reduce((a: number, b: number) => a + b, 0) / period : 0
  const avgLoss = losses.length ? losses.reduce((a: number, b: number) => a + b, 0) / period : 0
  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  return 100 - (100 / (1 + rs))
}

function calculateBollinger(closes: number[], period: number = 20) {
  if (closes.length < period) return { upper: 0, middle: 0, lower: 0 }
  const recent = closes.slice(-period)
  const sma = recent.reduce((a: number, b: number) => a + b, 0) / period
  const variance = recent.map((x: number) => Math.pow(x - sma, 2)).reduce((a: number, b: number) => a + b, 0) / period
  const stdDev = Math.sqrt(variance)
  return {
    upper: sma + (2 * stdDev),
    middle: sma,
    lower: sma - (2 * stdDev)
  }
}

function calculateMACD(closes: number[]) {
  if (closes.length < 35) return { macd: 0, signal: 0, histogram: 0 }
  const ema12 = calculateEMA(closes, 12)
  const ema26 = calculateEMA(closes, 26)
  const macdLine = ema12 - ema26
  const macdValues: number[] = []
  for (let i = 26; i < closes.length; i++) {
    macdValues.push(calculateEMA(closes.slice(0, i + 1), 12) - calculateEMA(closes.slice(0, i + 1), 26))
  }
  const signalLine = macdValues.length >= 9 ? calculateEMA(macdValues, 9) : macdLine
  return {
    macd: macdLine,
    signal: signalLine,
    histogram: macdLine - signalLine
  }
}

async function analyzeSymbol(symbol: string) {
  try {
    const klines = await fetchKlines(symbol)
    if (!klines || !Array.isArray(klines) || klines.length < 50) {
      console.error(`Invalid data for ${symbol}`)
      return null
    }
    
    const closes = klines.map((k: any) => parseFloat(k[4]))
    const volumes = klines.map((k: any) => parseFloat(k[5]))
    
    const currentPrice = closes[closes.length - 1]
    const avgVolume = volumes.slice(0, -1).reduce((a: number, b: number) => a + b, 0) / (volumes.length - 1)
    const currentVolume = volumes[volumes.length - 1]
    const volumeRatio = currentVolume / avgVolume
    
    const rsi = calculateRSI(closes)
    const ema20 = calculateEMA(closes, 20)
    const ema50 = calculateEMA(closes, 50)
    const ema200 = calculateEMA(closes, 200)
    const bb = calculateBollinger(closes)
    const macd = calculateMACD(closes)
    
    // Scoring
    let score = 0
    const reasons: string[] = []
    
    if (rsi < 35) { score += 3; reasons.push(`RSI oversold (${rsi.toFixed(1)})`) }
    else if (rsi < 45) { score += 2; reasons.push(`RSI low (${rsi.toFixed(1)})`) }
    if (currentPrice > ema200) { score += 2; reasons.push('Above EMA200') }
    else { score -= 2; reasons.push('Below EMA200') }
    if (ema20 > ema50) { score += 1; reasons.push('Bullish EMA cross') }
    else { score -= 1; reasons.push('Bearish EMA cross') }
    if (currentPrice <= bb.lower * 1.02) { score += 2; reasons.push('Near Bollinger lower') }
    if (currentPrice >= bb.upper * 0.98) { score -= 2; reasons.push('Near Bollinger upper') }
    if (macd.histogram > 0 && macd.macd > macd.signal) { score += 2; reasons.push('MACD bullish') }
    if (macd.histogram < 0 && macd.macd < macd.signal) { score -= 2; reasons.push('MACD bearish') }
    if (volumeRatio > 1.5 && score > 0) { score += 1; reasons.push(`Volume spike ${volumeRatio.toFixed(1)}x`) }
    
    let signal = 'NEUTRAL'
    if (score >= 4) signal = 'STRONG_BUY'
    else if (score >= 2) signal = 'BUY'
    else if (score <= -4) signal = 'STRONG_SELL'
    else if (score <= -2) signal = 'SELL'
    
    const stopLoss = currentPrice * 0.98
    const takeProfit1 = currentPrice * 1.02
    const takeProfit2 = currentPrice * 1.04
    
    return {
      symbol,
      price: currentPrice,
      score,
      signal,
      rsi: parseFloat(rsi.toFixed(2)),
      ema20: parseFloat(ema20.toFixed(4)),
      ema200: parseFloat(ema200.toFixed(4)),
      macd: parseFloat(macd.histogram.toFixed(4)),
      volume: parseFloat(volumeRatio.toFixed(2)),
      stopLoss: parseFloat(stopLoss.toFixed(2)),
      takeProfit1: parseFloat(takeProfit1.toFixed(2)),
      takeProfit2: parseFloat(takeProfit2.toFixed(2)),
      reasons
    }
  } catch (error) {
    console.error(`Error analyzing ${symbol}:`, error)
    return null
  }
}

export async function GET() {
  try {
    console.log('Starting signal analysis...')
    const results = await Promise.all(
      WATCH_PAIRS.map(pair => analyzeSymbol(pair))
    )
    
    const signals = results.filter(Boolean).sort((a: any, b: any) => b.score - a.score)
    console.log(`Found ${signals.length} signals`)
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      signals,
      actionable: signals.filter((s: any) => ['BUY', 'STRONG_BUY', 'SELL', 'STRONG_SELL'].includes(s.signal))
    })
  } catch (error) {
    console.error('Error in signals API:', error)
    return NextResponse.json({ error: 'Failed to fetch signals', details: String(error) }, { status: 500 })
  }
}