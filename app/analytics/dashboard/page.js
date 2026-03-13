'use client'
import { useState, useMemo, useCallback } from 'react'
import Sidebar from '@/components/Sidebar'
import { Upload, RefreshCw, AlertCircle } from 'lucide-react'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PCT_COLS = ['% Delivered', '% Opened', '% Clicked Email', 'Clicked to Open Ratio']

const findCol = (data, keywords) => {
  if (!data || data.length === 0) return null
  const columns = Object.keys(data[0])
  for (const kw of keywords) {
    const match = columns.find(c => c.toLowerCase().includes(kw.toLowerCase()))
    if (match) return match
  }
  return null
}

// Handles "23.1%", 23.1, or 0.231 → always returns 0–1 float
const parseRate = (val) => {
  if (val === null || val === undefined || val === '') return null
  if (typeof val === 'number') return val > 1 ? val / 100 : val
  if (typeof val === 'string') {
    const n = parseFloat(val.replace(/[%,\s]/g, ''))
    if (isNaN(n)) return null
    return n > 1 ? n / 100 : n
  }
  return null
}

const parseNum = (val) => {
  if (typeof val === 'number') return isNaN(val) ? 0 : val
  if (typeof val === 'string') {
    const n = parseInt(val.replace(/,/g, ''), 10)
    return isNaN(n) ? 0 : n
  }
  return 0
}

// ─── CSV Processing ───────────────────────────────────────────────────────────

const processCSV = (text) => {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []

  // Parse headers
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))

  const rows = lines.slice(1).map(line => {
    // Handle quoted commas
    const values = []
    let cur = '', inQ = false
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; continue }
      if (ch === ',' && !inQ) { values.push(cur.trim()); cur = ''; continue }
      cur += ch
    }
    values.push(cur.trim())

    const row = {}
    headers.forEach((h, i) => { row[h] = values[i] ?? '' })
    return row
  })

  // Filter out summary rows
  const filtered = rows.filter(row => {
    const joined = Object.values(row).map(String).join(' ').toLowerCase()
    return !joined.includes('total') && !joined.includes('summary') && !joined.includes('grand')
  })

  if (filtered.length === 0) return []

  // Normalize column names & cast types
  const origKeys = Object.keys(filtered[0])
  const keyMap = {}
  origKeys.forEach(col => {
    const cl = col.toLowerCase()
    let nk = col
    if (['click to open', 'ctor', 'clicked to open'].some(x => cl.includes(x))) nk = 'Clicked to Open Ratio'
    else if (cl.includes('% del')) nk = '% Delivered'
    else if (cl.includes('% open') || cl === 'open rate') nk = '% Opened'
    else if (cl.includes('% click') || cl === 'click rate') nk = '% Clicked Email'
    keyMap[col] = nk
  })

  return filtered.map(row => {
    const out = {}
    Object.keys(row).forEach(old => {
      const nk = keyMap[old]
      let val = row[old]

      if (PCT_COLS.includes(nk)) {
        val = parseRate(val)
      } else {
        // Volume columns — includes "opens" so "Unique Opens" is caught
        const volKW = ['sent', 'delivered', 'opens', 'clicks', 'bounced', 'unsubscribe']
        if (volKW.some(k => nk.toLowerCase().includes(k)) && !PCT_COLS.includes(nk)) {
          val = parseNum(val)
        }
      }
      out[nk] = val
    })
    return out
  })
}

