'use client'
import { useState, useEffect } from 'react'

export default function MarketData() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 假设你有后端接口，这里直接调用一个常用的外部汇率 API 作为演示
    fetch('https://api.exchangerate-api.com/v4/latest/USD')
      .then(res => res.json())
      .then(data => {
        setData({
          EURUSD: (1 / data.rates.EUR).toFixed(4),
          GBPUSD: (1 / data.rates.GBP).toFixed(4),
          USDJPY: data.rates.JPY.toFixed(2),
        })
        setLoading(false)
      })
      .catch(err => console.error(err))
  }, [])

  if (loading) return <div className="text-gray-400">Loading Market Data...</div>

  return (
    <div className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-6 my-8">
      <h2 className="text-xl font-bold mb-4 text-white">Live Forex Rates</h2>
      <div className="grid grid-cols-3 gap-4">
        {Object.entries(data).map(([pair, price]) => (
          <div key={pair} className="bg-indigo-600/5 p-4 rounded-lg">
            <div className="text-indigo-400 font-semibold">{pair}</div>
            <div className="text-2xl font-bold text-white">{price as string}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
