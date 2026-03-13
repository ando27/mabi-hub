'use client'
import { useState, useMemo, useCallback } from 'react'
import Sidebar from '@/components/Sidebar'
import { Upload, RefreshCw, AlertCircle } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, Area, AreaChart,
  PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PCT_COLS = ['% Delivered', '% Opened', '% Clicked Email', 'Clicked to Open Ratio']
const IEEE_BLUE = '#006699'
const CHART_COLORS = ['#006699', '#00a3cc', '#66c2d7', '#003d5c', '#0088bb', '#99d6e8']

const findCol = (data, keywords) => {
  if (!data || data.length === 0) return null
  const columns = Object.keys(data[0])
  for (const kw of keywords) {
    const match = columns.find(c => c.toLowerCase().includes(kw.toLowerCase()))
    if (match) return match
  }
  return null
}

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
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))

  const rows = lines.slice(1).map(line => {
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

  const filtered = rows.filter(row => {
    const joined = Object.values(row).map(String).join(' ').toLowerCase()
    return !joined.includes('total') && !joined.includes('summary') && !joined.includes('grand')
  })

  if (filtered.length === 0) return []

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
    if (v < breaks[0]) group = `Under ${breaks[0].toLocaleString()}`
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

const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="bg-white border border-gray-100 shadow-lg rounded-lg p-3 text-sm">
      <p className="font-semibold text-gray-700 mb-1 max-w-[180px] truncate">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="text-xs">
          {p.name}: {formatter ? formatter(p.value) : p.value}
        </p>
      ))}
    </div>
  )
}