const addVolumeTiers = (data, cutoffs = [5000, 10000]) => {
  const sentCol = findCol(data, ['total sent', 'sent'])
  if (!sentCol) return data
  const breaks = [...cutoffs].sort((a, b) => a - b)
  return data.map(row => {
    const v = parseNum(row[sentCol])
    let group = ''
    if (v < breaks[0]) group = `0–${breaks[0].toLocaleString()}`
    else if (v >= breaks[breaks.length - 1]) group = `${breaks[breaks.length - 1].toLocaleString()}+`
    else {
      for (let i = 0; i < breaks.length - 1; i++) {
        if (v >= breaks[i] && v < breaks[i + 1]) {
          group = `${breaks[i].toLocaleString()}–${breaks[i + 1].toLocaleString()}`
          break
        }
      }
    }
    return { ...row, 'Volume Group': group }
  })
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetricCard({ label, value, sub }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

function ControlPanel({ data, filters, setFilters }) {
  if (!data || data.length === 0) return null
  const cols = Object.keys(data[0])
  const nameCol = findCol(data, ['name', 'campaign'])
  const nameOptions = nameCol ? [...new Set(data.map(r => r[nameCol]))] : []
  const numCols = ['Total Sent', 'Delivered', 'Unique Opens', 'Unique Clicks', 'Bounced'].filter(c => cols.includes(c))

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">⚙️ Filters</h3>

      {nameCol && (
        <div>
          <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Campaign Name</label>
          <select
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
            value={filters[nameCol]?.equals || ''}
            onChange={e => setFilters(f => ({ ...f, [nameCol]: { ...f[nameCol], equals: e.target.value } }))}
          >
            <option value="">All</option>
            {nameOptions.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      )}

      {numCols.map(col => (
        <div key={col}>
          <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">{col}</label>
          <div className="grid grid-cols-2 gap-2">
            <input
              placeholder="Min"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
              value={filters[col]?.min || ''}
              onChange={e => setFilters(f => ({ ...f, [col]: { ...f[col], min: e.target.value } }))}
            />
            <input
              placeholder="Max"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
              value={filters[col]?.max || ''}
              onChange={e => setFilters(f => ({ ...f, [col]: { ...f[col], max: e.target.value } }))}
            />
          </div>
        </div>
      ))}

      <button
        onClick={() => setFilters({})}
        className="w-full text-xs text-gray-400 hover:text-red-400 py-2 border border-gray-100 rounded-lg hover:bg-red-50 transition-colors"
      >
        Clear all filters
      </button>
    </div>
  )
}

function DataTable({ data }) {
  if (!data || data.length === 0) return null
  const allCols = Object.keys(data[0])
  const displayCols = allCols.filter(c => c !== 'Volume Group').slice(0, 9)

  const fmt = (key, val) => {
    if (PCT_COLS.includes(key) && val !== null && val !== undefined) return (val * 100).toFixed(2) + '%'
    if (typeof val === 'number') return val.toLocaleString()
    return val ?? '—'
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="border-b border-gray-100">
            {displayCols.map(h => (
              <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 50).map((row, i) => (
            <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
              {displayCols.map((key, j) => (
                <td key={j} className="px-4 py-3 text-gray-700 whitespace-nowrap">{fmt(key, row[key])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length > 50 && (
        <p className="text-xs text-gray-400 text-center p-3 border-t border-gray-100">
          Showing first 50 of {data.length} rows
        </p>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AnalyticsDashboard() {
  const [processedData, setProcessedData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({})
  const [fileName, setFileName] = useState('')

  const handleFile = useCallback(async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    try {
      const text = await file.text()
      const raw = processCSV(text)
      const tiered = addVolumeTiers(raw)
      setProcessedData(tiered)
      setFileName(file.name)
      setFilters({})
    } catch (err) {
      console.error(err)
      alert('Error parsing file. Please check the format.')
    } finally {
      setLoading(false)
    }
  }, [])

  const filteredData = useMemo(() => {
    if (!processedData) return []
    let res = [...processedData]
    Object.keys(filters).forEach(col => {
      const f = filters[col]
      if (f.equals && f.equals !== '') res = res.filter(r => String(r[col]) === String(f.equals))
      if (f.min !== undefined && f.min !== '') res = res.filter(r => parseNum(r[col]) >= parseFloat(f.min))
      if (f.max !== undefined && f.max !== '') res = res.filter(r => parseNum(r[col]) <= parseFloat(f.max))
    })
    return res
  }, [processedData, filters])

  const metrics = useMemo(() => {
    if (!filteredData.length) return []

    // Priority order matters — "unique opens" must come before "opens" to avoid matching "total opens"
    const sentCol   = findCol(filteredData, ['total sent', 'sent'])
    const delCol    = findCol(filteredData, ['delivered'])
    const opensCol  = findCol(filteredData, ['unique opens', 'opens', 'opened'])
    const clicksCol = findCol(filteredData, ['unique clicks', 'total clicks', 'clicks', 'clicked'])
    const unsubCol  = findCol(filteredData, ['unsubscribe'])

    const sum = (col) => col ? filteredData.reduce((s, r) => s + parseNum(r[col]), 0) : 0

    const totalSent   = sum(sentCol)
    const totalDel    = sum(delCol)
    const totalOpens  = sum(opensCol)
    const totalClicks = sum(clicksCol)
    const totalUnsub  = sum(unsubCol)

    const openRate  = totalDel   > 0 ? (totalOpens  / totalDel)   * 100 : 0
    const clickRate = totalDel   > 0 ? (totalClicks / totalDel)   * 100 : 0
    const ctor      = totalOpens > 0 ? (totalClicks / totalOpens) * 100 : 0

    return [
      { label: 'Total Sent',          value: totalSent.toLocaleString() },
      { label: 'Total Delivered',     value: totalDel.toLocaleString() },
      { label: 'Weighted Open Rate',  value: openRate.toFixed(2) + '%',  sub: `${totalOpens.toLocaleString()} unique opens` },
      { label: 'Weighted Click Rate', value: clickRate.toFixed(2) + '%', sub: `${totalClicks.toLocaleString()} unique clicks` },
      { label: 'Click-to-Open Rate',  value: ctor.toFixed(2) + '%' },
      { label: 'Total Unsubscribes',  value: totalUnsub.toLocaleString() },
    ]
  }, [filteredData])

  const handleReset = () => {
    setProcessedData(null)
    setFilters({})
    setFileName('')
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="ml-64 flex-1 p-8">

        {/* Header */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Performance Analytics</p>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Email Analytics Dashboard</h1>
              <p className="text-sm text-gray-500">Upload a Marketo CSV export to analyze campaign performance.</p>
            </div>
            {processedData && (
              <button
                onClick={handleReset}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" /> Reset
              </button>
            )}
          </div>
          <div className="h-px bg-gradient-to-r from-blue-300 to-transparent mt-4" />
        </div>

        {!processedData ? (
          /* Upload State */
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
            <label
              htmlFor="dashboard-upload"
              className={`relative flex flex-col items-center justify-center w-full max-w-lg h-56 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer bg-white hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 shadow-sm ${loading ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <div className="flex flex-col items-center gap-3">
                {loading
                  ? <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
                  : (
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-blue-50">
                      <Upload className="w-6 h-6" style={{ color: '#006699' }} />
                    </div>
                  )
                }
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-700">{loading ? 'Processing…' : 'Click to upload or drag and drop'}</p>
                  <p className="text-xs text-gray-400 mt-1">Marketo email performance CSV export</p>
                </div>
              </div>
              <input id="dashboard-upload" type="file" className="hidden" accept=".csv" onChange={handleFile} disabled={loading} />
            </label>
            <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-100 px-4 py-2 rounded-full">
              <AlertCircle className="w-3.5 h-3.5" />
              Client-side only — your data never leaves your browser.
            </div>
          </div>
        ) : (
          /* Dashboard State */
          <div className="grid grid-cols-[260px_1fr] gap-6">

            {/* Left column */}
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <p className="text-xs text-gray-400 mb-0.5">File loaded</p>
                <p className="text-sm font-medium text-gray-700 truncate">{fileName}</p>
                <p className="text-xs text-gray-400 mt-1">{filteredData.length} campaigns</p>
              </div>
              <ControlPanel data={processedData} filters={filters} setFilters={setFilters} />
            </div>

            {/* Right column */}
            <div className="space-y-5">
              {/* Metrics grid */}
              <div className="grid grid-cols-3 gap-4">
                {metrics.map((m, i) => <MetricCard key={i} {...m} />)}
              </div>

              {/* Table */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-800">Campaign Data</h3>
                  <span className="text-xs px-2 py-1 rounded-lg bg-gray-50 border border-gray-100 text-gray-400">
                    {filteredData.length} rows
                  </span>
                </div>
                <DataTable data={filteredData} />
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  )
}
