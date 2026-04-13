'use client'

import { useState, useEffect } from 'react'

interface Trade {
  id: string
  symbol: string
  direction: string
  status: string
  entry_price: number
  entry_date: string
  entry_size_usdc: number
  exit_price?: number
  exit_date?: string
  exit_reason?: string
  pnl_usdc: number
  pnl_pct: number
  thesis?: string
  emotion?: string
  thesis_correct?: boolean
  execution_correct?: boolean
}

interface Stats {
  total_trades: number
  wins: number
  losses: number
  win_rate: number
  total_pnl: number
  best_trade: number
  worst_trade: number
  avg_win: number
  avg_loss: number
}

export default function TradingJournal() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const res = await fetch('/trades.json')
      const data = await res.json()
      setTrades(data.trades || [])
      setLastUpdate(new Date().toLocaleString())
    } catch (error) {
      console.error('Error fetching trades:', error)
    }
    setLoading(false)
  }

  // Calculate stats
  const stats: Stats = trades.length > 0 ? {
    total_trades: trades.length,
    wins: trades.filter(t => t.pnl_usdc > 0).length,
    losses: trades.filter(t => t.pnl_usdc <= 0).length,
    win_rate: Math.round((trades.filter(t => t.pnl_usdc > 0).length / trades.length) * 100),
    total_pnl: trades.reduce((sum, t) => sum + t.pnl_usdc, 0),
    best_trade: Math.max(...trades.map(t => t.pnl_pct)),
    worst_trade: Math.min(...trades.map(t => t.pnl_pct)),
    avg_win: trades.filter(t => t.pnl_usdc > 0).length > 0 
      ? trades.filter(t => t.pnl_usdc > 0).reduce((sum, t) => sum + t.pnl_usdc, 0) / trades.filter(t => t.pnl_usdc > 0).length 
      : 0,
    avg_loss: trades.filter(t => t.pnl_usdc < 0).length > 0 
      ? trades.filter(t => t.pnl_usdc < 0).reduce((sum, t) => sum + t.pnl_usdc, 0) / trades.filter(t => t.pnl_usdc < 0).length 
      : 0,
  } : {
    total_trades: 0,
    wins: 0,
    losses: 0,
    win_rate: 0,
    total_pnl: 0,
    best_trade: 0,
    worst_trade: 0,
    avg_win: 0,
    avg_loss: 0
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2">📊 Ellie Trading Journal</h1>
        <p className="text-gray-400">
          AI-powered trading performance tracker
          {lastUpdate && <span className="ml-4 text-sm">Updated: {lastUpdate}</span>}
        </p>
      </header>

      {/* Stats Cards */}
      <section className="mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Trades */}
          <div className="bg-gray-800 rounded-xl p-6 text-center">
            <p className="text-gray-400 text-sm mb-2">Total Trades</p>
            <p className="text-4xl font-bold text-white">{stats.total_trades}</p>
          </div>

          {/* Win Rate */}
          <div className="bg-gray-800 rounded-xl p-6 text-center">
            <p className="text-gray-400 text-sm mb-2">Win Rate</p>
            <p className={`text-4xl font-bold ${stats.win_rate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.win_rate}%
            </p>
          </div>

          {/* Total P&L */}
          <div className="bg-gray-800 rounded-xl p-6 text-center">
            <p className="text-gray-400 text-sm mb-2">Total P&L</p>
            <p className={`text-4xl font-bold ${stats.total_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.total_pnl >= 0 ? '+' : ''}{stats.total_pnl.toFixed(2)} USD
            </p>
          </div>

          {/* Win/Loss */}
          <div className="bg-gray-800 rounded-xl p-6 text-center">
            <p className="text-gray-400 text-sm mb-2">Win / Loss</p>
            <p className="text-4xl font-bold">
              <span className="text-green-400">{stats.wins}</span>
              <span className="text-gray-500 mx-1">/</span>
              <span className="text-red-400">{stats.losses}</span>
            </p>
          </div>
        </div>
      </section>

      {/* Secondary Stats */}
      <section className="mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-sm">Best Trade</p>
            <p className="text-xl font-bold text-green-400">+{stats.best_trade.toFixed(2)}%</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-sm">Worst Trade</p>
            <p className="text-xl font-bold text-red-400">{stats.worst_trade.toFixed(2)}%</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-sm">Avg Win</p>
            <p className="text-xl font-bold text-green-400">+{stats.avg_win.toFixed(2)} USD</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-sm">Avg Loss</p>
            <p className="text-xl font-bold text-red-400">{stats.avg_loss.toFixed(2)} USD</p>
          </div>
        </div>
      </section>

      {/* Trades Table */}
      <section>
        <h2 className="text-xl font-semibold mb-4">📋 Trade History</h2>
        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading...</div>
        ) : trades.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center text-gray-400">
            No trades yet. Start trading to see your performance!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-700">
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Symbol</th>
                  <th className="pb-3">Direction</th>
                  <th className="pb-3">Entry</th>
                  <th className="pb-3">Exit</th>
                  <th className="pb-3">P&L</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((trade) => (
                  <tr key={trade.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="py-3 text-sm">{trade.entry_date}</td>
                    <td className="py-3 font-bold">{trade.symbol.replace('USDT', '')}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${trade.direction === 'LONG' ? 'bg-green-600' : 'bg-red-600'}`}>
                        {trade.direction}
                      </span>
                    </td>
                    <td className="py-3">${trade.entry_price}</td>
                    <td className="py-3">${trade.exit_price || '---'}</td>
                    <td className={`py-3 font-bold ${trade.pnl_usdc >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {trade.pnl_usdc >= 0 ? '+' : ''}{trade.pnl_usdc.toFixed(2)} ({trade.pnl_pct >= 0 ? '+' : ''}{trade.pnl_pct.toFixed(1)}%)
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs ${trade.status === 'CLOSED' ? 'bg-gray-600' : 'bg-yellow-600'}`}>
                        {trade.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="mt-12 text-center text-gray-500 text-sm">
        <p>Ellie Trading Journal | Binance Connected | Risk: 2% per trade</p>
        <p className="mt-1">⚠️ This is a tracking dashboard. Real trading requires funding.</p>
      </footer>
    </div>
  )
}