function RateBarChart({ data }) {
  const nameCol = findCol(data, ['name', 'campaign'])
  if (!nameCol) return null

  const chartData = data.slice(0, 15).map(row => {
    const opensCol = findCol(data, ['unique opens', 'opens', 'opened'])
    const clicksCol = findCol(data, ['unique clicks', 'clicks', 'clicked'])
    const delCol = findCol(data, ['delivered'])
    const del = parseNum(row[delCol])
    const opens = parseNum(row[opensCol])
    const clicks = parseNum(row[clicksCol])
    return {
      name: (row[nameCol] || '').length > 20 ? (row[nameCol] || '').slice(0, 20) + '…' : (row[nameCol] || ''),
      'Open Rate': del > 0 ? +((opens / del) * 100).toFixed(1) : 0,
      'Click Rate': del > 0 ? +((clicks / del) * 100).toFixed(1) : 0,
    }
  })

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">Open & Click Rate by Campaign</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} angle={-35} textAnchor="end" interval={0} />
          <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={v => v + '%'} />
          <Tooltip content={<CustomTooltip formatter={v => v + '%'} />} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          <Bar dataKey="Open Rate" fill={IEEE_BLUE} radius={[4, 4, 0, 0]} />
          <Bar dataKey="Click Rate" fill="#00a3cc" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function SendVolumeChart({ data }) {
  const nameCol = findCol(data, ['name', 'campaign'])
  const dateCol = findCol(data, ['date', 'send date', 'sent date'])
  const sentCol = findCol(data, ['total sent', 'sent'])
  const opensCol = findCol(data, ['unique opens', 'opens', 'opened'])
  if (!sentCol) return null

  // Sort by date if available, otherwise use index order
  const sorted = dateCol
    ? [...data].sort((a, b) => new Date(a[dateCol]) - new Date(b[dateCol]))
    : data

  const chartData = sorted.slice(0, 15).map((row, i) => ({
    name: dateCol
      ? (row[dateCol] || '').slice(0, 7) // "2024-10"
      : (nameCol ? (row[nameCol] || '').slice(0, 12) + '…' : `#${i + 1}`),
    Sent: parseNum(row[sentCol]),
    Opens: opensCol ? parseNum(row[opensCol]) : 0,
  }))

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">Send Volume & Opens Over Time</h3>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="sentGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={IEEE_BLUE} stopOpacity={0.15} />
              <stop offset="95%" stopColor={IEEE_BLUE} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="opensGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00a3cc" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#00a3cc" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} />
          <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={v => v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v} />
          <Tooltip content={<CustomTooltip formatter={v => v.toLocaleString()} />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Area type="monotone" dataKey="Sent" stroke={IEEE_BLUE} strokeWidth={2} fill="url(#sentGrad)" />
          <Area type="monotone" dataKey="Opens" stroke="#00a3cc" strokeWidth={2} fill="url(#opensGrad)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function VolumePieChart({ data }) {
  const grouped = {}
  data.forEach(row => {
    const g = row['Volume Group'] || 'Other'
    grouped[g] = (grouped[g] || 0) + 1
  })
  const chartData = Object.entries(grouped).map(([name, value]) => ({ name, value }))
  if (chartData.length === 0) return null

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">Campaigns by Send Volume</h3>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie data={chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
            dataKey="value" nameKey="name" paddingAngle={3}
            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
            labelLine={{ stroke: '#d1d5db', strokeWidth: 1 }}
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => [`${v} campaigns`, 'Count']} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

function MultiSelectDropdown({ label, options, selected, onChange }) {
  const [open, setOpen] = useState(false)
  const allSelected = selected.length === 0
  const displayLabel = allSelected
    ? 'All'
    : selected.length === 1
    ? selected[0].length > 22 ? selected[0].slice(0, 22) + '…' : selected[0]
    : `${selected.length} selected`

  const toggle = (val) => {
    if (selected.includes(val)) onChange(selected.filter(v => v !== val))
    else onChange([...selected, val])
  }

  return (
    <div className="relative">
      <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">{label}</label>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-colors"
      >
        <span className={allSelected ? 'text-gray-400' : 'text-gray-700 font-medium'}>{displayLabel}</span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
          {/* Select All */}
          <button
            onClick={() => { onChange([]); setOpen(false) }}
            className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 border-b border-gray-100 ${allSelected ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}
          >
            <span className={`w-4 h-4 rounded border flex items-center justify-center text-xs ${allSelected ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-300'}`}>
              {allSelected && '✓'}
            </span>
            All campaigns
          </button>
          {options.map(opt => {
            const checked = selected.includes(opt)
            return (
              <button
                key={opt}
                onClick={() => toggle(opt)}
                className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 transition-colors"
              >
                <span className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center text-xs ${checked ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-300'}`}>
                  {checked && '✓'}
                </span>
                <span className="truncate text-gray-700">{opt}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ControlPanel({ data, filters, setFilters }) {
  if (!data || data.length === 0) return null
  const cols = Object.keys(data[0])
  const nameCol = findCol(data, ['name', 'campaign'])
  const nameOptions = nameCol ? [...new Set(data.map(r => r[nameCol]))] : []
  const numCols = ['Total Sent', 'Delivered', 'Unique Opens', 'Unique Clicks', 'Bounced'].filter(c => cols.includes(c))
  const selectedNames = filters[nameCol]?.includes || []

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
      <h3 className="text-sm font-semibold text-gray-700">⚙️ Filters</h3>

      {nameCol && (
        <MultiSelectDropdown
          label="Campaign Name"
          options={nameOptions}
          selected={selectedNames}
          onChange={vals => setFilters(f => ({ ...f, [nameCol]: { ...f[nameCol], includes: vals } }))}
        />
      )}

      {numCols.map(col => (
        <div key={col}>
          <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">{col}</label>
          <div className="grid grid-cols-2 gap-2">
            <input placeholder="Min"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
              value={filters[col]?.min || ''}
              onChange={e => setFilters(f => ({ ...f, [col]: { ...f[col], min: e.target.value } }))}
            />
            <input placeholder="Max"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
              value={filters[col]?.max || ''}
              onChange={e => setFilters(f => ({ ...f, [col]: { ...f[col], max: e.target.value } }))}
            />
          </div>
        </div>
      ))}

      <button onClick={() => setFilters({})}
        className="w-full text-xs text-gray-400 hover:text-red-400 py-2 border border-gray-100 rounded-lg hover:bg-red-50 transition-colors">
        Clear all filters
      </button>
    </div>
  )
}

function DataTable({ data }) {
  if (!data || data.length === 0) return null
  const displayCols = Object.keys(data[0]).filter(c => c !== 'Volume Group').slice(0, 9)
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
      if (f.includes && f.includes.length > 0) res = res.filter(r => f.includes.includes(String(r[col])))
      if (f.min !== undefined && f.min !== '') res = res.filter(r => parseNum(r[col]) >= parseFloat(f.min))
      if (f.max !== undefined && f.max !== '') res = res.filter(r => parseNum(r[col]) <= parseFloat(f.max))
    })
    return res
  }, [processedData, filters])

  const metrics = useMemo(() => {
    if (!filteredData.length) return []
    const sentCol   = findCol(filteredData, ['total sent', 'sent'])
    const delCol    = findCol(filteredData, ['delivered'])
    const opensCol  = findCol(filteredData, ['unique opens', 'opens', 'opened'])
    const clicksCol = findCol(filteredData, ['unique clicks', 'total clicks', 'clicks', 'clicked'])
    const unsubCol  = findCol(filteredData, ['unsubscribe'])
    const sum = col => col ? filteredData.reduce((s, r) => s + parseNum(r[col]), 0) : 0
    const totalSent   = sum(sentCol)
    const totalDel    = sum(delCol)
    const totalOpens  = sum(opensCol)
    const totalClicks = sum(clicksCol)
    const totalUnsub  = sum(unsubCol)
    const openRate    = totalDel   > 0 ? (totalOpens  / totalDel)   * 100 : 0
    const clickRate   = totalDel   > 0 ? (totalClicks / totalDel)   * 100 : 0
    const ctor        = totalOpens > 0 ? (totalClicks / totalOpens) * 100 : 0
    return [
      { label: 'Total Sent',          value: totalSent.toLocaleString() },
      { label: 'Total Delivered',     value: totalDel.toLocaleString() },
      { label: 'Weighted Open Rate',  value: openRate.toFixed(2) + '%',  sub: `${totalOpens.toLocaleString()} unique opens` },
      { label: 'Weighted Click Rate', value: clickRate.toFixed(2) + '%', sub: `${totalClicks.toLocaleString()} unique clicks` },
      { label: 'Click-to-Open Rate',  value: ctor.toFixed(2) + '%' },
      { label: 'Total Unsubscribes',  value: totalUnsub.toLocaleString() },
    ]
  }, [filteredData])

  const handleReset = () => { setProcessedData(null); setFilters({}); setFileName('') }

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
              <button onClick={handleReset} className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 transition-colors">
                <RefreshCw className="w-4 h-4" /> Reset
              </button>
            )}
          </div>
          <div className="h-px bg-gradient-to-r from-blue-300 to-transparent mt-4" />
        </div>

        {!processedData ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
            <label htmlFor="dashboard-upload"
              className={`relative flex flex-col items-center justify-center w-full max-w-lg h-56 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer bg-white hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 shadow-sm ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="flex flex-col items-center gap-3">
                {loading
                  ? <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
                  : <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-blue-50">
                      <Upload className="w-6 h-6" style={{ color: '#006699' }} />
                    </div>
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
          <div className="grid grid-cols-[240px_1fr] gap-6">

            {/* Left: filters */}
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <p className="text-xs text-gray-400 mb-0.5">File loaded</p>
                <p className="text-sm font-medium text-gray-700 truncate">{fileName}</p>
                <p className="text-xs text-gray-400 mt-1">{filteredData.length} campaigns</p>
              </div>
              <ControlPanel data={processedData} filters={filters} setFilters={setFilters} />
            </div>

            {/* Right: dashboard */}
            <div className="space-y-5">

              {/* Metric cards */}
              <div className="grid grid-cols-3 gap-4">
                {metrics.map((m, i) => <MetricCard key={i} {...m} />)}
              </div>

              {/* Charts row 1 */}
              <div className="grid grid-cols-2 gap-5">
                <SendVolumeChart data={filteredData} />
                <VolumePieChart data={filteredData} />
              </div>

              {/* Charts row 2 */}
              <RateBarChart data={filteredData} />

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
