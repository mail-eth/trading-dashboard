'use client'

import { useState, useEffect } from 'react'

interface Position {
  symbol: string
  entryPrice: number
  quantity: number
  stopLoss: number
  takeProfit: number
}

interface Signal {
  symbol: string
  signal: string
  score: number
  price: number
  rsi: number
  macd: number
  volume: number
  reasons: string[]
}

export default function TradingDashboard() {
  const [view, setView] = useState<'dashboard' | 'signals'>('dashboard')
  const [position, setPosition] = useState<Position | null>(null)
  const [currentPrice, setCurrentPrice] = useState(0)
  const [balance, setBalance] = useState(124.65)
  const [lastUpdate, setLastUpdate] = useState('')
  const [loading, setLoading] = useState(true)
  const [glowColor, setGlowColor] = useState('from-green-500 to-emerald-600')
  
  // Signals
  const [signals, setSignals] = useState<Signal[]>([])
  const [signalFilter, setSignalFilter] = useState<'all' | 'buy' | 'strong'>('all')

  // Fetch position data
  const fetchPosition = async () => {
    try {
      const res = await fetch('/api/position')
      const data = await res.json()
      if (data.position) {
        setPosition(data.position)
      }
    } catch (error) {
      console.error('Position error:', error)
    }
    setLoading(false)
  }

  // Fetch live BTC price from Binance (public)
  const fetchPrice = async () => {
    try {
      const res = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT')
      const data = await res.json()
      if (data.price) {
        setCurrentPrice(parseFloat(data.price))
      }
    } catch (error) {
      console.error('Price error:', error)
    }
  }

  // Fetch signals client-side
  const fetchSignals = async () => {
    try {
      const res = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT')
      const btcData = await res.json()
      setCurrentPrice(parseFloat(btcData.price))
      
      // Fetch klines for signals
      const klinesRes = await fetch(`https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1h&limit=200`)
      const klines = await klinesRes.json()
      
      if (klines && klines.length > 0) {
        const closes = klines.map((k: any) => parseFloat(k[4]))
        const volumes = klines.map((k: any) => parseFloat(k[5]))
        const currentPriceLocal = closes[closes.length - 1]
        const avgVolume = volumes.slice(0, -1).reduce((a: number, b: number) => a + b, 0) / (volumes.length - 1)
        const currentVolume = volumes[volumes.length - 1]
        const volumeRatio = currentVolume / avgVolume
        
        // Simple RSI
        const deltas = closes.slice(1).map((c: number, i: number) => c - closes[i])
        const gains = deltas.slice(-14).filter((d: number) => d > 0)
        const losses = deltas.slice(-14).filter((d: number) => d < 0).map((d: number) => Math.abs(d))
        const avgGain = gains.length ? gains.reduce((a: number, b: number) => a + b, 0) / 14 : 0
        const avgLoss = losses.length ? losses.reduce((a: number, b: number) => a + b, 0) / 14 : 0
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
        const rsi = 100 - (100 / (1 + rs))
        
        // Simple MACD
        const ema12 = closes.slice(-12).reduce((a: number, b: number) => a + b, 0) / 12
        const ema26 = closes.slice(-26).reduce((a: number, b: number) => a + b, 0) / 26
        const macd = ema12 - ema26
        
        // Score
        let score = 0
        const reasons: string[] = []
        
        if (rsi < 35) { score += 3; reasons.push(`RSI oversold (${rsi.toFixed(1)})`) }
        else if (rsi < 45) { score += 2; reasons.push(`RSI low (${rsi.toFixed(1)})`) }
        if (macd > 0) { score += 2; reasons.push('MACD bullish') }
        if (volumeRatio > 1.2) { score += 1; reasons.push(`Volume ${volumeRatio.toFixed(1)}x`) }
        
        let signal = 'NEUTRAL'
        if (score >= 4) signal = 'STRONG_BUY'
        else if (score >= 2) signal = 'BUY'
        
        setSignals([{
          symbol: 'BTCUSDT',
          signal,
          score,
          price: currentPriceLocal,
          rsi: parseFloat(rsi.toFixed(2)),
          macd: parseFloat(macd.toFixed(4)),
          volume: parseFloat(volumeRatio.toFixed(2)),
          reasons
        }])
      }
    } catch (error) {
      console.error('Signals error:', error)
    }
  }

  useEffect(() => {
    fetchPosition()
    fetchPrice()
    fetchSignals()
    
    const interval = setInterval(() => {
      fetchPrice()
      fetchSignals()
    }, 10000)
    
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    setLastUpdate(new Date().toLocaleTimeString())
  }, [currentPrice])

  // Calculate P&L
  const pnl = position ? (currentPrice - position.entryPrice) * position.quantity : 0
  const pnlPct = position ? ((currentPrice - position.entryPrice) / position.entryPrice) * 100 : 0
  const totalPnl = balance - 124.72
  const totalPnlPct = (totalPnl / 124.72) * 100
  const multiplier = balance / 124.72

  useEffect(() => {
    if (pnl >= 0) setGlowColor('from-green-500 to-emerald-600')
    else setGlowColor('from-red-500 to-rose-600')
  }, [pnl])

  const filteredSignals = signals.filter(s => {
    if (signalFilter === 'buy') return s.signal.includes('BUY')
    if (signalFilter === 'strong') return s.signal === 'STRONG_BUY'
    return true
  })

  const getSignalIcon = (signal: string) => {
    if (signal === 'STRONG_BUY') return '🟢🟢'
    if (signal.includes('BUY')) return '🟢'
    if (signal.includes('SELL')) return '🔴'
    return '🟡'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-slate-900 text-white">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 p-6 max-w-4xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <div className="inline-flex items-center gap-2">
            <span className="text-4xl">📈</span>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Ellie Trading
            </h1>
            <span className="text-4xl">💜</span>
          </div>
          
          {/* View Toggle */}
          <div className="flex justify-center gap-3 mt-4">
            <button
              onClick={() => setView('dashboard')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                view === 'dashboard' ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              📊 Dashboard
            </button>
            <button
              onClick={() => setView('signals')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                view === 'signals' ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              📈 Signals
            </button>
          </div>
        </header>

        {view === 'dashboard' ? (
          <>
            {/* Balance Card */}
            <section className="mb-10">
              <div className={`relative bg-gradient-to-br ${glowColor} rounded-3xl p-8 shadow-2xl`}>
                <div className="absolute inset-0 bg-black/30 rounded-3xl backdrop-blur-sm" />
                <div className="relative z-10">
                  <p className="text-white/70 text-sm font-medium mb-1">TOTAL PORTFOLIO VALUE</p>
                  <div className="flex items-baseline gap-3">
                    <h2 className="text-6xl font-bold text-white tracking-tight">${balance.toFixed(2)}</h2>
                    <span className="text-2xl font-semibold text-white/80">USD</span>
                  </div>
                  
                  <div className="mt-6 flex items-center gap-4">
                    <div className={`px-4 py-2 rounded-full backdrop-blur-sm ${pnl >= 0 ? 'bg-green-500/30' : 'bg-red-500/30'}`}>
                      <span className={`text-lg font-bold ${pnl >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                        {pnl >= 0 ? '▲' : '▼'} ${Math.abs(pnl).toFixed(2)} ({pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%)
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${pnl >= 0 ? 'bg-gradient-to-r from-green-400 to-emerald-300' : 'bg-gradient-to-r from-red-400 to-rose-300'}`}
                          style={{ width: `${Math.min(100, (multiplier - 1) * 100 + 50)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Stats Grid */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              {[
                { label: 'Multiplier', value: `${multiplier.toFixed(3)}x`, icon: '⚡', color: 'from-yellow-500 to-orange-500' },
                { label: 'BTC Price', value: `$${currentPrice.toFixed(0)}`, icon: '₿', color: 'from-blue-500 to-cyan-500' },
                { label: 'Total P&L', value: `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)}`, icon: '📊', color: totalPnl >= 0 ? 'from-green-500 to-emerald-500' : 'from-red-500 to-rose-500' },
                { label: 'Win Rate', value: position ? '1/1' : '—', icon: '🎯', color: 'from-purple-500 to-pink-500' },
              ].map((stat, i) => (
                <div key={i} className={`bg-gradient-to-br ${stat.color} p-0.5 rounded-2xl`}>
                  <div className="bg-gray-900 rounded-2xl p-4 h-full">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{stat.icon}</span>
                      <span className="text-gray-400 text-xs font-medium">{stat.label}</span>
                    </div>
                    <p className="text-2xl font-bold text-white truncate">{stat.value}</p>
                  </div>
                </div>
              ))}
            </section>

            {/* Active Position */}
            <section className="mb-10">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span>💼</span> Active Position
              </h3>
              {position ? (
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700/50">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">🪙</span>
                        <div>
                          <h4 className="text-2xl font-bold">{position.symbol.replace('USDT', '/USDT')}</h4>
                          <p className="text-gray-400 text-sm">{position.quantity} BTC</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-3xl font-bold ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)} USD
                      </p>
                      <p className={`text-sm ${pnlPct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-700/30 rounded-xl p-3">
                      <p className="text-gray-400 text-xs mb-1">Entry</p>
                      <p className="font-bold text-white">${position.entryPrice.toFixed(2)}</p>
                    </div>
                    <div className="bg-gray-700/30 rounded-xl p-3">
                      <p className="text-gray-400 text-xs mb-1">Current</p>
                      <p className="font-bold text-white">${currentPrice.toFixed(2)}</p>
                    </div>
                    <div className="bg-red-500/20 rounded-xl p-3">
                      <p className="text-gray-400 text-xs mb-1">Stop Loss</p>
                      <p className="font-bold text-red-400">${position.stopLoss.toFixed(2)}</p>
                    </div>
                    <div className="bg-green-500/20 rounded-xl p-3">
                      <p className="text-gray-400 text-xs mb-1">Take Profit</p>
                      <p className="font-bold text-green-400">${position.takeProfit.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 text-center">
                  <span className="text-5xl mb-4 block">📭</span>
                  <p className="text-xl font-semibold text-white mb-2">No Active Position</p>
                  <p className="text-gray-400">Ready to place your next trade!</p>
                </div>
              )}
            </section>
          </>
        ) : (
          <>
            {/* Signals View */}
            <section className="mb-10">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span>📈</span> BTCUSDT Signal
              </h3>
              
              {/* Filter Buttons */}
              <div className="flex gap-3 mb-4">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'buy', label: 'Buy' },
                  { key: 'strong', label: 'Strong' },
                ].map(f => (
                  <button
                    key={f.key}
                    onClick={() => setSignalFilter(f.key as any)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      signalFilter === f.key ? 'bg-green-500 text-white' : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Signals List */}
              {filteredSignals.map((signal) => (
                <div
                  key={signal.symbol}
                  className={`p-0.5 rounded-2xl ${
                    signal.signal === 'STRONG_BUY' ? 'bg-green-500' :
                    signal.signal.includes('BUY') ? 'bg-green-400' :
                    signal.signal.includes('SELL') ? 'bg-red-500' : 'bg-gray-500'
                  }`}
                >
                  <div className="bg-gray-900 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{getSignalIcon(signal.signal)}</span>
                        <div>
                          <h3 className="text-2xl font-bold">{signal.symbol.replace('USDT', '/USDT')}</h3>
                          <span className={`text-sm px-3 py-1 rounded-full ${
                            signal.signal === 'STRONG_BUY' ? 'bg-green-500/30 text-green-300' :
                            signal.signal.includes('BUY') ? 'bg-green-400/30 text-green-300' :
                            'bg-gray-500/30 text-gray-300'
                          }`}>
                            {signal.signal}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold">${signal.price.toFixed(2)}</p>
                        <p className="text-gray-400">Score: {signal.score > 0 ? '+' : ''}{signal.score}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        <p className="text-gray-400 text-xs">RSI</p>
                        <p className={`text-xl font-bold ${
                          signal.rsi < 30 ? 'text-green-400' :
                          signal.rsi > 70 ? 'text-red-400' : 'text-white'
                        }`}>
                          {signal.rsi.toFixed(1)}
                        </p>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        <p className="text-gray-400 text-xs">MACD</p>
                        <p className={`text-xl font-bold ${signal.macd > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {signal.macd > 0 ? '+' : ''}{signal.macd.toFixed(4)}
                        </p>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        <p className="text-gray-400 text-xs">Volume</p>
                        <p className="text-xl font-bold text-white">{signal.volume.toFixed(2)}x</p>
                      </div>
                    </div>

                    {signal.reasons.length > 0 && (
                      <div className="mt-4 space-y-1">
                        <p className="text-gray-400 text-sm">Reasons:</p>
                        {signal.reasons.map((reason, i) => (
                          <p key={i} className="text-sm text-gray-300">• {reason}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </section>
          </>
        )}

        {/* Last Update */}
        <p className="text-center text-gray-500 text-sm mt-8">
          Last updated: {lastUpdate} • Auto-refresh every 10s • Live BTC price
        </p>

        {/* Footer */}
        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>Ellie Trading Dashboard 💜</p>
          <p className="mt-1">Powered by Ellie AI • Binance Futures</p>
        </footer>
      </div>
    </div>
  )
}