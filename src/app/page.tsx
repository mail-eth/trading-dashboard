'use client'

import { useState, useEffect } from 'react'

interface Signal {
  symbol: string
  signal: string
  score: number
  price: number
  rsi: number
  macd: number
  ema20: number
  ema200: number
  volume: number
  stopLoss: number
  takeProfit1: number
  takeProfit2: number
  reasons: string[]
}

export default function SignalScanner() {
  const [signals, setSignals] = useState<Signal[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState('')
  const [filter, setFilter] = useState<'all' | 'buy' | 'strong'>('all')

  const fetchSignals = async () => {
    setLoading(true)
    try {
      // Fetch from scanner script
      const res = await fetch('/api/signals')
      if (res.ok) {
        const data = await res.json()
        setSignals(data.signals || [])
      } else {
        // Fallback to local scanner
        const { spawn } = require('child_process')
        const scanner = spawn('bash', ['/root/.openclaw/workspace/run_signal_scanner.sh'])
        
        let output = ''
        scanner.stdout.on('data', (data: Buffer) => { output += data.toString() })
        scanner.on('close', () => {
          try {
            // Parse signals from output
            const lines = output.split('\n')
            const parsed: Signal[] = []
            
            for (const line of lines) {
              if (line.includes('BUY') || line.includes('SELL') || line.includes('NEUTRAL')) {
                const parts = line.split(':')
                if (parts.length >= 2) {
                  const symbol = parts[0].replace(/[🟢🟡🔴]/g, '').trim()
                  const signalPart = parts[1].trim()
                  
                  let signal = 'NEUTRAL'
                  let score = 0
                  
                  if (signalPart.includes('STRONG_BUY')) {
                    signal = 'STRONG_BUY'
                    score = 5
                  } else if (signalPart.includes('BUY')) {
                    signal = 'BUY'
                    score = 3
                  } else if (signalPart.includes('SELL')) {
                    signal = 'SELL'
                    score = -3
                  }
                  
                  if (symbol && signal) {
                    parsed.push({
                      symbol,
                      signal,
                      score,
                      price: 0,
                      rsi: 0,
                      macd: 0,
                      ema20: 0,
                      ema200: 0,
                      volume: 0,
                      stopLoss: 0,
                      takeProfit1: 0,
                      takeProfit2: 0,
                      reasons: []
                    })
                  }
                }
              }
            }
            
            setSignals(parsed)
          } catch (e) {
            console.error('Parse error:', e)
          }
        })
      }
    } catch (error) {
      console.error('Error:', error)
    }
    setLoading(false)
    setLastUpdate(new Date().toLocaleTimeString())
  }

  useEffect(() => {
    fetchSignals()
    const interval = setInterval(fetchSignals, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [])

  const filteredSignals = signals.filter(s => {
    if (filter === 'buy') return s.signal.includes('BUY')
    if (filter === 'strong') return s.signal === 'STRONG_BUY'
    return true
  })

  const getSignalColor = (signal: string) => {
    if (signal === 'STRONG_BUY') return 'bg-green-500'
    if (signal.includes('BUY')) return 'bg-green-400'
    if (signal.includes('SELL')) return 'bg-red-500'
    return 'bg-gray-500'
  }

  const getSignalIcon = (signal: string) => {
    if (signal === 'STRONG_BUY') return '🟢🟢'
    if (signal.includes('BUY')) return '🟢'
    if (signal.includes('SELL')) return '🔴'
    return '🟡'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-slate-900 text-white p-6">
      {/* Header */}
      <header className="text-center mb-8">
        <div className="inline-flex items-center gap-2">
          <span className="text-4xl">📊</span>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Ellie Signal Scanner
          </h1>
          <span className="text-4xl">💜</span>
        </div>
        <p className="text-gray-400 mt-2">Real-time crypto signals from Binance</p>
      </header>

      {/* Filter Buttons */}
      <div className="flex justify-center gap-3 mb-8">
        {[
          { key: 'all', label: 'All Signals', count: signals.length },
          { key: 'buy', label: 'Buy Only', count: signals.filter(s => s.signal.includes('BUY')).length },
          { key: 'strong', label: 'Strong Buy', count: signals.filter(s => s.signal === 'STRONG_BUY').length },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as any)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === f.key 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Signals Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
          <p className="text-gray-400 mt-4">Scanning markets...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSignals.map((signal) => (
            <div
              key={signal.symbol}
              className={`${getSignalColor(signal.signal)} p-0.5 rounded-2xl`}
            >
              <div className="bg-gray-900 rounded-2xl p-5 h-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getSignalIcon(signal.signal)}</span>
                    <div>
                      <h3 className="text-xl font-bold">{signal.symbol.replace('USDT', '')}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        signal.signal === 'STRONG_BUY' ? 'bg-green-500/30 text-green-300' :
                        signal.signal.includes('BUY') ? 'bg-green-400/30 text-green-300' :
                        signal.signal.includes('SELL') ? 'bg-red-500/30 text-red-300' :
                        'bg-gray-500/30 text-gray-300'
                      }`}>
                        {signal.signal}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">${signal.price.toFixed(2)}</p>
                    <p className="text-gray-400 text-sm">{signal.score > 0 ? '+' : ''}{signal.score}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-gray-800/50 rounded-lg p-2">
                    <p className="text-gray-400 text-xs">RSI</p>
                    <p className={`font-bold ${
                      signal.rsi < 30 ? 'text-green-400' :
                      signal.rsi > 70 ? 'text-red-400' :
                      'text-white'
                    }`}>
                      {signal.rsi.toFixed(1)}
                    </p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-2">
                    <p className="text-gray-400 text-xs">MACD</p>
                    <p className={`font-bold ${signal.macd > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {signal.macd.toFixed(4)}
                    </p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-2">
                    <p className="text-gray-400 text-xs">Volume</p>
                    <p className="font-bold text-white">{signal.volume.toFixed(2)}x</p>
                  </div>
                </div>

                {signal.reasons.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-gray-400 text-xs">Reasons:</p>
                    {signal.reasons.slice(0, 3).map((reason, i) => (
                      <p key={i} className="text-xs text-gray-300">• {reason}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Last Update */}
      <p className="text-center text-gray-500 text-sm mt-8">
        Last updated: {lastUpdate} • Auto-refresh every 60s
      </p>

      {/* Footer */}
      <footer className="mt-12 text-center text-gray-500 text-sm">
        <p>Ellie Signal Scanner 💜</p>
        <p className="mt-1">Powered by Ellie AI • Binance API</p>
      </footer>
    </div>
  )
}